# Decoupling TODO

## Frontend (src)
- Refactor provider form branching into per-app adapters/components; remove appId chains in `src/components/providers/forms/ProviderForm.tsx`.
- Refactor deep link import UI/logic to registry/adapters; remove hardcoded app union/branches in `src/components/DeepLinkImportDialog.tsx`.
- Refactor universal provider modal to registry (apps toggles, models, defaults, icons) in `src/components/universal/UniversalProviderFormModal.tsx`.
- Normalize MCP hooks to registry/app list (query keys, status, filters) in `src/hooks/useMcp.ts` and related query files.
- Reduce app enums in i18n/types; derive from registry in `src/i18n/*`, `src/types.ts`, `src/lib/schemas/*`.
- Consolidate app-specific presets/templates into adapter registry in `src/config/*ProviderPresets.ts`, `src/config/*Templates.ts`, `src/config/mcpPresets.ts`.
- Normalize app-specific utils behind registry adapters in `src/utils/*` (e.g., `opencode.ts`, `providerMetaUtils.ts`, `providerConfigUtils.ts`).
- Review API layer and schemas for hardcoded app lists in `src/lib/api/*`, `src/lib/schemas/*`, `src/types/*`.
- Review UI icon/label usage in `src/components/ProviderIcon.tsx`, `src/icons/extracted/*` to ensure registry-driven app metadata.

## Backend (src-tauri)
- Introduce backend app registry/AppType::all (id, label, config dir key, prompt file name, mcp config file), centralize in `src-tauri/src/app_config.rs` or new module.
- Refactor MCP service branching to registry iteration/adapters in `src-tauri/src/services/mcp.rs` and `src-tauri/src/mcp/*`.
- Refactor config dir/status + snippet logic to registry/adapters in `src-tauri/src/commands/config.rs`, `src-tauri/src/*_config.rs`, `src-tauri/src/config.rs`.
- Refactor settings current provider + override dirs to registry in `src-tauri/src/settings.rs`.
- Replace hardcoded app parsing with registry lookup in `src-tauri/src/commands/skill.rs`, `src-tauri/src/commands/misc.rs`, `src-tauri/src/commands/mcp.rs`.
- Refactor deep-link routing/import per app to adapters in `src-tauri/src/commands/deeplink.rs`, `src-tauri/src/deeplink/*`.
- Normalize prompt file routing/auto-import to registry in `src-tauri/src/prompt_files.rs`, `src-tauri/src/services/prompt.rs`, `src-tauri/src/prompt.rs`.
- Centralize DB app column mappings (skills/mcp/proxy) to avoid repeated app lists in `src-tauri/src/database/dao/mcp.rs`, `src-tauri/src/database/dao/skills.rs`, `src-tauri/src/database/dao/proxy.rs`, `src-tauri/src/database/schema.rs`.
- Review proxy/provider adapters for hardcoded app lists in `src-tauri/src/proxy/providers/*`, `src-tauri/src/proxy/model_mapper.rs`, `src-tauri/src/services/provider/*`.

## Tests
- Update app lists in `src-tauri/tests/*` (and any frontend tests) to use registry/app list helpers.
- Add coverage for new registry adapters (frontend + backend) to prevent regressions.

## Cross-layer
- Ensure frontend registry and backend registry stay in sync (shared schema or explicit single source of truth).
