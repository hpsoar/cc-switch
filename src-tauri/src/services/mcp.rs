use indexmap::IndexMap;
use std::collections::HashMap;

use crate::app_config::{AppType, McpServer};
use crate::error::AppError;
use crate::mcp;
use crate::store::AppState;

/// MCP 相关业务逻辑（v3.7.0 统一结构）
pub struct McpService;

struct McpAppAdapter {
    sync_single: fn(&str, &serde_json::Value) -> Result<(), AppError>,
    remove: fn(&str) -> Result<(), AppError>,
}

struct McpImportAdapter {
    import: fn(&mut crate::app_config::MultiAppConfig) -> Result<usize, AppError>,
}

fn get_mcp_adapter(app: &AppType) -> McpAppAdapter {
    match app {
        AppType::Claude => McpAppAdapter {
            sync_single: |id, server| {
                mcp::sync_single_server_to_claude(&Default::default(), id, server)
            },
            remove: mcp::remove_server_from_claude,
        },
        AppType::Codex => McpAppAdapter {
            sync_single: |id, server| {
                mcp::sync_single_server_to_codex(&Default::default(), id, server)
            },
            remove: mcp::remove_server_from_codex,
        },
        AppType::Gemini => McpAppAdapter {
            sync_single: |id, server| {
                mcp::sync_single_server_to_gemini(&Default::default(), id, server)
            },
            remove: mcp::remove_server_from_gemini,
        },
        AppType::OpenCode => McpAppAdapter {
            sync_single: |id, server| {
                crate::opencode_mcp::sync_single_server_to_opencode(
                    &Default::default(),
                    id,
                    server,
                )
            },
            remove: crate::opencode_mcp::remove_server_from_opencode,
        },
    }
}

fn get_mcp_import_adapter(app: &AppType) -> McpImportAdapter {
    match app {
        AppType::Claude => McpImportAdapter {
            import: crate::mcp::import_from_claude,
        },
        AppType::Codex => McpImportAdapter {
            import: crate::mcp::import_from_codex,
        },
        AppType::Gemini => McpImportAdapter {
            import: crate::mcp::import_from_gemini,
        },
        AppType::OpenCode => McpImportAdapter {
            import: crate::opencode_mcp::import_from_opencode,
        },
    }
}

impl McpService {
    /// 获取所有 MCP 服务器（统一结构）
    pub fn get_all_servers(state: &AppState) -> Result<IndexMap<String, McpServer>, AppError> {
        state.db.get_all_mcp_servers()
    }

    /// 添加或更新 MCP 服务器
    pub fn upsert_server(state: &AppState, server: McpServer) -> Result<(), AppError> {
        // 读取旧状态：用于处理“编辑时取消勾选某个应用”的场景（需要从对应 live 配置中移除）
        let prev_apps = state
            .db
            .get_all_mcp_servers()?
            .get(&server.id)
            .map(|s| s.apps.clone())
            .unwrap_or_default();

        state.db.save_mcp_server(&server)?;

        // 处理禁用：若旧版本启用但新版本取消，则需要从该应用的 live 配置移除
        for app in AppType::all() {
            if prev_apps.is_enabled_for(app) && !server.apps.is_enabled_for(app) {
                Self::remove_server_from_app(state, &server.id, app)?;
            }
        }

        // 同步到各个启用的应用
        Self::sync_server_to_apps(state, &server)?;

        Ok(())
    }

