import type { ProviderCategory } from "@/types";

/**
 * OpenCode 预设供应商的视觉主题配置
 */
export interface OpenCodePresetTheme {
  /** 图标类型：'opencode' | 'generic' */
  icon?: "opencode" | "generic";
  /** 背景色（选中状态），支持 hex 颜色 */
  backgroundColor?: string;
  /** 文字色（选中状态），支持 hex 颜色 */
  textColor?: string;
}

export interface OpenCodeProviderPreset {
  name: string;
  websiteUrl: string;
  apiKeyUrl?: string;
  settingsConfig: object;
  baseURL?: string;
  model?: string;
  description?: string;
  category?: ProviderCategory;
  isPartner?: boolean;
  partnerPromotionKey?: string;
  endpointCandidates?: string[];
  theme?: OpenCodePresetTheme;
  // 图标配置
  icon?: string; // 图标名称
  iconColor?: string; // 图标颜色
}

export const opencodeProviderPresets: OpenCodeProviderPreset[] = [
  {
    name: "OpenCode Official",
    websiteUrl: "https://opencode.ai",
    settingsConfig: {
      env: {},
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
      env: {
        OPENCODE_BASE_URL: "https://www.packyapi.com",
        MODEL: "openai/gpt-4o",
      },
    },
    baseURL: "https://www.packyapi.com",
    model: "openai/gpt-4o",
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
      env: {
        OPENCODE_BASE_URL: "https://api.cubence.com",
        MODEL: "openai/gpt-4o",
      },
    },
    baseURL: "https://api.cubence.com",
    model: "openai/gpt-4o",
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
      env: {
        OPENCODE_BASE_URL: "https://api.aigocode.com/openai",
        MODEL: "openai/gpt-4o",
      },
    },
    baseURL: "https://api.aigocode.com/openai",
    model: "openai/gpt-4o",
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
      env: {
        OPENCODE_BASE_URL: "https://openrouter.ai/api/v1",
        MODEL: "openai/gpt-4o",
      },
    },
    baseURL: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o",
    description: "OpenRouter",
    category: "aggregator",
    icon: "openrouter",
    iconColor: "#6566F1",
  },
  {
    name: "自定义",
    websiteUrl: "",
    settingsConfig: {
      env: {
        OPENCODE_BASE_URL: "",
        MODEL: "openai/gpt-4o",
      },
    },
    model: "openai/gpt-4o",
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
