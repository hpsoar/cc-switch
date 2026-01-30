import type { AppId } from "@/lib/api";

interface SettingsConfigAdapter {
  getApiKey: (jsonString: string) => string;
  hasApiKeyField: (jsonString: string) => boolean;
  setApiKey: (
    jsonString: string,
    apiKey: string,
    options: { createIfMissing?: boolean },
  ) => string;
}

const parseJsonConfig = (jsonString: string): Record<string, any> | null => {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const ensureEnv = (
  config: Record<string, any>,
  createIfMissing: boolean,
): Record<string, any> | null => {
  if (!config.env) {
    if (!createIfMissing) return null;
    config.env = {};
  }
  return config.env as Record<string, any>;
};

const createEnvAdapter = (envKey: string): SettingsConfigAdapter => {
  return {
    getApiKey: (jsonString) => {
      const config = parseJsonConfig(jsonString);
      const env = config?.env;
      const value = env?.[envKey];
      return typeof value === "string" ? value : "";
    },
    hasApiKeyField: (jsonString) => {
      const config = parseJsonConfig(jsonString);
      const env = config?.env ?? {};
      return Object.prototype.hasOwnProperty.call(env, envKey);
    },
    setApiKey: (jsonString, apiKey, { createIfMissing }) => {
      const config = parseJsonConfig(jsonString);
      if (!config) return jsonString;

      const env = ensureEnv(config, createIfMissing ?? false);
      if (!env) return jsonString;

      if (Object.prototype.hasOwnProperty.call(env, envKey) || createIfMissing) {
        env[envKey] = apiKey;
        return JSON.stringify(config, null, 2);
      }

      return jsonString;
    },
  };
};

const claudeAdapter: SettingsConfigAdapter = {
  getApiKey: (jsonString) => {
    const config = parseJsonConfig(jsonString);
    const env = config?.env;
    const token = env?.ANTHROPIC_AUTH_TOKEN;
    const apiKey = env?.ANTHROPIC_API_KEY;
    if (typeof token === "string") return token;
    if (typeof apiKey === "string") return apiKey;
    return "";
  },
  hasApiKeyField: (jsonString) => {
    const config = parseJsonConfig(jsonString);
    const env = config?.env ?? {};
    return (
      Object.prototype.hasOwnProperty.call(env, "ANTHROPIC_AUTH_TOKEN") ||
      Object.prototype.hasOwnProperty.call(env, "ANTHROPIC_API_KEY")
    );
  },
  setApiKey: (jsonString, apiKey, { createIfMissing }) => {
    const config = parseJsonConfig(jsonString);
    if (!config) return jsonString;

    const env = ensureEnv(config, createIfMissing ?? false);
    if (!env) return jsonString;

    if (Object.prototype.hasOwnProperty.call(env, "ANTHROPIC_AUTH_TOKEN")) {
      env.ANTHROPIC_AUTH_TOKEN = apiKey;
      return JSON.stringify(config, null, 2);
    }

    if (Object.prototype.hasOwnProperty.call(env, "ANTHROPIC_API_KEY")) {
      env.ANTHROPIC_API_KEY = apiKey;
      return JSON.stringify(config, null, 2);
    }

    if (createIfMissing) {
      env.ANTHROPIC_AUTH_TOKEN = apiKey;
      return JSON.stringify(config, null, 2);
    }

    return jsonString;
  },
};

const openCodeAdapter: SettingsConfigAdapter = {
  getApiKey: (jsonString) => {
    const config = parseJsonConfig(jsonString);
    const apiKey = config?.options?.apiKey;
    return typeof apiKey === "string" ? apiKey : "";
  },
  hasApiKeyField: (jsonString) => {
    const config = parseJsonConfig(jsonString);
    const options = config?.options ?? {};
    return Object.prototype.hasOwnProperty.call(options, "apiKey");
  },
  setApiKey: (jsonString, apiKey, { createIfMissing }) => {
    const config = parseJsonConfig(jsonString);
    if (!config) return jsonString;

    if (!config.options) {
      if (!createIfMissing) return jsonString;
      config.options = {};
    }

    const options = config.options as Record<string, any>;
    if (
      Object.prototype.hasOwnProperty.call(options, "apiKey") ||
      createIfMissing
    ) {
      options.apiKey = apiKey;
      return JSON.stringify(config, null, 2);
    }

    return jsonString;
  },
};

export const settingsConfigAdapters: Record<AppId, SettingsConfigAdapter> = {
  claude: claudeAdapter,
  codex: createEnvAdapter("CODEX_API_KEY"),
  gemini: createEnvAdapter("GEMINI_API_KEY"),
  opencode: openCodeAdapter,
};

const isAppId = (value: string): value is AppId => {
  return value in settingsConfigAdapters;
};

export function getSettingsConfigAdapter(appId?: string): SettingsConfigAdapter {
  if (appId && isAppId(appId)) {
    return settingsConfigAdapters[appId];
  }
  return settingsConfigAdapters.claude;
}
