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
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ToolInfo {
    pub name: String,
    pub description: Option<String>,
    pub input_schema: Option<Value>,
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
                                let input_schema = item.get("inputSchema").cloned();
                                Some(ToolInfo {
                                    name,
                                    description,
                                    input_schema,
                                })
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
    use log::{debug, info};

    info!("Testing HTTP MCP server at: {}", url);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    // Build headers
    let mut req_headers = reqwest::header::HeaderMap::new();
    req_headers.insert("Content-Type", "application/json".parse().unwrap());
    req_headers.insert(
        "Accept",
        "application/json, text/event-stream".parse().unwrap(),
    );

    if let Some(hdrs) = &headers {
        debug!("Adding custom headers: {:?}", hdrs);
        for (key, value) in hdrs {
            if let Ok(header_name) = reqwest::header::HeaderName::from_bytes(key.as_bytes()) {
                if let Ok(header_value) = reqwest::header::HeaderValue::from_str(value) {
                    req_headers.insert(header_name, header_value);
                }
            }
        }
    }

    // MCP initialize request
    let initialize_request = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "roots": {
                    "listChanged": true
                }
            },
            "clientInfo": {
                "name": "cc-switch-test",
                "version": "1.0.0"
            }
        }
    });

    debug!("Sending initialize request: {}", initialize_request);

    // Send initialize request
    let response = match timeout(
        Duration::from_secs(15),
        client
            .post(&url)
            .headers(req_headers.clone())
            .json(&initialize_request)
            .send(),
    )
    .await
    {
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
    debug!("Received response with status: {}", status);

    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        debug!("Error response body: {}", body);
        return Ok(McpTestResult {
            success: false,
            message: format!("Server returned HTTP {}", status.as_u16()),
            details: Some(format!(
                "The server at {} returned status code {}\nResponse: {}",
                url, status, body
            )),
            server_info: None,
            tools: None,
            resources: None,
            prompts: None,
        });
    }

    // Check if response is SSE format
    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|ct| ct.to_str().ok())
        .unwrap_or("");

    let is_sse = content_type.contains("text/event-stream");

    let response_text = if is_sse {
        // Parse SSE response
        debug!("Detected SSE response, parsing...");
        let full_text = response.text().await.unwrap_or_default();
        debug!("SSE response body: {}", full_text);

        // Extract JSON from SSE format
        // Format: "event: message\ndata: {...}\n\n"
        let json_str = full_text
            .lines()
            .filter(|line| line.starts_with("data:"))
            .filter_map(|line| line.strip_prefix("data:"))
            .next()
            .unwrap_or("");

        debug!("Extracted JSON: {}", json_str);
        json_str.to_string()
    } else {
        // Regular JSON response
        let text = response.text().await.unwrap_or_default();
        debug!("Response body: {}", text);
        text
    };

    let init_response: Value = match serde_json::from_str(&response_text) {
        Ok(v) => v,
        Err(e) => {
            return Ok(McpTestResult {
                success: false,
                message: "Invalid JSON response".to_string(),
                details: Some(format!(
                    "Failed to parse response: {}\nBody: {}",
                    e, response_text
                )),
                server_info: None,
                tools: None,
                resources: None,
                prompts: None,
            });
        }
    };

    // Check for error in response
    if let Some(error) = init_response.get("error") {
        return Ok(McpTestResult {
            success: false,
            message: "MCP initialization failed".to_string(),
            details: Some(format!("Server returned error: {}", error)),
            server_info: None,
            tools: None,
            resources: None,
            prompts: None,
        });
    }

    // Extract server info
    let server_info = init_response.get("result").and_then(|r| {
        let name = r.get("serverInfo")?.get("name")?.as_str()?.to_string();
        let version = r.get("serverInfo")?.get("version")?.as_str()?.to_string();
        let protocol_version = r
            .get("protocolVersion")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string();
        Some(ServerInfo {
            name,
            version,
            protocol_version,
        })
    });

    if server_info.is_none() {
        return Ok(McpTestResult {
            success: false,
            message: "Invalid initialize response".to_string(),
            details: Some(format!(
                "Could not parse server info from response: {}",
                init_response
            )),
            server_info: None,
            tools: None,
            resources: None,
            prompts: None,
        });
    }

    let server_info = server_info.unwrap();
    info!(
        "Connected to MCP server: {} v{}",
        server_info.name, server_info.version
    );

    // Request tools list
    let tools_request = json!({
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list",
        "params": {}
    });

    debug!("Requesting tools list");
    let tools_response = if is_sse {
        // For SSE, we need to parse the response differently
        match timeout(
            Duration::from_secs(10),
            client
                .post(&url)
                .headers(req_headers.clone())
                .json(&tools_request)
                .send(),
        )
        .await
        {
            Ok(Ok(resp)) => {
                let full_text = resp.text().await.unwrap_or_default();
                let json_str = full_text
                    .lines()
                    .filter(|line| line.starts_with("data:"))
                    .filter_map(|line| line.strip_prefix("data:"))
                    .next()
                    .unwrap_or("");
                serde_json::from_str::<Value>(json_str).ok()
            }
            _ => None,
        }
    } else {
        match timeout(
            Duration::from_secs(10),
            client
                .post(&url)
                .headers(req_headers.clone())
                .json(&tools_request)
                .send(),
        )
        .await
        {
            Ok(Ok(resp)) => resp.json::<Value>().await.ok(),
            _ => None,
        }
    };

    // Request resources list
    let resources_request = json!({
        "jsonrpc": "2.0",
        "id": 3,
        "method": "resources/list",
        "params": {}
    });

    debug!("Requesting resources list");
    let resources_response = if is_sse {
        match timeout(
            Duration::from_secs(10),
            client
                .post(&url)
                .headers(req_headers.clone())
                .json(&resources_request)
                .send(),
        )
        .await
        {
            Ok(Ok(resp)) => {
                let full_text = resp.text().await.unwrap_or_default();
                let json_str = full_text
                    .lines()
                    .filter(|line| line.starts_with("data:"))
                    .filter_map(|line| line.strip_prefix("data:"))
                    .next()
                    .unwrap_or("");
                serde_json::from_str::<Value>(json_str).ok()
            }
            _ => None,
        }
    } else {
        match timeout(
            Duration::from_secs(10),
            client
                .post(&url)
                .headers(req_headers.clone())
                .json(&resources_request)
                .send(),
        )
        .await
        {
            Ok(Ok(resp)) => resp.json::<Value>().await.ok(),
            _ => None,
        }
    };

    // Request prompts list
    let prompts_request = json!({
        "jsonrpc": "2.0",
        "id": 4,
        "method": "prompts/list",
        "params": {}
    });

    debug!("Requesting prompts list");
    let prompts_response = if is_sse {
        match timeout(
            Duration::from_secs(10),
            client
                .post(&url)
                .headers(req_headers)
                .json(&prompts_request)
                .send(),
        )
        .await
        {
            Ok(Ok(resp)) => {
                let full_text = resp.text().await.unwrap_or_default();
                let json_str = full_text
                    .lines()
                    .filter(|line| line.starts_with("data:"))
                    .filter_map(|line| line.strip_prefix("data:"))
                    .next()
                    .unwrap_or("");
                serde_json::from_str::<Value>(json_str).ok()
            }
            _ => None,
        }
    } else {
        match timeout(
            Duration::from_secs(10),
            client
                .post(&url)
                .headers(req_headers)
                .json(&prompts_request)
                .send(),
        )
        .await
        {
            Ok(Ok(resp)) => resp.json::<Value>().await.ok(),
            _ => None,
        }
    };

    // Parse tools
    let tools = tools_response.and_then(|resp| {
        resp.get("result")
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
                        let input_schema = item.get("inputSchema").cloned();
                        Some(ToolInfo {
                            name,
                            description,
                            input_schema,
                        })
                    })
                    .collect::<Vec<_>>()
            })
    });

    // Parse resources
    let resources = resources_response.and_then(|resp| {
        resp.get("result")
            .and_then(|r| r.get("resources"))
            .and_then(|r| r.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|item| {
                        let uri = item.get("uri")?.as_str()?.to_string();
                        let name = item.get("name").and_then(|n| n.as_str()).map(String::from);
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
            })
    });

    // Parse prompts
    let prompts = prompts_response.and_then(|resp| {
        resp.get("result")
            .and_then(|r| r.get("prompts"))
            .and_then(|p| p.as_array())
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
            })
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
}

