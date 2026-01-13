use std::collections::HashMap;

use crate::app_config::AppType;
use crate::error::AppError;
use crate::opencode_config::{read_opencode_config, write_opencode_config};
use serde_json::{json, Value};

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
    let mut opencode_entry = json!({ "type": m_type, "enabled": true });

    if let Some(command) = server.get("command") {
        opencode_entry["command"] = command.clone();
    }
    if let Some(url) = server.get("url") {
        opencode_entry["url"] = url.clone();
    }
    if let Some(headers) = server.get("headers") {
        opencode_entry["headers"] = headers.clone();
    }
    if let Some(environment) = server.get("environment") {
        opencode_entry["environment"] = environment.clone();
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

pub fn import_from_opencode() -> Result<HashMap<String, Value>, AppError> {
    let config = read_opencode_config()?;
    let mcp = config
        .as_object()
        .and_then(|obj| obj.get("mcp"))
        .and_then(|v| v.as_object())
        .ok_or_else(|| AppError::Config("OpenCode 配置缺少 mcp 字段".to_string()))?;

    let mut servers = HashMap::new();
    for (id, entry) in mcp {
        let entry_obj = entry
            .as_object()
            .ok_or_else(|| AppError::Config(format!("OpenCode MCP 服务器 {id} 配置必须是对象")))?;

        let server_config = match entry_obj.get("type").and_then(|v| v.as_str()) {
            Some("remote") => {
                let mut remote = json!({ "type": "remote" });
                if let Some(url) = entry_obj.get("url") {
                    remote["url"] = url.clone();
                }
                if let Some(headers) = entry_obj.get("headers") {
                    remote["headers"] = headers.clone();
                }
                remote
            }
            Some("local") | _ => {
                let mut local = json!({ "type": "local" });
                if let Some(command) = entry_obj.get("command") {
                    local["command"] = command.clone();
                }
                if let Some(environment) = entry_obj.get("environment") {
                    local["environment"] = environment.clone();
                }
                local
            }
        };

        servers.insert(id.clone(), server_config);
    }

    Ok(servers)
}
