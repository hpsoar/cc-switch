use std::collections::HashMap;

use crate::app_config::McpApps;
use crate::error::AppError;
use crate::opencode_config::{get_opencode_config_path, read_opencode_config, write_opencode_config};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpStatus {
    pub user_config_path: String,
    pub user_config_exists: bool,
    pub server_count: usize,
}

pub fn sync_single_server_to_opencode(
    _ctx: &(),
    server_id: &str,
    server_config: &Value,
) -> Result<(), AppError> {
    let mut config = read_opencode_config()?;
    let config_obj = config
        .as_object_mut()
        .ok_or_else(|| AppError::Config("OpenCode 配置必须是 JSON 对象".to_string()))?;
    let mcp_obj = config_obj
        .entry("mcp")
        .or_insert_with(|| json!({}))
        .as_object_mut()
        .ok_or_else(|| AppError::Config("OpenCode mcp 字段必须是对象".to_string()))?;

    let server = server_config
        .as_object()
        .ok_or_else(|| AppError::Config("MCP server 配置必须是 JSON 对象".to_string()))?;

    let m_type = server
        .get("type")
        .and_then(|v| v.as_str())
        .unwrap_or("local");

    // OpenCode 只支持 "local" 和 "remote" 两种类型
    // 将其他类型映射到 OpenCode 的类型系统
    let opencode_type = match m_type {
        "http" => "remote",
        "stdio" => "local",  // stdio 类型映射到 local
        _ => m_type,
    };

    let mut opencode_entry = json!({ "type": opencode_type, "enabled": true });

    if let Some(command) = server.get("command") {
        // 处理 command 字段：OpenCode 要求 command 必须是数组格式
        if let Some(cmd_str) = command.as_str() {
            // 如果是字符串，转换为数组格式
            // 对于简单命令（如 "npx"），需要结合 args 字段
            if let Some(args) = server.get("args").and_then(|v| v.as_array()) {
                // 如果有 args，合并成完整的 command 数组
                let mut cmd_array = vec![json!(cmd_str)];
                cmd_array.extend(args.iter().cloned());
                opencode_entry["command"] = json!(cmd_array);
            } else {
                // 没有 args，将字符串转为单元素数组
                opencode_entry["command"] = json!([cmd_str]);
            }
        } else if let Some(cmd_array) = command.as_array() {
            // 如果已经是数组，直接使用
            opencode_entry["command"] = json!(cmd_array);
        }
    }

    // 对于 local 类型，添加 environment 字段（OpenCode 要求）
    if opencode_type == "local" {
        opencode_entry["environment"] = server
            .get("environment")
            .and_then(|v| v.as_object())
            .map(|o| json!(o))
            .unwrap_or(json!({}));
    }
    
    if let Some(url) = server.get("url") {
        opencode_entry["url"] = url.clone();
    }
    if let Some(headers) = server.get("headers") {
        opencode_entry["headers"] = headers.clone();
    }

    mcp_obj.insert(server_id.to_string(), opencode_entry);
    write_opencode_config(&Value::Object(config_obj.clone()))?;
    Ok(())
}

pub fn remove_server_from_opencode(server_id: &str) -> Result<(), AppError> {
    let mut config = read_opencode_config()?;
    let config_obj = config
        .as_object_mut()
        .ok_or_else(|| AppError::Config("OpenCode 配置必须是 JSON 对象".to_string()))?;
    let mcp_obj = config_obj
        .entry("mcp")
        .or_insert_with(|| json!({}))
        .as_object_mut()
        .ok_or_else(|| AppError::Config("OpenCode mcp 字段必须是对象".to_string()))?;

    mcp_obj.remove(server_id);
    write_opencode_config(&Value::Object(config_obj.clone()))?;
    Ok(())
}

/// 从 OpenCode 配置导入 MCP 服务器到 MultiAppConfig
///
/// 此函数与其他导入函数（import_from_claude, import_from_codex）保持一致的接口
/// 将 OpenCode 配置文件中的 MCP 服务器读取并填充到 config.mcp.servers 中
pub fn import_from_opencode(config: &mut crate::app_config::MultiAppConfig) -> Result<usize, AppError> {
    let opencode_config = read_opencode_config()?;
    let mcp = opencode_config
        .as_object()
        .and_then(|obj| obj.get("mcp"))
        .and_then(|v| v.as_object())
        .ok_or_else(|| AppError::Config("OpenCode 配置缺少 mcp 字段".to_string()))?;

    let servers = config.mcp.servers.get_or_insert_with(HashMap::new);

    for (id, entry) in mcp {
        let entry_obj = entry
            .as_object()
            .ok_or_else(|| AppError::Config(format!("OpenCode MCP 服务器 {id} 配置必须是对象")))?;

        let server_config = match entry_obj.get("type").and_then(|v| v.as_str()) {
            Some("remote") => {
                let mut remote = json!({ "type": "http" });  // OpenCode 的 "remote" 映射为内部的 "http"
                if let Some(url) = entry_obj.get("url") {
                    remote["url"] = url.clone();
                }
                if let Some(headers) = entry_obj.get("headers") {
                    remote["headers"] = headers.clone();
                }
                remote
            }
            Some("local") | _ => {
                let mut local = json!({ "type": "stdio" });  // OpenCode 的 "local" 映射为内部的 "stdio"
                if let Some(command) = entry_obj.get("command") {
                    local["command"] = command.clone();
                }
                if let Some(environment) = entry_obj.get("environment") {
                    local["environment"] = environment.clone();
                }
                local
            }
        };

        // 创建 McpServer 结构，默认启用 OpenCode
        let name = id.clone();
        let mut apps = McpApps::default();
        apps.opencode = true;

        let server = crate::app_config::McpServer {
            id: id.clone(),
            name,
            server: server_config,
            apps,
            description: None,
            homepage: None,
            docs: None,
            tags: Vec::new(),
        };

        servers.insert(id.clone(), server);
    }

    Ok(servers.len())
}

pub fn get_mcp_status() -> Result<McpStatus, AppError> {
    let path = get_opencode_config_path();
    let (exists, count) = if path.exists() {
        let config = read_opencode_config()?;
        let mcp = config
            .as_object()
            .and_then(|obj| obj.get("mcp"))
            .and_then(|v| v.as_object());
        (true, mcp.map(|m| m.len()).unwrap_or(0))
    } else {
        (false, 0)
    };

    Ok(McpStatus {
        user_config_path: path.to_string_lossy().to_string(),
        user_config_exists: exists,
        server_count: count,
    })
}