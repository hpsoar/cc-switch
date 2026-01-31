export const appIds = ["claude", "codex", "gemini", "opencode"] as const;

export type AppId = (typeof appIds)[number];
