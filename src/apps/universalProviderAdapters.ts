import type {
  UniversalProviderApps,
  UniversalProviderModels,
} from "@/types";
import type { AppId } from "@/lib/api";
import { appList, appRegistry } from "@/apps/registry";

export interface UniversalProviderAppOption {
  id: AppId;
  label: string;
  icon: string;
  displayName: string;
  supportsModels: boolean;
  supportsConfigPreview: boolean;
}

interface UniversalProviderAppAdapter {
  displayName: string;
  supportsModels: boolean;
  supportsConfigPreview: boolean;
}

const universalProviderAdapters: Record<AppId, UniversalProviderAppAdapter> = {
  claude: {
    displayName: "Claude Code",
    supportsModels: true,
    supportsConfigPreview: true,
  },
  codex: {
    displayName: "OpenAI Codex",
    supportsModels: true,
    supportsConfigPreview: true,
  },
  gemini: {
    displayName: "Gemini CLI",
    supportsModels: true,
    supportsConfigPreview: true,
  },
  opencode: {
    displayName: "OpenCode",
    supportsModels: false,
    supportsConfigPreview: false,
  },
};

export const universalProviderAppOptions: UniversalProviderAppOption[] =
  appList.map((app) => ({
    id: app.id,
    label: app.label,
    icon: app.icon,
    displayName: universalProviderAdapters[app.id].displayName,
    supportsModels: universalProviderAdapters[app.id].supportsModels,
    supportsConfigPreview: universalProviderAdapters[app.id].supportsConfigPreview,
  }));

export const universalProviderSyncAppOptions = universalProviderAppOptions.filter(
  (app) => app.supportsConfigPreview,
);

export const getDefaultUniversalProviderApps = (
  enabled = true,
): UniversalProviderApps =>
  appList.reduce(
    (acc, app) => {
      acc[app.id] = enabled;
      return acc;
    },
    {} as UniversalProviderApps,
  );

export type UniversalProviderModelAppId = keyof UniversalProviderModels;

export interface UniversalProviderModelField {
  key: string;
  label: string;
  labelKey?: string;
  placeholder: string;
}

export interface UniversalProviderModelSection {
  appId: UniversalProviderModelAppId;
  label: string;
  icon: string;
  fields: UniversalProviderModelField[];
}

export const universalProviderModelSections: UniversalProviderModelSection[] = [
  {
    appId: "claude",
    label: appRegistry.claude.label,
    icon: appRegistry.claude.icon,
    fields: [
      {
        key: "model",
        label: "主模型",
        labelKey: "universalProvider.model",
        placeholder: "claude-sonnet-4-20250514",
      },
      {
        key: "haikuModel",
        label: "Haiku",
        placeholder: "claude-haiku-4-20250514",
      },
      {
        key: "sonnetModel",
        label: "Sonnet",
        placeholder: "claude-sonnet-4-20250514",
      },
      {
        key: "opusModel",
        label: "Opus",
        placeholder: "claude-sonnet-4-20250514",
      },
    ],
  },
  {
    appId: "codex",
    label: appRegistry.codex.label,
    icon: appRegistry.codex.icon,
    fields: [
      {
        key: "model",
        label: "模型",
        labelKey: "universalProvider.model",
        placeholder: "gpt-4o",
      },
      {
        key: "reasoningEffort",
        label: "Reasoning Effort",
        placeholder: "high",
      },
    ],
  },
  {
    appId: "gemini",
    label: appRegistry.gemini.label,
    icon: appRegistry.gemini.icon,
    fields: [
      {
        key: "model",
        label: "模型",
        labelKey: "universalProvider.model",
        placeholder: "gemini-2.5-pro",
      },
    ],
  },
];

export interface UniversalProviderConfigPreviewInput {
  baseUrl: string;
  apiKey: string;
  models: UniversalProviderModels;
  enabledApps: UniversalProviderApps;
}

export interface UniversalProviderConfigPreview {
  id: keyof UniversalProviderApps;
  label: string;
  icon: string;
  json: Record<string, unknown>;
  editorHeight: number;
}

export const getUniversalProviderConfigPreviews = (
  input: UniversalProviderConfigPreviewInput,
): UniversalProviderConfigPreview[] => {
  const { baseUrl, apiKey, models, enabledApps } = input;
  const previews: UniversalProviderConfigPreview[] = [];

  if (enabledApps.claude) {
    const model = models.claude?.model || "claude-sonnet-4-20250514";
    const haiku = models.claude?.haikuModel || "claude-haiku-4-20250514";
    const sonnet = models.claude?.sonnetModel || "claude-sonnet-4-20250514";
    const opus = models.claude?.opusModel || "claude-sonnet-4-20250514";
    previews.push({
      id: "claude",
      label: appRegistry.claude.label,
      icon: appRegistry.claude.icon,
      editorHeight: 180,
      json: {
        env: {
          ANTHROPIC_BASE_URL: baseUrl,
          ANTHROPIC_AUTH_TOKEN: apiKey,
          ANTHROPIC_MODEL: model,
          ANTHROPIC_DEFAULT_HAIKU_MODEL: haiku,
          ANTHROPIC_DEFAULT_SONNET_MODEL: sonnet,
          ANTHROPIC_DEFAULT_OPUS_MODEL: opus,
        },
      },
    });
  }

  if (enabledApps.codex) {
    const model = models.codex?.model || "gpt-4o";
    const reasoningEffort = models.codex?.reasoningEffort || "high";
    const normalizedBaseUrl = baseUrl.endsWith("/v1")
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, "")}/v1`;
    const configToml = `model_provider = "newapi"
model = "${model}"
model_reasoning_effort = "${reasoningEffort}"
disable_response_storage = true

[model_providers.newapi]
name = "NewAPI"
base_url = "${normalizedBaseUrl}"
wire_api = "responses"
requires_openai_auth = true`;

    previews.push({
      id: "codex",
      label: appRegistry.codex.label,
      icon: appRegistry.codex.icon,
      editorHeight: 280,
      json: {
        auth: {
          OPENAI_API_KEY: apiKey,
        },
        config: configToml,
      },
    });
  }

  if (enabledApps.gemini) {
    const model = models.gemini?.model || "gemini-2.5-pro";
    previews.push({
      id: "gemini",
      label: appRegistry.gemini.label,
      icon: appRegistry.gemini.icon,
      editorHeight: 140,
      json: {
        env: {
          GOOGLE_GEMINI_BASE_URL: baseUrl,
          GEMINI_API_KEY: apiKey,
          GEMINI_MODEL: model,
        },
      },
    });
  }

  return previews;
};