/// 测试 MCP 服务器
#[tauri::command]
pub async fn test_mcp_server(spec: Value) -> Result<McpTestResult, String> {
    let server_type = spec.get("type").and_then(|v| v.as_str()).unwrap_or("stdio");

    match server_type {
        "stdio" | "local" => {
            let command = spec.get("command").ok_or("Missing 'command' field")?;

            let (cmd, args, env) = if let Some(cmd_str) = command.as_str() {
                let args_spec = spec.get("args").and_then(|v| v.as_array());
                let args: Vec<String> = args_spec
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str().map(String::from))
                            .collect()
                    })
                    .unwrap_or_default();

                let env_map = spec.get("env").and_then(|v| v.as_object()).map(|obj| {
                    obj.iter()
                        .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                        .collect()
                });

                (cmd_str.to_string(), args, env_map)
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

/// 工具测试结果
#[derive(Serialize, Deserialize, Debug)]
pub struct ToolTestResult {
    pub success: bool,
    pub message: String,
    pub details: Option<String>,
}

/// 测试 stdio 类型的 MCP 工具
async fn test_stdio_tool(
    command: String,
    args: Vec<String>,
    _env: Option<HashMap<String, String>>,
    tool_name: String,
    tool_args: Value,
) -> Result<ToolTestResult, String> {
    let mut child = match TokioCommand::new(&command)
        .args(&args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
    {
        Ok(c) => c,
        Err(e) => {
            return Ok(ToolTestResult {
                success: false,
                message: format!("Failed to start MCP server: {}", e),
                details: Some(e.to_string()),
            });
        }
    };

    let mut stdin = child.stdin.take().expect("Failed to open stdin");
    let stdout = child.stdout.take().expect("Failed to open stdout");
    let mut reader = BufReader::new(stdout);

    // Initialize connection
    let init_request = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": "CC-Switch MCP Tool Tester",
                "version": "1.0.0"
            }
        }
    });

    let request_str = format!("{}\n", serde_json::to_string(&init_request).unwrap());
    stdin
        .write_all(request_str.as_bytes())
        .await
        .map_err(|e| e.to_string())?;
    stdin.flush().await.map_err(|e| e.to_string())?;

    let mut response_line = String::new();
    timeout(
        Duration::from_secs(10),
        reader.read_line(&mut response_line),
    )
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())?;

    // Send initialized notification
    let initialized_notification = json!({
        "jsonrpc": "2.0",
        "method": "notifications/initialized"
    });
    let init_notif_str = format!(
        "{}\n",
        serde_json::to_string(&initialized_notification).map_err(|e| e.to_string())?
    );
    stdin
        .write_all(init_notif_str.as_bytes())
        .await
        .map_err(|e| e.to_string())?;
    stdin.flush().await.map_err(|e| e.to_string())?;

    // Call tool
    let tool_call_request = json!({
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": tool_args
        }
    });

    let tool_call_str = format!(
        "{}\n",
        serde_json::to_string(&tool_call_request).map_err(|e| e.to_string())?
    );
    stdin
        .write_all(tool_call_str.as_bytes())
        .await
        .map_err(|e| e.to_string())?;
    stdin.flush().await.map_err(|e| e.to_string())?;

    let mut tool_response_line = String::new();
    timeout(
        Duration::from_secs(30),
        reader.read_line(&mut tool_response_line),
    )
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())?;

    let _ = child.kill().await;
    let _ = child.wait().await;

    let response: Value = serde_json::from_str(&tool_response_line).map_err(|e| e.to_string())?;

    if let Some(result) = response.get("result") {
        Ok(ToolTestResult {
            success: true,
            message: format!("Tool '{}' executed successfully", tool_name),
            details: Some(format!("Result: {}", result)),
        })
    } else if let Some(error) = response.get("error") {
        Ok(ToolTestResult {
            success: false,
            message: format!("Tool '{}' execution failed", tool_name),
            details: Some(format!("Error: {}", error)),
        })
    } else {
        Ok(ToolTestResult {
            success: false,
            message: "Invalid tool response".to_string(),
            details: Some(format!("Response: {}", response)),
        })
    }
}

