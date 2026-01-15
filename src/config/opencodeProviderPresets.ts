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
    name: "DeepSeek",
    websiteUrl: "https://platform.deepseek.com",
    apiKeyUrl: "https://platform.deepseek.com/api_keys",
    settingsConfig: {
      npm: "@ai-sdk/openai-compatible",
      name: "DeepSeek",
      options: {
        baseURL: "https://api.deepseek.com/v1",
        apiKey: "{env:DEEPSEEK_API_KEY}",
      },
      models: {
        "deepseek-chat": {
          name: "DeepSeek Chat",
          limit: {
            context: 64000,
            output: 8192,
          },
        },
        "deepseek-coder": {
          name: "DeepSeek Coder",
          limit: {
            context: 128000,
            output: 8192,
          },
        },
      },
    },
    baseURL: "https://api.deepseek.com/v1",
    description: "DeepSeek AI",
    category: "cn_official",
    icon: "deepseek",
    iconColor: "#1E88E5",
  },
  {
    name: "Zhipu GLM",
    websiteUrl: "https://open.bigmodel.cn",
    apiKeyUrl: "https://www.bigmodel.cn/claude-code?ic=RRVJPB5SII",
    settingsConfig: {
      npm: "@ai-sdk/openai-compatible",
      name: "Zhipu GLM",
      options: {
        baseURL: "https://open.bigmodel.cn/api/paas/v4",
        apiKey: "{env:ZHIPU_API_KEY}",
      },
      models: {
        "glm-4-plus": {
          name: "GLM-4 Plus",
          limit: {
            context: 128000,
            output: 8192,
          },
        },
        "glm-4-air": {
          name: "GLM-4 Air",
          limit: {
            context: 128000,
            output: 8192,
          },
        },
      },
    },
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    description: "智谱 AI GLM 模型",
    category: "cn_official",
    isPartner: true,
    partnerPromotionKey: "zhipu",
    icon: "zhipu",
    iconColor: "#0F62FE",
  },
  {
    name: "Kimi",
    websiteUrl: "https://platform.moonshot.cn",
    apiKeyUrl: "https://platform.moonshot.cn/console/api-keys",
    settingsConfig: {
      npm: "@ai-sdk/openai-compatible",
      name: "Kimi",
      options: {
        baseURL: "https://api.moonshot.cn/v1",
        apiKey: "{env:MOONSHOT_API_KEY}",
      },
      models: {
        "moonshot-v1-8k": {
          name: "Moonshot v1 8K",
          limit: {
            context: 8000,
            output: 8000,
          },
        },
        "moonshot-v1-32k": {
          name: "Moonshot v1 32K",
          limit: {
            context: 32000,
            output: 8000,
          },
        },
        "moonshot-v1-128k": {
          name: "Moonshot v1 128K",
          limit: {
            context: 128000,
            output: 8000,
          },
        },
      },
    },
    baseURL: "https://api.moonshot.cn/v1",
    description: "Moonshot AI (Kimi)",
    category: "cn_official",
    icon: "kimi",
    iconColor: "#6366F1",
  },
  {
    name: "MiniMax",
    websiteUrl: "https://platform.minimaxi.com",
    apiKeyUrl: "https://platform.minimaxi.com/subscribe/coding-plan",
    settingsConfig: {
      npm: "@ai-sdk/openai-compatible",
      name: "MiniMax",
      options: {
        baseURL: "https://api.minimaxi.com/v1",
        apiKey: "{env:MINIMAX_API_KEY}",
      },
      models: {
        "abab6.5s-chat": {
          name: "abab6.5s Chat",
          limit: {
            context: 245760,
            output: 8192,
          },
        },
        "abab6.5g-chat": {
          name: "abab6.5g Chat",
          limit: {
            context: 8192,
            output: 8192,
          },
        },
      },
    },
    baseURL: "https://api.minimaxi.com/v1",
    description: "MiniMax AI",
    category: "cn_official",
    isPartner: true,
    partnerPromotionKey: "minimax_cn",
    icon: "minimax",
    iconColor: "#FF6B6B",
  },
  {
    name: "DouBao",
    websiteUrl: "https://www.volcengine.com/product/doubao",
    apiKeyUrl:
      "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey",
    settingsConfig: {
      npm: "@ai-sdk/openai-compatible",
      name: "DouBao",
      options: {
        baseURL: "https://ark.cn-beijing.volces.com/api/v3",
        apiKey: "{env:DOUBAO_API_KEY}",
      },
      models: {
        "doubao-pro-32k": {
          name: "豆包 Pro 32K",
          limit: {
            context: 32000,
            output: 4096,
          },
        },
        "doubao-lite-32k": {
          name: "豆包 Lite 32K",
          limit: {
            context: 32000,
            output: 4096,
          },
        },
      },
    },
    baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    description: "字节跳动豆包",
    category: "cn_official",
    icon: "doubao",
    iconColor: "#3370FF",
  },
  {
    name: "Qwen",
    websiteUrl: "https://bailian.console.aliyun.com",
    apiKeyUrl: "https://bailian.console.aliyun.com/?apiKey=1",
    settingsConfig: {
      npm: "@ai-sdk/openai-compatible",
      name: "Qwen",
      options: {
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        apiKey: "{env:DASHSCOPE_API_KEY}",
      },
      models: {
        "qwen-max": {
          name: "Qwen Max",
          limit: {
            context: 30000,
            output: 8000,
          },
        },
        "qwen-plus": {
          name: "Qwen Plus",
          limit: {
            context: 128000,
            output: 8000,
          },
        },
        "qwen-turbo": {
          name: "Qwen Turbo",
          limit: {
            context: 128000,
            output: 8000,
          },
        },
      },
    },
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    description: "阿里云通义千问",
    category: "cn_official",
    icon: "qwen",
    iconColor: "#FF6A00",
  },
  {
    name: "AiHubMix",
    websiteUrl: "https://aihubmix.com",
    apiKeyUrl: "https://aihubmix.com",
    settingsConfig: {
      npm: "@ai-sdk/openai-compatible",
      name: "AiHubMix",
      options: {
        baseURL: "https://aihubmix.com/v1",
        apiKey: "{env:AIHUBMIX_API_KEY}",
      },
      models: {
        "gpt-4o": {
          name: "GPT-4o",
          limit: {
            context: 128000,
            output: 4096,
          },
        },
        "claude-sonnet-4-5": {
          name: "Claude Sonnet 4.5",
          limit: {
            context: 200000,
            output: 8192,
          },
        },
      },
    },
    baseURL: "https://aihubmix.com/v1",
    description: "AiHubMix 聚合服务",
    category: "aggregator",
    endpointCandidates: ["https://aihubmix.com", "https://api.aihubmix.com"],
    icon: "aihubmix",
    iconColor: "#006FFB",
  },
  {
    name: "DMXAPI",
    websiteUrl: "https://www.dmxapi.cn",
    apiKeyUrl: "https://www.dmxapi.cn",
    settingsConfig: {
      npm: "@ai-sdk/openai-compatible",
      name: "DMXAPI",
      options: {
        baseURL: "https://www.dmxapi.cn/v1",
        apiKey: "{env:DMXAPI_KEY}",
      },
      models: {
        "gpt-4o": {
          name: "GPT-4o",
          limit: {
            context: 128000,
            output: 4096,
          },
        },
        "claude-sonnet-4-5": {
          name: "Claude Sonnet 4.5",
          limit: {
            context: 200000,
            output: 8192,
          },
        },
      },
    },
    baseURL: "https://www.dmxapi.cn/v1",
    description: "DMXAPI 聚合服务",
    category: "aggregator",
    isPartner: true,
    partnerPromotionKey: "dmxapi",
    endpointCandidates: ["https://www.dmxapi.cn", "https://api.dmxapi.cn"],
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
    name: "Xiaomi MiMo",
    websiteUrl: "https://platform.xiaomimimo.com",
    apiKeyUrl: "https://platform.xiaomimimo.com/#/console/api-keys",
    settingsConfig: {
      npm: "@ai-sdk/openai-compatible",
      name: "Xiaomi MiMo",
      options: {
        baseURL: "https://api.xiaomimimo.com/v1",
        apiKey: "{env:MIMO_API_KEY}",
      },
      models: {
        "mimo-v2-flash": {
          name: "MiMo v2 Flash",
          limit: {
            context: 32000,
            output: 8192,
          },
        },
      },
    },
    baseURL: "https://api.xiaomimimo.com/v1",
    description: "小米 MiMo",
    category: "cn_official",
    icon: "xiaomimimo",
    iconColor: "#000000",
  },
  {
    name: "Azure OpenAI",
    websiteUrl:
      "https://azure.microsoft.com/en-us/products/ai-services/openai-service",
    apiKeyUrl:
      "https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/OpenAI",
    settingsConfig: {
      npm: "@ai-sdk/azure",
      name: "Azure OpenAI",
      options: {
        resourceName: "{env:AZURE_RESOURCE_NAME}",
        apiKey: "{env:AZURE_API_KEY}",
      },
      models: {
        "gpt-4o": {
          name: "GPT-4o",
          limit: {
            context: 128000,
            output: 16384,
          },
        },
        "gpt-4": {
          name: "GPT-4",
          limit: {
            context: 128000,
            output: 4096,
          },
        },
        "gpt-4-turbo": {
          name: "GPT-4 Turbo",
          limit: {
            context: 128000,
            output: 4096,
          },
        },
        "gpt-35-turbo": {
          name: "GPT-3.5 Turbo",
          limit: {
            context: 16385,
            output: 4096,
          },
        },
      },
    },
    description: "Azure OpenAI Service",
    category: "official",
    icon: "azure",
    iconColor: "#0078D4",
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
