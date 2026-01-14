//! MCP 服务器完整测试功能
//!
//! 简化实现：直接使用 stdio 和 JSON-RPC 协议测试

use log::debug;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::process::Stdio;
use std::time::Duration;
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command as TokioCommand;
use tokio::time::timeout;

/// MCP 服务器测试结果
#[derive(Serialize, Deserialize, Debug)]
pub struct McpTestResult {
    pub success: bool,
    pub message: String,
    pub details: Option<String>,
    pub server_info: Option<ServerInfo>,
    pub tools: Option<Vec<ToolInfo>>,
    pub resources: Option<Vec<ResourceInfo>>,
    pub prompts: Option<Vec<PromptInfo>>,
}

/// 服务器信息
#[derive(Serialize, Deserialize, Debug)]
pub struct ServerInfo {
    pub name: String,
    pub version: String,
    pub protocol_version: String,
}

/// 工具信息
#[derive(Serialize, Deserialize, Debug)]
pub struct ToolInfo {
    pub name: String,
    pub description: Option<String>,
}

/// 资源信息
#[derive(Serialize, Deserialize, Debug)]
pub struct ResourceInfo {
    pub uri: String,
    pub name: Option<String>,
    pub description: Option<String>,
}

/// Prompt 信息
#[derive(Serialize, Deserialize, Debug)]
pub struct PromptInfo {
    pub name: String,
    pub description: Option<String>,
}

