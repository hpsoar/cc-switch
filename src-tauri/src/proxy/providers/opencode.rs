//! OpenCode Provider Adapter
//!
//! OpenCode 使用 AI SDK 的配置格式，支持多种 NPM 包和自定义选项。

use super::adapter::ProviderAdapter;
use super::auth::{AuthInfo, AuthStrategy};
use crate::provider::Provider;
use crate::proxy::error::ProxyError;
use reqwest::RequestBuilder;

pub struct OpenCodeAdapter;

impl OpenCodeAdapter {
    pub fn new() -> Self {
        Self
    }

    /// 从 options.apiKey 中提取 API Key
    /// 支持格式: "sk-xxx" 或 "{env:VAR_NAME}"
    fn extract_key(&self, provider: &Provider) -> Option<String> {
        let options = provider.settings_config.get("options")?.as_object()?;

        if let Some(key) = options.get("apiKey").and_then(|v| v.as_str()) {
            let key_str = key.trim();

            // 处理环境变量引用: {env:API_KEY}
            if key_str.starts_with("{env:") && key_str.ends_with('}') {
                let env_var = &key_str[5..key_str.len() - 1];
                if let Ok(value) = std::env::var(env_var) {
                    return Some(value);
                }
                log::warn!("Environment variable {} not found", env_var);
                return None;
            }

            // 直接返回 API Key
            return Some(key_str.to_string());
        }

        None
    }
}

impl ProviderAdapter for OpenCodeAdapter {
    fn name(&self) -> &'static str {
        "OpenCode"
    }

    fn extract_base_url(&self, provider: &Provider) -> Result<String, ProxyError> {
        // OpenCode 配置结构: { "options": { "baseURL": "..." } }
        if let Some(url) = provider
            .settings_config
            .get("options")
            .and_then(|opts| opts.get("baseURL"))
            .and_then(|v| v.as_str())
        {
            return Ok(url.trim_end_matches('/').to_string());
        }

        Err(ProxyError::ConfigError(
            "OpenCode Provider 缺少 options.baseURL 配置".to_string(),
        ))
    }

    fn extract_auth(&self, provider: &Provider) -> Option<AuthInfo> {
        // OpenCode 通常使用 Bearer Token 认证
        let key = self.extract_key(provider)?;
        Some(AuthInfo::new(key, AuthStrategy::Bearer))
    }

    fn build_url(&self, base_url: &str, endpoint: &str) -> String {
        let base_trimmed = base_url.trim_end_matches('/');
        let endpoint_trimmed = endpoint.trim_start_matches('/');
        format!("{}/{}", base_trimmed, endpoint_trimmed)
    }

    fn add_auth_headers(&self, request: RequestBuilder, auth: &AuthInfo) -> RequestBuilder {
        // OpenCode 使用 Bearer Token 认证
        request.header("Authorization", format!("Bearer {}", auth.api_key))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn create_provider(options: serde_json::Value) -> Provider {
        Provider {
            id: "test".to_string(),
            name: "Test Provider".to_string(),
            settings_config: json!({
                "npm": "@ai-sdk/openai-compatible",
                "name": "Test",
                "options": options,
                "models": {}
            }),
            website_url: None,
            category: None,
            created_at: None,
            sort_index: None,
            notes: None,
            meta: None,
            icon: None,
            icon_color: None,
            in_failover_queue: false,
            provider_key: None,
        }
    }

    #[test]
    fn test_extract_base_url() {
        let adapter = OpenCodeAdapter::new();
        let provider = create_provider(json!({
            "baseURL": "https://api.example.com/v1",
            "apiKey": "sk-test"
        }));

        let url = adapter.extract_base_url(&provider).unwrap();
        assert_eq!(url, "https://api.example.com/v1");
    }

    #[test]
    fn test_extract_base_url_with_trailing_slash() {
        let adapter = OpenCodeAdapter::new();
        let provider = create_provider(json!({
            "baseURL": "https://api.example.com/v1/",
            "apiKey": "sk-test"
        }));

        let url = adapter.extract_base_url(&provider).unwrap();
        assert_eq!(url, "https://api.example.com/v1");
    }

    #[test]
    fn test_extract_key_direct() {
        let adapter = OpenCodeAdapter::new();
        let provider = create_provider(json!({
            "baseURL": "https://api.example.com",
            "apiKey": "sk-test-key-123"
        }));

        let key = adapter.extract_key(&provider).unwrap();
        assert_eq!(key, "sk-test-key-123");
    }

    #[test]
    fn test_build_url() {
        let adapter = OpenCodeAdapter::new();
        let url = adapter.build_url("https://api.example.com/v1", "/messages");
        assert_eq!(url, "https://api.example.com/v1/messages");
    }

    #[test]
    fn test_build_url_with_slashes() {
        let adapter = OpenCodeAdapter::new();
        let url = adapter.build_url("https://api.example.com/v1/", "/messages");
        assert_eq!(url, "https://api.example.com/v1/messages");
    }
}