/// 测试 MCP 工具
#[tauri::command]
pub async fn test_mcp_tool(
    spec: Value,
    tool_name: String,
    tool_args: Value,
) -> Result<ToolTestResult, String> {
    let server_type = spec.get("type").and_then(|v| v.as_str()).unwrap_or("stdio");

    match server_type {
        "stdio" | "local" => {
            let command = spec.get("command").ok_or("Missing 'command' field")?;

            let (cmd, args, env) = if let Some(cmd_str) = command.as_str() {
                let args_spec = spec.get("args").and_then(|v| v.as_array());
                let args: Vec<String> = args_spec
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str().map(String::from))
                            .collect()
                    })
                    .unwrap_or_default();

                let env_map = spec.get("env").and_then(|v| v.as_object()).map(|obj| {
                    obj.iter()
                        .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                        .collect()
                });

                (cmd_str.to_string(), args, env_map)
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

            test_stdio_tool(cmd, args, env, tool_name, tool_args).await
        }
        "http" | "sse" | "remote" => {
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

            test_http_tool(url, headers, tool_name, tool_args).await
        }
        _ => Err(format!(
            "Tool testing not supported for server type: {}",
            server_type
        )),
    }
}

/// 测试 HTTP/SSE 类型的 MCP 工具
async fn test_http_tool(
    url: String,
    headers: Option<HashMap<String, String>>,
    tool_name: String,
    tool_args: Value,
) -> Result<ToolTestResult, String> {
    use log::debug;

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    // Build headers
    let mut req_headers = reqwest::header::HeaderMap::new();
    req_headers.insert("Content-Type", "application/json".parse().unwrap());
    req_headers.insert(
        "Accept",
        "application/json, text/event-stream".parse().unwrap(),
    );

    if let Some(hdrs) = &headers {
        for (key, value) in hdrs {
            if let Ok(header_name) = reqwest::header::HeaderName::from_bytes(key.as_bytes()) {
                if let Ok(header_value) = reqwest::header::HeaderValue::from_str(value) {
                    req_headers.insert(header_name, header_value);
                }
            }
        }
    }

    // Call tool
    let tool_call_request = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": tool_args
        }
    });

    debug!("Sending tool call request: {}", tool_call_request);

    let response = match timeout(
        Duration::from_secs(30),
        client
            .post(&url)
            .headers(req_headers)
            .json(&tool_call_request)
            .send(),
    )
    .await
    {
        Ok(Ok(resp)) => resp,
        Ok(Err(e)) => {
            return Ok(ToolTestResult {
                success: false,
                message: format!("Failed to call tool '{}'", tool_name),
                details: Some(format!("Connection error: {}", e)),
            });
        }
        Err(_) => {
            return Ok(ToolTestResult {
                success: false,
                message: format!("Tool '{}' call timeout", tool_name),
                details: Some("Request timed out after 30 seconds".to_string()),
            });
        }
    };

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        return Ok(ToolTestResult {
            success: false,
            message: format!("Tool '{}' call failed", tool_name),
            details: Some(format!(
                "Server returned HTTP {}: {}",
                status.as_u16(),
                body
            )),
        });
    }

    // Check if response is SSE format
    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|ct| ct.to_str().ok())
        .unwrap_or("");

    let is_sse = content_type.contains("text/event-stream");

    let response_text = if is_sse {
        let full_text = response.text().await.unwrap_or_default();
        let json_str = full_text
            .lines()
            .filter(|line| line.starts_with("data:"))
            .filter_map(|line| line.strip_prefix("data:"))
            .next()
            .unwrap_or("");
        json_str.to_string()
    } else {
        response.text().await.unwrap_or_default()
    };

    let response_value: Value = serde_json::from_str(&response_text).map_err(|e| e.to_string())?;

    if let Some(result) = response_value.get("result") {
        Ok(ToolTestResult {
            success: true,
            message: format!("Tool '{}' executed successfully", tool_name),
            details: Some(format!("Result: {}", result)),
        })
    } else if let Some(error) = response_value.get("error") {
        Ok(ToolTestResult {
            success: false,
            message: format!("Tool '{}' execution failed", tool_name),
            details: Some(format!("Error: {}", error)),
        })
    } else {
        Ok(ToolTestResult {
            success: false,
            message: "Invalid tool response".to_string(),
            details: Some(format!("Response: {}", response_value)),
        })
    }
}

