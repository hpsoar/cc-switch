use serde_json::json;
use std::path::PathBuf;

use cc_switch_lib::{
    get_opencode_config_path, get_opencode_dir, read_opencode_config, write_opencode_config,
    AppError,
};

#[path = "support.rs"]
mod support;
use support::{ensure_test_home, reset_test_fs, test_mutex};

#[test]
fn test_get_opencode_dir_default() {
    let _guard = test_mutex().lock().expect("acquire test mutex");
    let _home = ensure_test_home();

    let dir = get_opencode_dir();
    let expected = ensure_test_home().join(".config").join("opencode");

    assert_eq!(
        dir, expected,
        "default opencode dir should be ~/.config/opencode"
    );
}

#[test]
fn test_get_opencode_config_path() {
    let _guard = test_mutex().lock().expect("acquire test mutex");
    let _home = ensure_test_home();

    let path = get_opencode_config_path();
    let expected = ensure_test_home()
        .join(".config")
        .join("opencode")
        .join("opencode.json");

    assert_eq!(
        path, expected,
        "config path should be ~/.config/opencode/opencode.json"
    );
}

#[test]
fn test_read_opencode_config_returns_default_when_not_exists() {
    let _guard = test_mutex().lock().expect("acquire test mutex");
    reset_test_fs();

    let config =
        read_opencode_config().expect("read should return default config when file doesn't exist");

    assert_eq!(
        config.get("$schema"),
        Some(&json!("https://opencode.ai/config.json")),
        "default config should have correct schema"
    );

    assert_eq!(
        config.get("provider"),
        Some(&json!({})),
        "default config should have empty provider"
    );

    assert_eq!(
        config.get("mcp"),
        Some(&json!({})),
        "default config should have empty mcp"
    );

    assert_eq!(
        config.get("plugin"),
        Some(&json!([])),
        "default config should have empty plugin array"
    );
}

#[test]
fn test_write_opencode_config_creates_file() {
    let _guard = test_mutex().lock().expect("acquire test mutex");
    reset_test_fs();
    let _home = ensure_test_home();

    let test_config = json!({
        "$schema": "https://opencode.ai/config.json",
        "provider": {
            "apiKey": "test-key-123",
            "baseUrl": "https://api.test.com"
        },
        "mcp": {
            "test-server": {
                "command": "echo"
            }
        },
        "plugin": ["plugin1", "plugin2"]
    });

    write_opencode_config(&test_config).expect("write should succeed");

    let path = get_opencode_config_path();
    assert!(path.exists(), "config file should be created after write");

    let read_config = read_opencode_config().expect("read should succeed");
    assert_eq!(
        read_config, test_config,
        "read config should match written config"
    );
}

#[test]
fn test_write_and_read_roundtrip() {
    let _guard = test_mutex().lock().expect("acquire test mutex");
    reset_test_fs();
    let _home = ensure_test_home();

    let original = json!({
        "$schema": "https://opencode.ai/config.json",
        "provider": {
            "type": "custom",
            "apiKey": "sk-test-key",
            "baseUrl": "https://custom.api.com/v1",
            "model": "custom-model-v1"
        },
        "mcp": {
            "server1": {
                "type": "stdio",
                "command": "node",
                "args": ["server.js"]
            },
            "server2": {
                "type": "http",
                "url": "https://mcp.server.com/sse"
            }
        },
        "plugin": ["@opencode/plugin-core", "@opencode/plugin-ai"]
    });

    write_opencode_config(&original).expect("write should succeed");

    let read_back = read_opencode_config().expect("read should succeed");

    assert_eq!(
        read_back.get("$schema"),
        original.get("$schema"),
        "schema should match"
    );

    assert_eq!(
        read_back.get("provider"),
        original.get("provider"),
        "provider should match"
    );

    assert_eq!(
        read_back.get("mcp"),
        original.get("mcp"),
        "mcp should match"
    );

    assert_eq!(
        read_back.get("plugin"),
        original.get("plugin"),
        "plugin should match"
    );
}

#[test]
fn test_write_overwrites_existing_config() {
    let _guard = test_mutex().lock().expect("acquire test mutex");
    reset_test_fs();
    let _home = ensure_test_home();

    let first_config = json!({
        "$schema": "https://opencode.ai/config.json",
        "provider": { "apiKey": "first-key" },
        "mcp": {},
        "plugin": []
    });

    write_opencode_config(&first_config).expect("first write should succeed");

    let second_config = json!({
        "$schema": "https://opencode.ai/config.json",
        "provider": { "apiKey": "second-key", "baseUrl": "https://new.url" },
        "mcp": { "new-server": {} },
        "plugin": ["new-plugin"]
    });

    write_opencode_config(&second_config).expect("second write should succeed");

    let final_config = read_opencode_config().expect("read should succeed");

    assert_eq!(
        final_config.get("provider").and_then(|p| p.get("apiKey")),
        Some(&json!("second-key")),
        "config should be overwritten"
    );

    assert_eq!(
        final_config.get("provider").and_then(|p| p.get("baseUrl")),
        Some(&json!("https://new.url")),
        "new field should be present"
    );
}

#[test]
fn test_default_opencode_config_structure() {
    let config = json!({
        "$schema": "https://opencode.ai/config.json",
        "provider": {},
        "mcp": {},
        "plugin": []
    });

    // Ensure all required top-level fields exist
    assert!(config.get("$schema").is_some(), "schema field required");
    assert!(config.get("provider").is_some(), "provider field required");
    assert!(config.get("mcp").is_some(), "mcp field required");
    assert!(config.get("plugin").is_some(), "plugin field required");

    // Ensure types are correct
    assert!(config["$schema"].is_string(), "schema should be a string");
    assert!(
        config["provider"].is_object(),
        "provider should be an object"
    );
    assert!(config["mcp"].is_object(), "mcp should be an object");
    assert!(config["plugin"].is_array(), "plugin should be an array");
}

#[test]
fn test_create_directory_structure() {
    let _guard = test_mutex().lock().expect("acquire test mutex");
    reset_test_fs();
    let _home = ensure_test_home();

    let config = json!({
        "$schema": "https://opencode.ai/config.json",
        "provider": {},
        "mcp": {},
        "plugin": []
    });

    write_opencode_config(&config).expect("write should succeed");

    let opencode_dir = ensure_test_home().join(".config").join("opencode");
    assert!(
        opencode_dir.exists(),
        "opencode directory should be created"
    );
    assert!(opencode_dir.is_dir(), "opencode should be a directory");

    let config_file = opencode_dir.join("opencode.json");
    assert!(
        config_file.exists(),
        "opencode.json should exist in opencode directory"
    );
}
