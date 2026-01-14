use cc_switch_lib::{read_opencode_config, sync_single_server_to_opencode, AppError};
use serde_json::json;

#[path = "support.rs"]
mod support;
use support::{ensure_test_home, reset_test_fs, test_mutex};

#[test]
fn test_sync_stdio_server_to_opencode() {
    let _guard = test_mutex().lock().expect("acquire test mutex");
    reset_test_fs();
    let _home = ensure_test_home();

    // 模拟一个 stdio 类型的 MCP 服务器配置（来自 Claude Code）
    let server_config = json!({
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-chrome-devtools"]
    });

    sync_single_server_to_opencode(&(), "chrome-devtools", &server_config)
        .expect("sync should succeed");

    let config = read_opencode_config().expect("read should succeed");
    let mcp = config
        .get("mcp")
        .and_then(|m| m.as_object())
        .expect("mcp should exist");
    let chrome_devtools = mcp
        .get("chrome-devtools")
        .and_then(|c| c.as_object())
        .expect("chrome-devtools should exist");

    // 验证类型被正确转换为 "local"
    assert_eq!(
        chrome_devtools.get("type"),
        Some(&json!("local")),
        "type should be converted from stdio to local"
    );

    // 验证 command 被正确合并为数组
    assert_eq!(
        chrome_devtools.get("command"),
        Some(&json!([
            "npx",
            "-y",
            "@modelcontextprotocol/server-chrome-devtools"
        ])),
        "command should be merged with args into array"
    );

    // 验证添加了 environment 字段
    assert_eq!(
        chrome_devtools.get("environment"),
        Some(&json!({})),
        "environment should be added for local type"
    );

    // 验证 enabled 字段
    assert_eq!(
        chrome_devtools.get("enabled"),
        Some(&json!(true)),
        "enabled should be true"
    );
}

#[test]
fn test_sync_http_server_to_opencode() {
    let _guard = test_mutex().lock().expect("acquire test mutex");
    reset_test_fs();
    let _home = ensure_test_home();

    // 模拟一个 http 类型的 MCP 服务器配置
    let server_config = json!({
        "type": "http",
        "url": "https://mcp.example.com/sse",
        "headers": {
            "Authorization": "Bearer token123"
        }
    });

    sync_single_server_to_opencode(&(), "remote-server", &server_config)
        .expect("sync should succeed");

    let config = read_opencode_config().expect("read should succeed");
    let mcp = config
        .get("mcp")
        .and_then(|m| m.as_object())
        .expect("mcp should exist");
    let remote_server = mcp
        .get("remote-server")
        .and_then(|r| r.as_object())
        .expect("remote-server should exist");

    // 验证类型被正确转换为 "remote"
    assert_eq!(
        remote_server.get("type"),
        Some(&json!("remote")),
        "type should be converted from http to remote"
    );

    // 验证 url 被保留
    assert_eq!(
        remote_server.get("url"),
        Some(&json!("https://mcp.example.com/sse")),
        "url should be preserved"
    );

    // 验证 headers 被保留
    assert_eq!(
        remote_server.get("headers"),
        Some(&json!({"Authorization": "Bearer token123"})),
        "headers should be preserved"
    );

    // 验证 remote 类型不应该有 environment 字段
    assert_eq!(
        remote_server.get("environment"),
        None,
        "remote type should not have environment field"
    );
}

#[test]
fn test_sync_command_array_to_opencode() {
    let _guard = test_mutex().lock().expect("acquire test mutex");
    reset_test_fs();
    let _home = ensure_test_home();

    // 模拟一个已经是数组格式的 command
    let server_config = json!({
        "type": "stdio",
        "command": ["node", "server.js", "--port", "3000"],
        "environment": {
            "NODE_ENV": "production"
        }
    });

    sync_single_server_to_opencode(&(), "node-server", &server_config)
        .expect("sync should succeed");

    let config = read_opencode_config().expect("read should succeed");
    let mcp = config
        .get("mcp")
        .and_then(|m| m.as_object())
        .expect("mcp should exist");
    let node_server = mcp
        .get("node-server")
        .and_then(|n| n.as_object())
        .expect("node-server should exist");

    // 验证数组格式的 command 被保留
    assert_eq!(
        node_server.get("command"),
        Some(&json!(["node", "server.js", "--port", "3000"])),
        "command array should be preserved"
    );

    // 验证 environment 被保留
    assert_eq!(
        node_server.get("environment"),
        Some(&json!({"NODE_ENV": "production"})),
        "environment should be preserved"
    );
}

#[test]
fn test_sync_simple_command_string_to_opencode() {
    let _guard = test_mutex().lock().expect("acquire test mutex");
    reset_test_fs();
    let _home = ensure_test_home();

    // 模拟一个简单的字符串 command（没有 args）
    let server_config = json!({
        "type": "stdio",
        "command": "my-mcp-server"
    });

    sync_single_server_to_opencode(&(), "simple-server", &server_config)
        .expect("sync should succeed");

    let config = read_opencode_config().expect("read should succeed");
    let mcp = config
        .get("mcp")
        .and_then(|m| m.as_object())
        .expect("mcp should exist");
    let simple_server = mcp
        .get("simple-server")
        .and_then(|s| s.as_object())
        .expect("simple-server should exist");

    // 验证字符串 command 被转换为单元素数组
    assert_eq!(
        simple_server.get("command"),
        Some(&json!(["my-mcp-server"])),
        "simple string command should be converted to single-element array"
    );
}
