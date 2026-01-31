import type { AppId } from "@/lib/api";
import type { ProviderPreset } from "@/config/claudeProviderPresets";
import type { CodexProviderPreset } from "@/config/codexProviderPresets";
import type { GeminiProviderPreset } from "@/config/geminiProviderPresets";
import type { OpenCodeProviderPreset } from "@/config/opencodeProviderPresets";
import { providerPresets } from "@/config/claudeProviderPresets";
import { codexProviderPresets } from "@/config/codexProviderPresets";
import { geminiProviderPresets } from "@/config/geminiProviderPresets";
import { opencodeProviderPresets } from "@/config/opencodeProviderPresets";
import { getCodexCustomTemplate } from "@/config/codexTemplates";
import type { ProviderFormData } from "@/lib/schemas/provider";
import type { ProviderCategory } from "@/types";

export type ProviderPresetEntry = {
  id: string;
  preset:
    | ProviderPreset
    | CodexProviderPreset
    | GeminiProviderPreset
    | OpenCodeProviderPreset;
};

const defaultSettingsConfigMap: Record<AppId, string> = {
  claude: JSON.stringify({ env: {} }, null, 2),
  codex: JSON.stringify({ auth: {}, config: "" }, null, 2),
  gemini: JSON.stringify(
    {
      env: {
        GOOGLE_GEMINI_BASE_URL: "",
        GEMINI_API_KEY: "",
        GEMINI_MODEL: "gemini-3-pro-preview",
      },
    },
    null,
    2,
  ),
  opencode: JSON.stringify(
    {
      npm: "@ai-sdk/openai-compatible",
      name: "",
      options: {
        baseURL: "",
        apiKey: "{env:API_KEY}",
      },
      models: {},
    },
    null,
    2,
  ),
};

export const getDefaultSettingsConfig = (appId: AppId): string => {
  return defaultSettingsConfigMap[appId];
};

const presetMap: Record<AppId, ProviderPresetEntry[]> = {
  claude: providerPresets.map((preset, index) => ({
    id: `claude-${index}`,
    preset,
  })),
  codex: codexProviderPresets.map((preset, index) => ({
    id: `codex-${index}`,
    preset,
  })),
  gemini: geminiProviderPresets.map((preset, index) => ({
    id: `gemini-${index}`,
    preset,
  })),
  opencode: opencodeProviderPresets.map((preset, index) => ({
    id: `opencode-${index}`,
    preset,
  })),
};

export const getProviderPresetEntries = (
  appId: AppId,
): ProviderPresetEntry[] => {
  return presetMap[appId];
};

export interface ProviderFormAppFeatures {
  supportsTemplateValues: boolean;
  supportsClaudeCommonConfig: boolean;
  supportsCodexCommonConfig: boolean;
  supportsGeminiCommonConfig: boolean;
  supportsOpenCodeCommonConfig: boolean;
  supportsGeminiConfigState: boolean;
  supportsOpenCodeConfigState: boolean;
  supportsOpenRouterCompat: boolean;
  supportsOpenCodeNameSync: boolean;
  supportsApiKeyLink: boolean;
  speedTestMode: "claude" | "codex" | "gemini" | "none";
}

const providerFormAppFeatures: Record<AppId, ProviderFormAppFeatures> = {
  claude: {
    supportsTemplateValues: true,
    supportsClaudeCommonConfig: true,
    supportsCodexCommonConfig: false,
    supportsGeminiCommonConfig: false,
    supportsOpenCodeCommonConfig: false,
    supportsGeminiConfigState: false,
    supportsOpenCodeConfigState: false,
    supportsOpenRouterCompat: true,
    supportsOpenCodeNameSync: false,
    supportsApiKeyLink: true,
    speedTestMode: "claude",
  },
  codex: {
    supportsTemplateValues: false,
    supportsClaudeCommonConfig: false,
    supportsCodexCommonConfig: true,
    supportsGeminiCommonConfig: false,
    supportsOpenCodeCommonConfig: false,
    supportsGeminiConfigState: false,
    supportsOpenCodeConfigState: false,
    supportsOpenRouterCompat: false,
    supportsOpenCodeNameSync: false,
    supportsApiKeyLink: true,
    speedTestMode: "codex",
  },
  gemini: {
    supportsTemplateValues: false,
    supportsClaudeCommonConfig: false,
    supportsCodexCommonConfig: false,
    supportsGeminiCommonConfig: true,
    supportsOpenCodeCommonConfig: false,
    supportsGeminiConfigState: true,
    supportsOpenCodeConfigState: false,
    supportsOpenRouterCompat: false,
    supportsOpenCodeNameSync: false,
    supportsApiKeyLink: true,
    speedTestMode: "gemini",
  },
  opencode: {
    supportsTemplateValues: false,
    supportsClaudeCommonConfig: false,
    supportsCodexCommonConfig: false,
    supportsGeminiCommonConfig: false,
    supportsOpenCodeCommonConfig: true,
    supportsGeminiConfigState: false,
    supportsOpenCodeConfigState: true,
    supportsOpenRouterCompat: false,
    supportsOpenCodeNameSync: true,
    supportsApiKeyLink: false,
    speedTestMode: "none",
  },
};

