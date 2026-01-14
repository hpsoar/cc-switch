import type { ProviderCategory } from "@/types";

export interface OpenCodePresetTheme {
  icon?: "opencode" | "generic";
  backgroundColor?: string;
  textColor?: string;
}

export interface OpenCodeProviderPreset {
  name: string;
  websiteUrl: string;
  apiKeyUrl?: string;
  settingsConfig: object;
  baseURL?: string;
  description?: string;
  category?: ProviderCategory;
  isPartner?: boolean;
  partnerPromotionKey?: string;
  endpointCandidates?: string[];
  theme?: OpenCodePresetTheme;
  icon?: string;
  iconColor?: string;
}

export const opencodeProviderPresets: OpenCodeProviderPreset[] = [
  {
    name: "OpenCode Official",
    websiteUrl: "https://opencode.ai",
    settingsConfig: {
      npm: "@ai-sdk/anthropic",
      name: "OpenCode Official",
      options: {
        apiKey: "{env:OPENCODE_API_KEY}",
      },
      models: {
        "claude-sonnet-4-5": {
          name: "Claude Sonnet 4.5",
          limit: {
            context: 200000,
            output: 64000,
          },
        },
        "claude-haiku-4-5": {
          name: "Claude Haiku 4.5",
          limit: {
            context: 200000,
            output: 8192,
          },
        },
      },
    },
    description: "OpenCode 官方 API",
    category: "official",
    theme: {
      icon: "opencode",
      backgroundColor: "#4285F4",
      textColor: "#FFFFFF",
    },
    icon: "opencode",
    iconColor: "#4285F4",
  },
  {
    name: "PackyCode",
    websiteUrl: "https://www.packyapi.com",
    apiKeyUrl: "https://www.packyapi.com/register?aff=cc-switch",
    settingsConfig: {
      npm: "@ai-sdk/openai-compatible",
      name: "PackyCode",
      options: {
        baseURL: "https://www.packyapi.com",
        apiKey: "{env:API_KEY}",
      },
      models: {
        "openai/gpt-4o": {
          name: "GPT-4o",
          limit: {
            context: 128000,
            output: 4096,
          },
        },
        "anthropic/claude-sonnet-4-5": {
          name: "Claude Sonnet 4.5",
          limit: {
            context: 200000,
            output: 64000,
          },
        },
      },
    },
    baseURL: "https://www.packyapi.com",
    description: "PackyCode",
    category: "third_party",
    isPartner: true,
    partnerPromotionKey: "packycode",
    endpointCandidates: [
      "https://api-slb.packyapi.com",
      "https://www.packyapi.com",
    ],
    icon: "packycode",
  },
  {
    name: "Cubence",
    websiteUrl: "https://cubence.com",
    apiKeyUrl: "https://cubence.com/signup?code=CCSWITCH&source=ccs",
    settingsConfig: {
      npm: "@ai-sdk/openai-compatible",
      name: "Cubence",
      options: {
        baseURL: "https://api.cubence.com",
        apiKey: "{env:API_KEY}",
      },
      models: {
        "openai/gpt-4o": {
          name: "GPT-4o",
          limit: {
            context: 128000,
            output: 4096,
          },
        },
        "anthropic/claude-sonnet-4-5": {
          name: "Claude Sonnet 4.5",
          limit: {
            context: 200000,
            output: 64000,
          },
        },
      },
    },
    baseURL: "https://api.cubence.com",
    description: "Cubence",
    category: "third_party",
    isPartner: true,
    partnerPromotionKey: "cubence",
    endpointCandidates: [
      "https://api.cubence.com/v1",
      "https://api-cf.cubence.com/v1",
      "https://api-dmit.cubence.com/v1",
      "https://api-bwg.cubence.com/v1",
    ],
    icon: "cubence",
    iconColor: "#000000",
  },
  {
    name: "AIGoCode",
    websiteUrl: "https://aigocode.com",
    apiKeyUrl: "https://aigocode.com/invite/CC-SWITCH",
    settingsConfig: {
      npm: "@ai-sdk/openai-compatible",
      name: "AIGoCode",
      options: {
        baseURL: "https://api.aigocode.com/openai",
        apiKey: "{env:API_KEY}",
      },
      models: {
        "openai/gpt-4o": {
          name: "GPT-4o",
          limit: {
            context: 128000,
            output: 4096,
          },
        },
      },
    },
    baseURL: "https://api.aigocode.com/openai",
    description: "AIGoCode",
    category: "third_party",
    isPartner: true,
    partnerPromotionKey: "aigocode",
    endpointCandidates: ["https://api.aigocode.com/openai"],
    icon: "aigocode",
    iconColor: "#5B7FFF",
  },
  {
    name: "OpenRouter",
    websiteUrl: "https://openrouter.ai",
    apiKeyUrl: "https://openrouter.ai/keys",
    settingsConfig: {
      npm: "@ai-sdk/openai-compatible",
      name: "OpenRouter",
      options: {
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: "{env:OPENROUTER_API_KEY}",
        headers: {
          "HTTP-Referer": "https://cc-switch.opencode.ai/",
          "X-Title": "CC-Switch",
        },
      },
      models: {
        "anthropic/claude-sonnet-4.5": {
          name: "Claude Sonnet 4.5",
          limit: {
            context: 200000,
            output: 8192,
          },
        },
        "openai/gpt-4o": {
          name: "GPT-4o",
          limit: {
            context: 128000,
            output: 4096,
          },
        },
      },
    },
    baseURL: "https://openrouter.ai/api/v1",
    description: "OpenRouter",
    category: "aggregator",
    icon: "openrouter",
    iconColor: "#6566F1",
  },
  {
    name: "Custom",
    websiteUrl: "",
    settingsConfig: {
      npm: "@ai-sdk/openai-compatible",
      name: "Custom Provider",
      options: {
        baseURL: "https://your-api-endpoint.com/v1",
        apiKey: "{env:API_KEY}",
      },
      models: {
        "gpt-4": {
          name: "GPT-4",
          limit: {
            context: 128000,
            output: 4096,
          },
        },
      },
    },
    description: "自定义 OpenCode API 端点",
    category: "custom",
  },
];

export function getOpenCodePresetByName(
  name: string,
): OpenCodeProviderPreset | undefined {
  return opencodeProviderPresets.find((preset) => preset.name === name);
}

export function getOpenCodePresetByUrl(
  url: string,
): OpenCodeProviderPreset | undefined {
  if (!url) return undefined;
  return opencodeProviderPresets.find(
    (preset) =>
      preset.baseURL &&
      url.toLowerCase().includes(preset.baseURL.toLowerCase()),
  );
}