/// 测试 stdio/local 类型的 MCP 服务器
async fn test_stdio_server(
    command: String,
    args: Vec<String>,
    _env: Option<HashMap<String, String>>,
) -> Result<McpTestResult, String> {
    // 1. 异步检查命令是否存在
    let cmd_check = if cfg!(target_os = "windows") {
        tokio::process::Command::new("where")
            .arg(&command)
            .output()
            .await
    } else {
        tokio::process::Command::new("which")
            .arg(&command)
            .output()
            .await
    };

    match cmd_check {
        Ok(output) if !output.status.success() => {
            return Ok(McpTestResult {
                success: false,
                message: format!("Command '{}' not found in PATH", command),
                details: Some(format!(
                    "Please make sure '{}' is installed and accessible",
                    command
                )),
                server_info: None,
                tools: None,
                resources: None,
                prompts: None,
            });
        }
        Err(e) => {
            return Ok(McpTestResult {
                success: false,
                message: format!("Failed to check command: {}", e),
                details: Some(e.to_string()),
                server_info: None,
                tools: None,
                resources: None,
                prompts: None,
            });
        }
        _ => {}
    }

    // 2. 尝试启动进程并进行基本的 MCP 协议测试
    let mut child = match TokioCommand::new(&command)
        .args(&args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped()) // 改为 piped 以便调试
        .kill_on_drop(true) // 确保进程在超时时被杀死
        .spawn()
    {
        Ok(c) => c,
        Err(e) => {
            return Ok(McpTestResult {
                success: false,
                message: format!("Failed to start MCP server: {}", e),
                details: Some(format!(
                    "Command: {} {}\nError: {}",
                    command,
                    args.join(" "),
                    e
                )),
                server_info: None,
                tools: None,
                resources: None,
                prompts: None,
            });
        }
    };

    let mut stdin = child.stdin.take().expect("Failed to open stdin");
    let stdout = child.stdout.take().expect("Failed to open stdout");
    let stderr = child.stderr.take().expect("Failed to open stderr");
    let mut reader = BufReader::new(stdout);
    let mut stderr_reader = BufReader::new(stderr);

    // 3. 发送初始化请求
    let init_request = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": "CC-Switch MCP Tester",
                "version": "1.0.0"
            }
        }
    });

    let request_str = format!("{}\n", serde_json::to_string(&init_request).unwrap());

    // 发送请求并等待响应（增加超时时间）
    let test_result = timeout(Duration::from_secs(30), async {
        debug!("Sending initialize request to MCP server");

        // 1. 写入 initialize 请求
        stdin.write_all(request_str.as_bytes()).await?;
        stdin.flush().await?;

        debug!("Waiting for initialize response");

        // 读取 initialize 响应（带超时）
        let mut response_line = String::new();
        timeout(
            Duration::from_secs(10),
            reader.read_line(&mut response_line),
        )
        .await??;

        debug!("Received response: {}", response_line);

        // 解析响应
        let response: Value = serde_json::from_str(&response_line)?;

        // 2. 发送 initialized 通知（MCP 协议要求）
        let initialized_notification = json!({
            "jsonrpc": "2.0",
            "method": "notifications/initialized"
        });
        let init_notif_str = format!("{}\n", serde_json::to_string(&initialized_notification)?);
        stdin.write_all(init_notif_str.as_bytes()).await?;
        stdin.flush().await?;

        // 3. 获取 tools 列表
        let tools_request = json!({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        });

        let tools_str = format!("{}\n", serde_json::to_string(&tools_request)?);
        stdin.write_all(tools_str.as_bytes()).await?;
        stdin.flush().await?;

        let mut tools_response_line = String::new();
        timeout(
            Duration::from_secs(10),
            reader.read_line(&mut tools_response_line),
        )
        .await??;
        let tools_response: Value = serde_json::from_str(&tools_response_line)?;

        // 4. 获取 resources 列表
        let resources_request = json!({
            "jsonrpc": "2.0",
            "id": 3,
            "method": "resources/list",
            "params": {}
        });

        let resources_str = format!("{}\n", serde_json::to_string(&resources_request)?);
        stdin.write_all(resources_str.as_bytes()).await?;
        stdin.flush().await?;

        let mut resources_response_line = String::new();
        timeout(
            Duration::from_secs(10),
            reader.read_line(&mut resources_response_line),
        )
        .await??;
        let resources_response: Value = serde_json::from_str(&resources_response_line)?;

        // 5. 获取 prompts 列表
        let prompts_request = json!({
            "jsonrpc": "2.0",
            "id": 4,
            "method": "prompts/list",
            "params": {}
        });

        let prompts_str = format!("{}\n", serde_json::to_string(&prompts_request)?);
        stdin.write_all(prompts_str.as_bytes()).await?;
        stdin.flush().await?;

        let mut prompts_response_line = String::new();
        timeout(
            Duration::from_secs(10),
            reader.read_line(&mut prompts_response_line),
        )
        .await??;
        let prompts_response: Value = serde_json::from_str(&prompts_response_line)?;

        Ok::<(Value, Value, Value, Value), Box<dyn std::error::Error + Send + Sync>>((
            response,
            tools_response,
            resources_response,
            prompts_response,
        ))
    })
    .await;

    // 尝试读取 stderr 输出
    let mut stderr_output = String::new();
    let _ = tokio::time::timeout(
        Duration::from_millis(100),
        stderr_reader.read_to_string(&mut stderr_output),
    )
    .await;

    // 确保进程被关闭（即使超时也要清理）
    let _ = child.kill().await;
    let _ = child.wait().await;

    match test_result {
        Ok(Ok((response, tools_response, resources_response, prompts_response))) => {
            // 解析初始化响应
            if let Some(result) = response.get("result") {
                let server_info = ServerInfo {
                    name: result
                        .get("serverInfo")
                        .and_then(|si| si.get("name"))
                        .and_then(|n| n.as_str())
                        .unwrap_or("Unknown")
                        .to_string(),
                    version: result
                        .get("serverInfo")
                        .and_then(|si| si.get("version"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("Unknown")
                        .to_string(),
                    protocol_version: result
                        .get("protocolVersion")
                        .and_then(|pv| pv.as_str())
                        .unwrap_or("Unknown")
                        .to_string(),
                };

                // 解析 tools 列表
                let tools = tools_response
                    .get("result")
                    .and_then(|r| r.get("tools"))
                    .and_then(|t| t.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|item| {
                                let name = item.get("name")?.as_str()?.to_string();
                                let description = item
                                    .get("description")
                                    .and_then(|d| d.as_str())
                                    .map(String::from);
                                Some(ToolInfo { name, description })
                            })
                            .collect::<Vec<_>>()
                    });

                // 解析 resources 列表
                let resources = resources_response
                    .get("result")
                    .and_then(|r| r.get("resources"))
                    .and_then(|t| t.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|item| {
                                let uri = item.get("uri")?.as_str()?.to_string();
                                let name =
                                    item.get("name").and_then(|n| n.as_str()).map(String::from);
                                let description = item
                                    .get("description")
                                    .and_then(|d| d.as_str())
                                    .map(String::from);
                                Some(ResourceInfo {
                                    uri,
                                    name,
                                    description,
                                })
                            })
                            .collect::<Vec<_>>()
                    });

                // 解析 prompts 列表
                let prompts = prompts_response
                    .get("result")
                    .and_then(|r| r.get("prompts"))
                    .and_then(|t| t.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|item| {
                                let name = item.get("name")?.as_str()?.to_string();
                                let description = item
                                    .get("description")
                                    .and_then(|d| d.as_str())
                                    .map(String::from);
                                Some(PromptInfo { name, description })
                            })
                            .collect::<Vec<_>>()
                    });

                Ok(McpTestResult {
                    success: true,
                    message: format!("MCP server '{}' initialized successfully", server_info.name),
                    details: Some(format!(
                        "Protocol Version: {}\nServer Version: {}\nTools: {}\nResources: {}\nPrompts: {}",
                        server_info.protocol_version,
                        server_info.version,
                        tools.as_ref().map(|t| t.len()).unwrap_or(0),
                        resources.as_ref().map(|r| r.len()).unwrap_or(0),
                        prompts.as_ref().map(|p| p.len()).unwrap_or(0)
                    )),
                    server_info: Some(server_info),
                    tools,
                    resources,
                    prompts,
                })
            } else if let Some(error) = response.get("error") {
                Ok(McpTestResult {
                    success: false,
                    message: "MCP initialization failed".to_string(),
                    details: Some(format!("Server returned error: {}", error)),
                    server_info: None,
                    tools: None,
                    resources: None,
                    prompts: None,
                })
            } else {
                Ok(McpTestResult {
                    success: false,
                    message: "Invalid MCP response".to_string(),
                    details: Some(format!("Unexpected response format: {}", response)),
                    server_info: None,
                    tools: None,
                    resources: None,
                    prompts: None,
                })
            }
        }
        Ok(Err(e)) => {
            let mut error_details = format!("Communication error: {}", e);
            if !stderr_output.is_empty() {
                error_details.push_str(&format!("\n\nServer stderr:\n{}", stderr_output));
            }
            Ok(McpTestResult {
                success: false,
                message: "Failed to communicate with MCP server".to_string(),
                details: Some(error_details),
                server_info: None,
                tools: None,
                resources: None,
                prompts: None,
            })
        }
        Err(_) => Ok(McpTestResult {
            success: false,
            message: "MCP initialization timeout".to_string(),
            details: Some("Server did not respond to initialization within 30 seconds".to_string()),
            server_info: None,
            tools: None,
            resources: None,
            prompts: None,
        }),
    }
}

