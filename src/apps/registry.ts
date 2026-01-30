import type { AppId } from "@/lib/api";

export interface AppDefinition {
  id: AppId;
  label: string;
  icon: string;
  promptFilename: string;
  endpointTimeoutSecs: number;
}

export const appRegistry = {
  claude: {
    id: "claude",
    label: "Claude",
    icon: "claude",
    promptFilename: "CLAUDE.md",
    endpointTimeoutSecs: 8,
  },
  codex: {
    id: "codex",
    label: "Codex",
    icon: "openai",
    promptFilename: "AGENTS.md",
    endpointTimeoutSecs: 12,
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    icon: "gemini",
    promptFilename: "GEMINI.md",
    endpointTimeoutSecs: 8,
  },
  opencode: {
    id: "opencode",
    label: "OpenCode",
    icon: "opencode",
    promptFilename: "AGENTS.md",
    endpointTimeoutSecs: 8,
  },
} as const satisfies Record<AppId, AppDefinition>;

export const appList: AppDefinition[] = Object.values(appRegistry);

export const appIds: AppId[] = appList.map((app) => app.id);

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

export function getAppDefinition(appId: AppId): AppDefinition {
  return appRegistry[appId];
}
