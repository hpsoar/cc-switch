use rusqlite::Row;

use crate::app_config::{AppType, McpApps, SkillApps};

pub const APP_COLUMN_ORDER: [AppType; 4] = [
    AppType::Claude,
    AppType::Codex,
    AppType::Gemini,
    AppType::OpenCode,
];

pub const MCP_ENABLED_COLUMNS: [&str; 4] = [
    "enabled_claude",
    "enabled_codex",
    "enabled_gemini",
    "enabled_opencode",
];

pub const SKILL_ENABLED_COLUMNS: [&str; 4] = [
    "enabled_claude",
    "enabled_codex",
    "enabled_gemini",
    "enabled_opencode",
];

pub fn read_mcp_apps_from_row(row: &Row<'_>, start_index: usize) -> Result<McpApps, rusqlite::Error> {
    let mut apps = McpApps::default();
    for (idx, app) in APP_COLUMN_ORDER.iter().enumerate() {
        let enabled: bool = row.get(start_index + idx)?;
        apps.set_enabled_for(app, enabled);
    }
    Ok(apps)
}

pub fn read_skill_apps_from_row(
    row: &Row<'_>,
    start_index: usize,
) -> Result<SkillApps, rusqlite::Error> {
    let mut apps = SkillApps::default();
    for (idx, app) in APP_COLUMN_ORDER.iter().enumerate() {
        let enabled: bool = row.get(start_index + idx)?;
        apps.set_enabled_for(app, enabled);
    }
    Ok(apps)
}

pub fn mcp_apps_to_bools(apps: &McpApps) -> [bool; 4] {
    let mut values = [false; 4];
    for (idx, app) in APP_COLUMN_ORDER.iter().enumerate() {
        values[idx] = apps.is_enabled_for(app);
    }
    values
}

pub fn skill_apps_to_bools(apps: &SkillApps) -> [bool; 4] {
    let mut values = [false; 4];
    for (idx, app) in APP_COLUMN_ORDER.iter().enumerate() {
        values[idx] = apps.is_enabled_for(app);
    }
    values
}
