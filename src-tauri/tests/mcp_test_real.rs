use cc_switch_lib::test_mcp_server;
use serde_json::json;

#[tokio::test]
async fn test_real_mcp_servers() {
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
                println!("  Tools count: {}", tools.len());
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
                println!("  Tools count: {}", tools.len());
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
