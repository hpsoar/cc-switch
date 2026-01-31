import type { AppId } from "@/lib/api";

export type DeeplinkConfigView =
  | {
      format: "env";
      env: Record<string, string>;
      raw: Record<string, unknown>;
    }
  | {
      format: "authToml";
      auth: Record<string, string>;
      tomlConfig: string;
      raw: Record<string, unknown>;
    };

interface DeeplinkConfigAdapter {
  parse: (parsed: Record<string, unknown>) => DeeplinkConfigView | null;
}

const toStringRecord = (
  value: unknown,
): Record<string, string> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record: Record<string, string> = {};
  for (const [key, entry] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (entry === null || entry === undefined) continue;
    if (typeof entry === "string") {
      record[key] = entry;
      continue;
    }
    if (typeof entry === "number" || typeof entry === "boolean") {
      record[key] = String(entry);
    }
  }

  return record;
};

const createEnvAdapter = (
  envSelector: (parsed: Record<string, unknown>) => Record<string, string> | null,
): DeeplinkConfigAdapter => {
  return {
    parse: (parsed) => {
      const env = envSelector(parsed);
      if (!env) return null;
      return {
        format: "env",
        env,
        raw: parsed,
      };
    },
  };
};

const claudeAdapter = createEnvAdapter((parsed) =>
  toStringRecord(parsed.env),
);

const geminiAdapter = createEnvAdapter((parsed) =>
  toStringRecord(parsed),
);

const codexAdapter: DeeplinkConfigAdapter = {
  parse: (parsed) => {
    const auth = toStringRecord(parsed.auth) ?? {};
    const tomlConfig = typeof parsed.config === "string" ? parsed.config : "";
    return {
      format: "authToml",
      auth,
      tomlConfig,
      raw: parsed,
    };
  },
};

const deeplinkConfigAdapters: Partial<Record<AppId, DeeplinkConfigAdapter>> = {
  claude: claudeAdapter,
  codex: codexAdapter,
  gemini: geminiAdapter,
};

export const getDeeplinkConfigView = (
  appId: AppId | undefined,
  parsed: Record<string, unknown>,
): DeeplinkConfigView | null => {
  if (!appId) return null;
  const adapter = deeplinkConfigAdapters[appId];
  if (!adapter) return null;
  return adapter.parse(parsed);
};