export const getProviderFormAppFeatures = (
  appId: AppId,
): ProviderFormAppFeatures => providerFormAppFeatures[appId];

export const getPresetCategory = (
  preset: ProviderPresetEntry["preset"],
): ProviderCategory | undefined => {
  if ("category" in preset && preset.category) {
    return preset.category as ProviderCategory;
  }
  if ("isOfficial" in preset && preset.isOfficial) {
    return "official";
  }
  return undefined;
};

export type ProviderCustomPresetTemplate = {
  auth?: Record<string, unknown>;
  config?: string;
};

export const getCustomPresetTemplate = (
  appId: AppId,
): ProviderCustomPresetTemplate | null => {
  if (appId === "codex") {
    return getCodexCustomTemplate();
  }
  return null;
};

export type ProviderRequiredFieldType = "apiKey" | "endpoint";

export interface ProviderRequiredField {
  type: ProviderRequiredFieldType;
  value: string;
}

export interface ProviderRequiredFieldValues {
  apiKey: string;
  baseUrl: string;
  codexApiKey: string;
  codexBaseUrl: string;
  geminiApiKey: string;
  geminiBaseUrl: string;
  opencodeApiKey: string;
  opencodeBaseUrl: string;
}

const requiredFieldMap: Record<AppId, Array<keyof ProviderRequiredFieldValues>> =
  {
    claude: ["baseUrl", "apiKey"],
    codex: ["codexBaseUrl", "codexApiKey"],
    gemini: ["geminiBaseUrl", "geminiApiKey"],
    opencode: ["opencodeBaseUrl", "opencodeApiKey"],
  };

const requiredFieldTypeMap: Record<keyof ProviderRequiredFieldValues, ProviderRequiredFieldType> =
  {
    apiKey: "apiKey",
    baseUrl: "endpoint",
    codexApiKey: "apiKey",
    codexBaseUrl: "endpoint",
    geminiApiKey: "apiKey",
    geminiBaseUrl: "endpoint",
    opencodeApiKey: "apiKey",
    opencodeBaseUrl: "endpoint",
  };

export const getRequiredProviderFields = (
  appId: AppId,
  category: ProviderCategory,
  values: ProviderRequiredFieldValues,
): ProviderRequiredField[] => {
  if (category === "official") return [];

  const keys = requiredFieldMap[appId];
  return keys.map((key) => ({
    type: requiredFieldTypeMap[key],
    value: values[key],
  }));
};

export interface ProviderSettingsConfigInput {
  appId: AppId;
  values: ProviderFormData;
  codexAuth: string;
  codexConfig: string | null;
  geminiEnv: string;
  geminiConfig: string;
  opencodeConfig: string;
  envStringToObj: (value: string) => Record<string, unknown>;
}

export const buildProviderSettingsConfig = (
  input: ProviderSettingsConfigInput,
): string => {
  const { appId, values } = input;
  if (appId === "codex") {
    try {
      const authJson = JSON.parse(input.codexAuth);
      const configObj = {
        auth: authJson,
        config: input.codexConfig ?? "",
      };
      return JSON.stringify(configObj);
    } catch {
      return values.settingsConfig.trim();
    }
  }

  if (appId === "gemini") {
    try {
      const envObj = input.envStringToObj(input.geminiEnv);
      const configObj = input.geminiConfig.trim()
        ? JSON.parse(input.geminiConfig)
        : {};
      const combined = {
        env: envObj,
        config: configObj,
      };
      return JSON.stringify(combined);
    } catch {
      return values.settingsConfig.trim();
    }
  }

  if (appId === "opencode") {
    return input.opencodeConfig.trim();
  }

  return values.settingsConfig.trim();
};