/// 测试 HTTP/SSE 类型的 MCP 服务器
async fn test_http_server(
    url: String,
    headers: Option<HashMap<String, String>>,
) -> Result<McpTestResult, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let mut request = client.get(&url);

    if let Some(hdrs) = headers {
        for (key, value) in hdrs {
            request = request.header(key, value);
        }
    }

    let response = match timeout(Duration::from_secs(15), request.send()).await {
        Ok(Ok(resp)) => resp,
        Ok(Err(e)) => {
            return Ok(McpTestResult {
                success: false,
                message: "Failed to connect to remote server".to_string(),
                details: Some(format!("Connection error: {}", e)),
                server_info: None,
                tools: None,
                resources: None,
                prompts: None,
            });
        }
        Err(_) => {
            return Ok(McpTestResult {
                success: false,
                message: "Connection timeout".to_string(),
                details: Some(format!("Failed to connect to {} within 15 seconds", url)),
                server_info: None,
                tools: None,
                resources: None,
                prompts: None,
            });
        }
    };

    let status = response.status();

    if status.is_success() || status.is_client_error() {
        Ok(McpTestResult {
            success: true,
            message: format!("Remote server is reachable (HTTP {})", status.as_u16()),
            details: Some(format!(
                "URL: {}\nStatus: {}\nNote: Full MCP protocol test for remote servers requires SSE support",
                url, status
            )),
            server_info: None,
            tools: None,
            resources: None,
            prompts: None,
        })
    } else {
        Ok(McpTestResult {
            success: false,
            message: format!("Server returned HTTP {}", status.as_u16()),
            details: Some(format!(
                "The server at {} returned status code {}",
                url, status
            )),
            server_info: None,
            tools: None,
            resources: None,
            prompts: None,
        })
    }
}

