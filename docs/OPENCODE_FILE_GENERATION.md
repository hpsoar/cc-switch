# OpenCode opencode.json 文件生成测试

## 概述

这些测试验证 OpenCode 配置文件 `~/.config/opencode/opencode.json` 的正确生成。

## 测试结果

✅ **13/13 测试通过**

### 1. Provider Configuration Structure (3/3 通过)

#### ✅ Custom Provider opencode.json 生成

**输入配置：**

```typescript
{
  id: "custom-1",
  name: "Custom Provider",
  app: "opencode",
  category: "custom",
  settings_config: {
    provider: {
      type: "custom",
      apiKey: "sk-custom-key-123",
      baseUrl: "https://api.custom.com/v1",
      model: "openai/gpt-4o",
    },
    env: {
      OPENCODE_BASE_URL: "https://api.custom.com/v1",
      OPENCODE_API_KEY: "sk-custom-key-123",
      MODEL: "openai/gpt-4o",
    },
    config: {}
  }
}
```

**生成的 opencode.json：**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "type": "custom",
    "apiKey": "sk-custom-key-123",
    "baseUrl": "https://api.custom.com/v1",
    "model": "openai/gpt-4o"
  },
  "mcp": {},
  "plugin": []
}
```

#### ✅ PackyCode Preset opencode.json 生成

**输入配置：**

```typescript
{
  id: "packycode-1",
  name: "PackyCode",
  app: "opencode",
  category: "third_party",
  settings_config: {
    provider: {
      type: "custom",
      apiKey: "sk-packycode-key",
      baseUrl: "https://www.packyapi.com",
      model: "openai/gpt-4o",
    },
    env: {
      OPENCODE_BASE_URL: "https://www.packyapi.com",
      OPENCODE_API_KEY: "sk-packycode-key",
      MODEL: "openai/gpt-4o"
    }
  }
}
```

**生成的 opencode.json：**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "type": "custom",
    "apiKey": "sk-packycode-key",
    "baseUrl": "https://www.packyapi.com",
    "model": "openai/gpt-4o"
  },
  "mcp": {},
  "plugin": []
}
```

#### ✅ Cubence Preset opencode.json 生成

**输入配置：**

```typescript
{
  id: "cubence-1",
  name: "Cubence",
  app: "opencode",
  category: "third_party",
  settings_config: {
    provider: {
      type: "custom",
      apiKey: "sk-cubence-key",
      baseUrl: "https://api.cubence.com",
      model: "openai/gpt-4o"
    },
    env: {
      OPENCODE_BASE_URL: "https://api.cubence.com",
      OPENCODE_API_KEY: "sk-cubence-key",
      MODEL: "openai/gpt-4o"
    }
  }
}
```

**生成的 opencode.json：**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "type": "custom",
    "apiKey": "sk-cubence-key",
    "baseUrl": "https://api.cubence.com",
    "model": "openai/gpt-4o"
  },
  "mcp": {},
  "plugin": []
}
```

### 2. Extended Configuration (1/1 通过)

#### ✅ 扩展配置 opencode.json 生成

**输入配置：**

```typescript
{
  id: "extended-1",
  name: "Extended Provider",
  app: "opencode",
  category: "third_party",
  settings_config: {
    provider: {
      type: "custom",
      apiKey: "sk-extended-key",
      baseUrl: "https://api.extended.com",
      model: "openai/gpt-4-turbo"
    },
    env: {
      OPENCODE_BASE_URL: "https://api.extended.com",
      OPENCODE_API_KEY: "sk-extended-key",
      MODEL: "openai/gpt-4-turbo",
      MAX_TOKENS: "8192",
      TEMPERATURE: "0.7",
      TIMEOUT: "30000"
    },
    config: {
      maxTokens: 8192,
      temperature: 0.7,
      timeout: 30000,
      enableStreaming: true
    }
  }
}
```

**生成的 opencode.json：**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "type": "custom",
    "apiKey": "sk-extended-key",
    "baseUrl": "https://api.extended.com",
    "model": "openai/gpt-4-turbo",
    "maxTokens": 8192,
    "temperature": 0.7,
    "timeout": 30000,
    "enableStreaming": true
  },
  "mcp": {},
  "plugin": []
}
```

### 3. MCP Configuration in opencode.json (3/3 通过)

#### ✅ Stdio MCP Server 配置

**MCP 配置：**

```json
{
  "test-server": {
    "type": "stdio",
    "command": "node",
    "args": ["server.js"],
    "enabled": true
  }
}
```

**写入 opencode.json 的 mcp 字段：**

```json
{
  "mcp": {
    "test-server": {
      "type": "stdio",
      "command": "node",
      "args": ["server.js"],
      "enabled": true
    }
  }
}
```

#### ✅ HTTP MCP Server 配置

**MCP 配置：**

```json
{
  "http-server": {
    "type": "http",
    "url": "https://api.example.com/mcp",
    "enabled": true
  }
}
```

**写入 opencode.json 的 mcp 字段：**

```json
{
  "mcp": {
    "http-server": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "enabled": true
    }
  }
}
```

#### ✅ SSE MCP Server 配置

**MCP 配置：**

```json
{
  "sse-server": {
    "type": "sse",
    "url": "https://api.example.com/sse",
    "enabled": true
  }
}
```

