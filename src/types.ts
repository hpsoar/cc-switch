export type ProviderCategory =
  | "official" // 官方
  | "cn_official" // 开源官方（原"国产官方"）
  | "aggregator" // 聚合网站
  | "third_party" // 第三方供应商
  | "custom"; // 自定义

export interface ProviderMeta {
  description?: string;
  capabilities?: string[];
}

export interface Provider {
  id: string;
  name: string;
  settingsConfig: Record<string, any>; // 应用配置对象：Claude 为 settings.json；Codex 为 { auth, config }
  websiteUrl?: string;
  // 新增：供应商分类（用于差异化提示/能力开关）
  category?: ProviderCategory;
  createdAt?: number; // 添加时间戳（毫秒）
  sortIndex?: number; // 排序索引（用于自定义拖拽排序）
  // 备注信息
  notes?: string;
  // 新增：是否为商业合作伙伴
  isPartner?: boolean;
  // 可选：供应商元数据（仅存于 ~/.cc-switch/config.json，不写入 live 配置）
  meta?: ProviderMeta;
  // 图标配置
  icon?: string; // 图标名称（如 "openai", "anthropic"）
  iconColor?: string; // 图标颜色（Hex 格式，如 "#00A67E"）
  // 是否加入故障转移队列
  inFailoverQueue?: boolean;
}

export interface AppConfig {
  providers: Record<string, Provider>;
  current: string;
}

// 自定义端点配置
export interface CustomEndpoint {
  url: string;
  addedAt: number;
  lastUsed?: number;
}

// 端点候选项（用于端点测速弹窗）
export interface EndpointCandidate {
  id?: string;
  url: string;
  isCustom?: boolean;
}

// 用量查询脚本配置
export interface UsageScript {
  enabled: boolean; // 是否启用用量查询
  language: "javascript"; // 脚本语言
  code: string; // 脚本代码（JSON 格式配置）
  timeout?: number; // 超时时间（秒，默认 10）
  apiKey?: string; // 用量查询专用的 API Key（通用模板使用）
  baseUrl?: string; // 用量查询专用的 Base URL（通用和 NewAPI 模板使用）
  accessToken?: string; // 访问令牌（NewAPI 模板使用）
  userId?: string; // 用户ID（NewAPI 模板使用）
  autoQueryInterval?: number; // 自动查询间隔（单位：分钟，0 表示禁用）
  autoIntervalMinutes?: number; // 自动查询间隔（分钟）- 别名字段
  request?: {
    // 请求配置
    url?: string; // 请求 URL
    method?: string; // HTTP 方法
    headers?: Record<string, string>; // 请求头
    body?: any; // 请求体
  };
}

export interface ToolTestResult {
  success: boolean;
  message: string;
  details?: string;
}

// ============================================================================
// 统一供应商（Universal Provider）- 跨应用共享配置
// ============================================================================

// 统一供应商的应用启用状态
export interface UniversalProviderApps {
  claude: boolean;
  codex: boolean;
  gemini: boolean;
  opencode: boolean;
}

// Claude 模型配置
export interface ClaudeModelConfig {
  model?: string;
  haikuModel?: string;
  sonnetModel?: string;
  opusModel?: string;
}

// Codex 模型配置
export interface CodexModelConfig {
  model?: string;
  reasoningEffort?: string;
}

// Gemini 模型配置
export interface GeminiModelConfig {
  model?: string;
}

// 各应用的模型配置
export interface UniversalProviderModels {
  claude?: ClaudeModelConfig;
  codex?: CodexModelConfig;
  gemini?: GeminiModelConfig;
}

// 统一供应商（跨应用共享配置）
export interface UniversalProvider {
  id: string;
  name: string;
  providerType: string; // "newapi" | "custom" 等
  apps: UniversalProviderApps;
  baseUrl: string;
  apiKey: string;
  models: UniversalProviderModels;
  websiteUrl?: string;
  notes?: string;
  icon?: string;
  iconColor?: string;
  meta?: ProviderMeta;
  createdAt?: number;
  sortIndex?: number;
}

// 统一供应商映射（id -> UniversalProvider）
export type UniversalProvidersMap = Record<string, UniversalProvider>;

export interface McpServerSpec {
  type?: "stdio" | "http" | "sse";
  command?: string | string[];
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  url?: string;
  headers?: Record<string, string>;
}

export interface McpServer {
  id: string;
  name: string;
  server: McpServerSpec;
  description?: string;
  tags?: string[];
  homepage?: string;
  docs?: string;
  apps?: {
    claude: boolean;
    codex: boolean;
    gemini: boolean;
    opencode: boolean;
  };
}

export type McpServersMap = Record<string, McpServer>;

export interface McpStatus {
  enabled: boolean;
  configPath?: string;
}

export interface McpConfigResponse {
  servers: Record<string, McpServer>;
}

export interface McpTestResult {
  success: boolean;
  message: string;
  details?: string;
  server_info?: {
    name: string;
    version: string;
    protocol_version: string;
  };
  tools?: ToolInfo[];
  resources?: Array<{
    uri: string;
    name?: string;
    description?: string;
  }>;
  prompts?: Array<{
    name: string;
    description?: string;
  }>;
}

export interface ToolInfo {
  name: string;
  description?: string;
  input_schema?: any;
}