// ============================================================================
// 调试测试命令：用于直接测试 MCP 服务器
// ============================================================================

#[tauri::command]
pub async fn debug_test_mcp_servers() -> Result<String, String> {
    use serde_json::json;

    let mut results = Vec::new();
    results.push("=== MCP Server Test Suite ===\n".to_string());

    // 测试 1: stdio 类型 - chrome-devtools-mcp
    results.push("\nTest 1: stdio - chrome-devtools-mcp".to_string());
    let chrome_spec = json!({
        "type": "stdio",
        "command": ["npx", "-y", "chrome-devtools-mcp@latest"],
        "env": {}
    });

    match test_mcp_server(chrome_spec).await {
        Ok(result) => {
            results.push(format!("  Success: {}", result.success));
            results.push(format!("  Message: {}", result.message));
            if let Some(details) = result.details {
                results.push(format!("  Details: {}", details));
            }
            if result.tools.is_some() {
                results.push("  Tools: Available".to_string());
            }
        }
        Err(e) => {
            results.push(format!("  Error: {}", e));
        }
    }

    // 测试 2: http 类型 - context7 (带 header)
    results.push("\nTest 2: http - https://mcp.context7.com/mcp".to_string());
    let http_spec = json!({
        "type": "http",
        "url": "https://mcp.context7.com/mcp",
        "headers": {
            "CONTEXT7_API_KEY": "ctx7sk-f888da08-577d-4186-8109-df8779a74062"
        }
    });

    match test_mcp_server(http_spec).await {
        Ok(result) => {
            results.push(format!("  Success: {}", result.success));
            results.push(format!("  Message: {}", result.message));
            if let Some(details) = result.details {
                results.push(format!("  Details: {}", details));
            }
        }
        Err(e) => {
            results.push(format!("  Error: {}", e));
        }
    }

    // 测试 3: http/remote 类型 - alphavantage
    results.push("\nTest 3: remote - https://mcp.alphavantage.co/mcp".to_string());
    let remote_spec = json!({
        "type": "remote",
        "url": "https://mcp.alphavantage.co/mcp?apikey=IWDJBS4B5USE1ATH"
    });

    match test_mcp_server(remote_spec).await {
        Ok(result) => {
            results.push(format!("  Success: {}", result.success));
            results.push(format!("  Message: {}", result.message));
            if let Some(details) = result.details {
                results.push(format!("  Details: {}", details));
            }
        }
        Err(e) => {
            results.push(format!("  Error: {}", e));
        }
    }

    results.push("\n=== Test Suite Complete ===".to_string());
    Ok(results.join("\n"))
}

// ============================================================================
// 测试函数：用于调试，不暴露给前端
// ============================================================================

#[cfg(test)]
#[tokio::test]
async fn test_mcp_servers() {
    println!("=== MCP Server Test Suite ===\n");

    // 测试 1: stdio 类型 - chrome-devtools-mcp
    println!("\nTest 1: stdio - chrome-devtools-mcp");
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
                println!("  Tools count: {}", tools.len());
            }
        }
        Err(e) => {
            println!("  Error: {}", e);
        }
    }

    // 测试 2: http 类型 - context7 (带 header)
    println!("\nTest 2: http - https://mcp.context7.com/mcp");
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

    // 测试 3: http/remote 类型 - alphavantage
    println!("\nTest 3: remote - https://mcp.alphavantage.co/mcp");
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
