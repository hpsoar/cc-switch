use serde_json::Value;

use crate::AppType;

use super::provider::{
    build_claude_settings, build_codex_settings, build_gemini_settings, build_opencode_settings,
};
use super::DeepLinkImportRequest;

pub struct ProviderDeeplinkAdapter {
    pub app: AppType,
    pub build_settings: fn(&DeepLinkImportRequest) -> Value,
}

pub fn get_provider_adapter(app: &AppType) -> ProviderDeeplinkAdapter {
    match app {
        AppType::Claude => ProviderDeeplinkAdapter {
            app: *app,
            build_settings: build_claude_settings,
        },
        AppType::Codex => ProviderDeeplinkAdapter {
            app: *app,
            build_settings: build_codex_settings,
        },
        AppType::Gemini => ProviderDeeplinkAdapter {
            app: *app,
            build_settings: build_gemini_settings,
        },
        AppType::OpenCode => ProviderDeeplinkAdapter {
            app: *app,
            build_settings: build_opencode_settings,
        },
    }
}