/// 测试 MCP 服务器
#[tauri::command]
pub async fn test_mcp_server(spec: Value) -> Result<McpTestResult, String> {
    let server_type = spec.get("type").and_then(|v| v.as_str()).unwrap_or("stdio");

    match server_type {
        "stdio" | "local" => {
            let command = spec.get("command").ok_or("Missing 'command' field")?;

            let (cmd, args, env) = if let Some(cmd_str) = command.as_str() {
                (cmd_str.to_string(), Vec::new(), None)
            } else if let Some(cmd_array) = command.as_array() {
                let cmd = cmd_array
                    .get(0)
                    .and_then(|v| v.as_str())
                    .ok_or("Command array is empty")?
                    .to_string();
                let args: Vec<String> = cmd_array
                    .iter()
                    .skip(1)
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect();

                let env_map = spec
                    .get("environment")
                    .and_then(|v| v.as_object())
                    .map(|obj| {
                        obj.iter()
                            .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                            .collect()
                    });

                (cmd, args, env_map)
            } else {
                return Err("Invalid command format".to_string());
            };

            test_stdio_server(cmd, args, env).await
        }
        "http" | "remote" => {
            let url = spec
                .get("url")
                .and_then(|v| v.as_str())
                .ok_or("Missing 'url' field for remote server")?
                .to_string();

            let headers = spec.get("headers").and_then(|v| v.as_object()).map(|obj| {
                obj.iter()
                    .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                    .collect()
            });

            test_http_server(url, headers).await
        }
        _ => Err(format!("Unsupported server type: {}", server_type)),
    }
}

// ============================================================================
// 测试函数：用于调试，不暴露给前端
// ============================================================================

#[cfg(test)]
#[tokio::test]
async fn test_mcp_servers() {
    println!("=== MCP Server Test Suite ===\n");

    // 测试 1: stdio 类型 - mcp-server (如果安装了)
    println!("\nTest 1: stdio - mcp-server --help");
    let stdio_spec = json!({
        "type": "stdio",
        "command": ["mcp-server", "--help"]
    });

    match test_mcp_server(stdio_spec).await {
        Ok(result) => {
            println!("  Success: {}", result.success);
            println!("  Message: {}", result.message);
            if let Some(details) = result.details {
                println!("  Details: {}", details);
            }
        }
        Err(e) => {
            println!("  Error: {}", e);
        }
    }

    // 测试 2: stdio 类型 - uvx mcp-server-filesystem (如果安装了)
    println!("\nTest 2: stdio - uvx mcp-server-filesystem");
    let filesystem_spec = json!({
        "type": "stdio",
        "command": ["uvx", "mcp-server-filesystem", "/tmp"]
    });

    match test_mcp_server(filesystem_spec).await {
        Ok(result) => {
            println!("  Success: {}", result.success);
            println!("  Message: {}", result.message);
            if let Some(details) = result.details {
                println!("  Details: {}", details);
            }
            if let Some(tools) = result.tools {
                println!("  Tools count: {}", tools.len);
            }
        }
        Err(e) => {
            println!("  Error: {}", e);
        }
    }

    // 测试 3: stdio 类型 - chrome-devtools-mcp
    println!("\nTest 3: stdio - chrome-devtools-mcp");
    let chrome_spec = json!({
        "type": "stdio",
        "command": ["npx", "-y", "chrome-devtools-mcp@latest"],
        "env": {}
    });

    match test_mcp_server(chrome_spec).await {
        Ok(result) => {
            println!("  Success: {}", result.success);
            println!("  Message: {}", result.message);
            if let Some(details) = result.details {
                println!("  Details: {}", details);
            }
            if let Some(tools) = result.tools {
                println!("  Tools count: {}", tools.len);
            }
        }
        Err(e) => {
            println!("  Error: {}", e);
        }
    }

    // 测试 4: http 类型 - context7 (带 header)
    println!("\nTest 4: http - https://mcp.context7.com/mcp");
    let http_spec = json!({
        "type": "http",
        "url": "https://mcp.context7.com/mcp",
        "headers": {
            "CONTEXT7_API_KEY": "ctx7sk-f888da08-577d-4186-8109-df8779a74062"
        }
    });

    match test_mcp_server(http_spec).await {
        Ok(result) => {
            println!("  Success: {}", result.success);
            println!("  Message: {}", result.message);
            if let Some(details) = result.details {
                println!("  Details: {}", details);
            }
        }
        Err(e) => {
            println!("  Error: {}", e);
        }
    }

    // 测试 5: http/remote 类型 - alphavantage
    println!("\nTest 5: remote - https://mcp.alphavantage.co/mcp");
    let remote_spec = json!({
        "type": "remote",
        "url": "https://mcp.alphavantage.co/mcp?apikey=IWDJBS4B5USE1ATH"
    });

    match test_mcp_server(remote_spec).await {
        Ok(result) => {
            println!("  Success: {}", result.success);
            println!("  Message: {}", result.message);
            if let Some(details) = result.details {
                println!("  Details: {}", details);
            }
        }
        Err(e) => {
            println!("  Error: {}", e);
        }
    }

    println!("\n=== Test Suite Complete ===");
}
