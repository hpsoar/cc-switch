use crate::config::{read_json_file, write_json_file};
use crate::error::AppError;
use serde_json::{json, Value};
use std::path::PathBuf;

pub fn get_opencode_dir() -> PathBuf {
    if let Some(custom) = crate::settings::get_opencode_override_dir() {
        return custom;
    }
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".config")
        .join("opencode")
}

pub fn get_opencode_config_path() -> PathBuf {
    get_opencode_dir().join("opencode.json")
}

pub fn read_opencode_config() -> Result<Value, AppError> {
    let path = get_opencode_config_path();
    if !path.exists() {
        return Ok(default_opencode_config());
    }
    read_json_file(&path)
}

pub fn write_opencode_config(value: &Value) -> Result<(), AppError> {
    let path = get_opencode_config_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| AppError::io(parent, e))?;
    }
    write_json_file(&path, value)
}

pub fn default_opencode_config() -> Value {
    json!({
        "$schema": "https://opencode.ai/config.json",
        "provider": {},
        "mcp": {},
        "plugin": []
    })
}
