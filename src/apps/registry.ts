import { appIds, type AppId } from "@/apps/appIds";

export interface AppDefinition {
  id: AppId;
  label: string;
  icon: string;
  promptFilename: string;
  endpointTimeoutSecs: number;
  configDirSettingKey: AppConfigDirSettingKey;
  defaultConfigDirName: string;
  configDirLabelKey: string;
  configDirPlaceholderKey: string;
  supportsEnvConflict: boolean;
  hasCliTool: boolean;
}

export type AppConfigDirSettingKey =
  | "claudeConfigDir"
  | "codexConfigDir"
  | "geminiConfigDir"
  | "opencodeConfigDir";

export const appRegistry = {
  claude: {
    id: "claude",
    label: "Claude",
    icon: "claude",
    promptFilename: "CLAUDE.md",
    endpointTimeoutSecs: 8,
    supportsEnvConflict: true,
    hasCliTool: true,
    configDirSettingKey: "claudeConfigDir",
    defaultConfigDirName: ".claude",
    configDirLabelKey: "settings.claudeConfigDir",
    configDirPlaceholderKey: "settings.browsePlaceholderClaude",
  },
  codex: {
    id: "codex",
    label: "Codex",
    icon: "openai",
    promptFilename: "AGENTS.md",
    endpointTimeoutSecs: 12,
    supportsEnvConflict: true,
    hasCliTool: true,
    configDirSettingKey: "codexConfigDir",
    defaultConfigDirName: ".codex",
    configDirLabelKey: "settings.codexConfigDir",
    configDirPlaceholderKey: "settings.browsePlaceholderCodex",
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    icon: "gemini",
    promptFilename: "GEMINI.md",
    endpointTimeoutSecs: 8,
    supportsEnvConflict: true,
    hasCliTool: true,
    configDirSettingKey: "geminiConfigDir",
    defaultConfigDirName: ".gemini",
    configDirLabelKey: "settings.geminiConfigDir",
    configDirPlaceholderKey: "settings.browsePlaceholderGemini",
  },
  opencode: {
    id: "opencode",
    label: "OpenCode",
    icon: "opencode",
    promptFilename: "OPENCODE.md",
    endpointTimeoutSecs: 8,
    supportsEnvConflict: false,
    hasCliTool: false,
    configDirSettingKey: "opencodeConfigDir",
    defaultConfigDirName: ".config/opencode",
    configDirLabelKey: "settings.opencodeConfigDir",
    configDirPlaceholderKey: "settings.browsePlaceholderOpencode",
  },
} as const satisfies Record<AppId, AppDefinition>;

export const appList: AppDefinition[] = appIds.map((id) => appRegistry[id]);

export { appIds };

export const appLabelMap: Record<AppId, string> = appList.reduce(
  (acc, app) => {
    acc[app.id] = app.label;
    return acc;
  },
  {} as Record<AppId, string>,
);

export const appIconMap: Record<AppId, string> = appList.reduce(
  (acc, app) => {
    acc[app.id] = app.icon;
    return acc;
  },
  {} as Record<AppId, string>,
);

export const appPromptFilenameMap: Record<AppId, string> = appList.reduce(
  (acc, app) => {
    acc[app.id] = app.promptFilename;
    return acc;
  },
  {} as Record<AppId, string>,
);

export const appEndpointTimeoutMap: Record<AppId, number> = appList.reduce(
  (acc, app) => {
    acc[app.id] = app.endpointTimeoutSecs;
    return acc;
  },
  {} as Record<AppId, number>,
);

export const appConfigDirSettingKeyMap: Record<AppId, AppConfigDirSettingKey> =
  appList.reduce(
    (acc, app) => {
      acc[app.id] = app.configDirSettingKey;
      return acc;
    },
    {} as Record<AppId, AppConfigDirSettingKey>,
  );

export const appDefaultConfigDirNameMap: Record<AppId, string> =
  appList.reduce(
    (acc, app) => {
      acc[app.id] = app.defaultConfigDirName;
      return acc;
    },
    {} as Record<AppId, string>,
  );

export const appConfigDirLabelKeyMap: Record<AppId, string> = appList.reduce(
  (acc, app) => {
    acc[app.id] = app.configDirLabelKey;
    return acc;
  },
  {} as Record<AppId, string>,
);

export const appConfigDirPlaceholderKeyMap: Record<AppId, string> =
  appList.reduce(
    (acc, app) => {
      acc[app.id] = app.configDirPlaceholderKey;
      return acc;
    },
    {} as Record<AppId, string>,
  );

export function getAppDefinition(appId: AppId): AppDefinition {
  return appRegistry[appId];
}