**写入 opencode.json 的 mcp 字段：**

```json
{
  "mcp": {
    "sse-server": {
      "type": "sse",
      "url": "https://api.example.com/sse",
      "enabled": true
    }
  }
}
```

### 4. Complete opencode.json Structure (1/1 通过)

#### ✅ 完整的 opencode.json（Provider + MCP）

**生成的完整 opencode.json：**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "type": "custom",
    "apiKey": "sk-complete-key",
    "baseUrl": "https://api.complete.com",
    "model": "openai/gpt-4o"
  },
  "mcp": {
    "test-server": {
      "type": "stdio",
      "command": "node",
      "args": ["server.js"],
      "enabled": true
    }
  },
  "plugin": []
}
```

### 5. Configuration Validation (3/3 通过)

#### ✅ 必填字段验证

验证 `opencode.json` 包含所有必需字段：

- `$schema`: ✅ 必须为 `https://opencode.ai/config.json`
- `provider`: ✅ 必须存在（对象）
- `mcp`: ✅ 必须存在（对象）
- `plugin`: ✅ 必须存在（数组）

#### ✅ Provider 字段结构验证

验证 provider 对象的结构：

- `type`: ✅ 字符串类型
- `apiKey`: ✅ 字符串类型
- `baseUrl`: ✅ 字符串类型（可选）
- `model`: ✅ 字符串类型（可选）

#### ✅ MCP Server 结构验证

验证 MCP 服务器配置的结构：

- `type`: ✅ 必须是 "stdio", "http", 或 "sse"
- `command`: ✅ stdio 类型必需
- `url`: ✅ http/sse 类型必需
- `args`: ✅ stdio 类型可选
- `enabled`: ✅ 布尔值

### 6. Configuration Transformation (2/2 通过)

#### ✅ Provider 配置转换

验证从 `settings_config.provider` 到 `opencode.json` 的转换：

```typescript
// 输入：Provider.settings_config.provider
{
  type: "custom",
  apiKey: "sk-transform",
  baseUrl: "https://api.transform.com",
  model: "openai/gpt-4o"
}

// 输出：opencode.json.provider
{
  type: "custom",
  apiKey: "sk-transform",
  baseUrl: "https://api.transform.com",
  model: "openai/gpt-4o"
}
```

#### ✅ 扩展配置合并

验证 `settings_config.config` 合并到 provider：

```typescript
// 基础配置
{
  type: "custom",
  apiKey: "sk-base"
}

// 扩展配置
{
  maxTokens: 8192,
  temperature: 0.7
}

// 合并后
{
  type: "custom",
  apiKey: "sk-base",
  maxTokens: 8192,
  temperature: 0.7
}
```

## 运行测试

```bash
# 运行 opencode.json 文件生成测试
/Users/roger/.nvm/versions/node/v22.12.0/bin/pnpm vitest run tests/e2e/opencode-file-generation.test.tsx

# 或使用快速测试脚本
./test-opencode-quick.sh
```

## 文件位置

生成的 `opencode.json` 文件位于：

- **默认路径**: `~/.config/opencode/opencode.json`
- **自定义路径**: 由 `settings.opencodeConfigDir` 指定

## 配置结构说明

### opencode.json 标准结构

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "type": "custom",
    "apiKey": "your-api-key",
    "baseUrl": "https://api.example.com",
    "model": "openai/gpt-4o",
    "maxTokens": 8192,
    "temperature": 0.7
  },
  "mcp": {
    "server-id": {
      "type": "stdio",
      "command": "node",
      "args": ["server.js"],
      "enabled": true
    }
  },
  "plugin": []
}
```

### 字段说明

| 字段               | 类型   | 必需 | 说明            |
| ------------------ | ------ | ---- | --------------- |
| `$schema`          | string | ✅   | JSON Schema URL |
| `provider`         | object | ✅   | 供应商配置      |
| `provider.type`    | string | ✅   | 供应商类型      |
| `provider.apiKey`  | string | ✅   | API 密钥        |
| `provider.baseUrl` | string | ❌   | API 基础 URL    |
| `provider.model`   | string | ❌   | 默认模型        |
| `mcp`              | object | ✅   | MCP 服务器配置  |
| `plugin`           | array  | ✅   | 插件列表        |

## 测试覆盖总结

| 测试类别          | 测试用例 | 通过率   |
| ----------------- | -------- | -------- |
| Provider 配置结构 | 3        | 100%     |
| 扩展配置          | 1        | 100%     |
| MCP 配置          | 3        | 100%     |
| 完整结构          | 1        | 100%     |
| 配置验证          | 3        | 100%     |
| 配置转换          | 2        | 100%     |
| **总计**          | **13**   | **100%** |

## 验证方法

1. **运行测试**: 执行测试脚本验证配置生成逻辑
2. **检查文件**: 查看实际生成的 `~/.config/opencode/opencode.json`
3. **验证结构**: 确认 JSON 结构符合 OpenCode 规范
4. **测试切换**: 切换供应商后验证配置文件正确更新

## 相关文档

- [OpenCode 测试指南](./OPENCODE_TEST_GUIDE.md)
- [Rust 后端测试](../../src-tauri/tests/opencode_config.rs)
- [配置文件说明](../../README.md)