    /// 删除 MCP 服务器
    pub fn delete_server(state: &AppState, id: &str) -> Result<bool, AppError> {
        let server = state.db.get_all_mcp_servers()?.shift_remove(id);

        if let Some(_server) = server {
            state.db.delete_mcp_server(id)?;

            // 从所有应用的 live 配置中移除
            for app in AppType::all() {
                Self::remove_server_from_app(state, id, app)?;
            }
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// 切换指定应用的启用状态
    pub fn toggle_app(
        state: &AppState,
        server_id: &str,
        app: AppType,
        enabled: bool,
    ) -> Result<(), AppError> {
        let mut servers = state.db.get_all_mcp_servers()?;

        if let Some(server) = servers.get_mut(server_id) {
            server.apps.set_enabled_for(&app, enabled);
            state.db.save_mcp_server(server)?;

            // 同步到对应应用
            if enabled {
                Self::sync_server_to_app(state, server, &app)?;
            } else {
                Self::remove_server_from_app(state, server_id, &app)?;
            }
        }

        Ok(())
    }

    /// 将 MCP 服务器同步到所有启用的应用
    fn sync_server_to_apps(_state: &AppState, server: &McpServer) -> Result<(), AppError> {
        for app in server.apps.enabled_apps() {
            Self::sync_server_to_app_no_config(server, &app)?;
        }

        Ok(())
    }

    /// 将 MCP 服务器同步到指定应用
    fn sync_server_to_app(
        _state: &AppState,
        server: &McpServer,
        app: &AppType,
    ) -> Result<(), AppError> {
        Self::sync_server_to_app_no_config(server, app)
    }

    fn sync_server_to_app_no_config(server: &McpServer, app: &AppType) -> Result<(), AppError> {
        let adapter = get_mcp_adapter(app);
        (adapter.sync_single)(&server.id, &server.server)?;
        Ok(())
    }

    fn remove_server_from_app(_state: &AppState, id: &str, app: &AppType) -> Result<(), AppError> {
        let adapter = get_mcp_adapter(app);
        (adapter.remove)(id)?;
        Ok(())
    }

    /// 手动同步所有启用的 MCP 服务器到对应的应用
    pub fn sync_all_enabled(state: &AppState) -> Result<(), AppError> {
        let servers = Self::get_all_servers(state)?;

        for server in servers.values() {
            Self::sync_server_to_apps(state, server)?;
        }

        Ok(())
    }

    // ========================================================================
    // 兼容层：支持旧的 v3.6.x 命令（已废弃，将在 v4.0 移除）
    // ========================================================================

    /// [已废弃] 获取指定应用的 MCP 服务器（兼容旧 API）
    #[deprecated(since = "3.7.0", note = "Use get_all_servers instead")]
    pub fn get_servers(
        state: &AppState,
        app: AppType,
    ) -> Result<HashMap<String, serde_json::Value>, AppError> {
        let all_servers = Self::get_all_servers(state)?;
        let mut result = HashMap::new();

        for (id, server) in all_servers {
            if server.apps.is_enabled_for(&app) {
                result.insert(id, server.server);
            }
        }

        Ok(result)
    }

    /// [已废弃] 设置 MCP 服务器在指定应用的启用状态（兼容旧 API）
    #[deprecated(since = "3.7.0", note = "Use toggle_app instead")]
    pub fn set_enabled(
        state: &AppState,
        app: AppType,
        id: &str,
        enabled: bool,
    ) -> Result<bool, AppError> {
        Self::toggle_app(state, id, app, enabled)?;
        Ok(true)
    }

    /// [已废弃] 同步启用的 MCP 到指定应用（兼容旧 API）
    #[deprecated(since = "3.7.0", note = "Use sync_all_enabled instead")]
    pub fn sync_enabled(state: &AppState, app: AppType) -> Result<(), AppError> {
        let servers = Self::get_all_servers(state)?;

        for server in servers.values() {
            if server.apps.is_enabled_for(&app) {
                Self::sync_server_to_app(state, server, &app)?;
            }
        }

        Ok(())
    }

    /// 从 Claude 导入 MCP（v3.7.0 已更新为统一结构）
    pub fn import_from_claude(state: &AppState) -> Result<usize, AppError> {
        Self::import_from_app(state, AppType::Claude)
    }

    /// 从 Codex 导入 MCP（v3.7.0 已更新为统一结构）
    pub fn import_from_codex(state: &AppState) -> Result<usize, AppError> {
        Self::import_from_app(state, AppType::Codex)
    }

    /// 从 Gemini 导入 MCP（v3.7.0 已更新为统一结构）
    pub fn import_from_gemini(state: &AppState) -> Result<usize, AppError> {
        Self::import_from_app(state, AppType::Gemini)
    }

    /// 从 OpenCode 导入 MCP（v3.7.0 已更新为统一结构）
    pub fn import_from_opencode(state: &AppState) -> Result<usize, AppError> {
        Self::import_from_app(state, AppType::OpenCode)
    }

    pub fn import_from_app(state: &AppState, app: AppType) -> Result<usize, AppError> {
        let mut temp_config = crate::app_config::MultiAppConfig::default();
        let adapter = get_mcp_import_adapter(&app);

        let count = (adapter.import)(&mut temp_config)?;
        let mut new_count = 0;

        if count > 0 {
            if let Some(servers) = &temp_config.mcp.servers {
                let mut existing = state.db.get_all_mcp_servers()?;
                for server in servers.values() {
                    let to_save = if let Some(existing_server) = existing.get(&server.id) {
                        let mut merged = existing_server.clone();
                        merged.apps.set_enabled_for(&app, true);
                        merged
                    } else {
                        let mut new_server = server.clone();
                        new_server.apps.set_enabled_for(&app, true);
                        new_count += 1;
                        new_server
                    };

                    state.db.save_mcp_server(&to_save)?;
                    existing.insert(to_save.id.clone(), to_save.clone());

                    Self::sync_server_to_apps(state, &to_save)?;
                }
            }
        }

        Ok(new_count)
    }
}
