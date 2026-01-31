use std::path::PathBuf;

use crate::app_config::AppType;
use crate::codex_config::{self, get_codex_auth_path};
use crate::config::{self, get_claude_settings_path, ConfigStatus};
use crate::gemini_config;
use crate::gemini_config::get_gemini_dir;
use crate::opencode_config;
use crate::settings::get_opencode_override_dir;
use crate::error::AppError;

pub struct AppConfigAdapter {
    pub app: AppType,
    pub get_config_dir: fn() -> PathBuf,
    pub get_config_status: fn() -> ConfigStatus,
}

pub fn get_app_config_adapter(app: &AppType) -> AppConfigAdapter {
    match app {
        AppType::Claude => AppConfigAdapter {
            app: *app,
            get_config_dir: config::get_claude_config_dir,
            get_config_status: config::get_claude_config_status,
        },
        AppType::Codex => AppConfigAdapter {
            app: *app,
            get_config_dir: codex_config::get_codex_config_dir,
            get_config_status: || {
                let auth_path = codex_config::get_codex_auth_path();
                let exists = auth_path.exists();
                let path = codex_config::get_codex_config_dir()
                    .to_string_lossy()
                    .to_string();
                ConfigStatus { exists, path }
            },
        },
        AppType::Gemini => AppConfigAdapter {
            app: *app,
            get_config_dir: gemini_config::get_gemini_dir,
            get_config_status: || {
                let env_path = gemini_config::get_gemini_env_path();
                let exists = env_path.exists();
                let path = gemini_config::get_gemini_dir().to_string_lossy().to_string();
                ConfigStatus { exists, path }
            },
        },
        AppType::OpenCode => AppConfigAdapter {
            app: *app,
            get_config_dir: opencode_config::get_opencode_dir,
            get_config_status: || {
                let config_path = opencode_config::get_opencode_config_path();
                let exists = config_path.exists();
                let path = opencode_config::get_opencode_dir()
                    .to_string_lossy()
                    .to_string();
                ConfigStatus { exists, path }
            },
        },
    }
}

pub fn get_config_dir_for_app(app: &AppType) -> PathBuf {
    let adapter = get_app_config_adapter(app);
    (adapter.get_config_dir)()
}

pub fn get_config_status_for_app(app: &AppType) -> ConfigStatus {
    let adapter = get_app_config_adapter(app);
    (adapter.get_config_status)()
}

pub fn get_prompt_base_dir_for_app(app: &AppType) -> Result<PathBuf, AppError> {
    let base_dir: PathBuf = match app {
        AppType::Claude => get_base_dir_with_fallback(
            get_claude_settings_path(),
            app.default_config_dir(),
        )?,
        AppType::Codex => {
            get_base_dir_with_fallback(get_codex_auth_path(), app.default_config_dir())?
        }
        AppType::Gemini => get_gemini_dir(),
        AppType::OpenCode => get_opencode_prompt_dir()?,
    };

    Ok(base_dir)
}

fn get_base_dir_with_fallback(
    primary_path: PathBuf,
    fallback_dir: &str,
) -> Result<PathBuf, AppError> {
    primary_path
        .parent()
        .map(|p| p.to_path_buf())
        .or_else(|| dirs::home_dir().map(|h| h.join(fallback_dir)))
        .ok_or_else(|| {
            AppError::localized(
                "home_dir_not_found",
                format!("无法确定 {fallback_dir} 配置目录：用户主目录不存在"),
                format!("Cannot determine {fallback_dir} config directory: user home not found"),
            )
        })
}

fn get_opencode_prompt_dir() -> Result<PathBuf, AppError> {
    if let Some(dir) = get_opencode_override_dir() {
        return Ok(dir);
    }
    dirs::home_dir()
        .map(|h| h.join(".config").join("opencode"))
        .ok_or_else(|| {
            AppError::localized(
                "home_dir_not_found",
                "无法获取 OpenCode 配置目录：用户主目录不存在",
                "Cannot determine OpenCode config directory: user home not found",
            )
        })
}
