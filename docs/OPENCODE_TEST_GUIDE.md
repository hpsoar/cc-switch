# OpenCode 自动化测试指南

## 概述

本项目已为 OpenCode 功能创建了完整的自动化测试套件，覆盖所有核心功能。

## 测试文件结构

```
tests/
├── e2e/
│   └── opencode.test.tsx          # OpenCode E2E 测试套件
├── hooks/
│   └── useProviderActions.test.tsx # Provider Actions 测试
└── msw/
    ├── handlers.ts                # MSW API 模拟
    └── state.ts                   # 测试状态管理

src-tauri/
└── tests/
    └── opencode_config.rs         # Rust 后端测试
```

## 测试覆盖范围

### 1. 供应商管理

- ✅ 添加 OpenCode 供应商
- ✅ 更新 OpenCode 供应商配置
- ✅ 切换到 OpenCode 供应商
- ✅ 删除 OpenCode 供应商
- ✅ 多供应商管理
- ✅ 错误处理

### 2. MCP 服务器管理

- ✅ 添加 MCP 服务器（启用 OpenCode）
- ✅ 启用/禁用 MCP 服务器
- ✅ 删除 MCP 服务器
- ✅ MCP 配置同步

### 3. Prompt 管理

- ✅ 添加 OpenCode Prompt
- ✅ 启用/禁用 Prompt
- ✅ 删除 Prompt
- ✅ Prompt 文件写入验证

### 4. 目录设置

- ✅ 设置自定义 OpenCode 配置目录
- ✅ 重置为默认目录

### 5. 集成测试

- ✅ 完整工作流测试（添加→更新→切换→删除）
- ✅ 多供应商切换测试
- ✅ 端到端功能验证

### 6. Rust 后端测试

- ✅ 配置文件路径获取
- ✅ 配置文件读写
- ✅ 默认配置生成
- ✅ 目录自动创建
- ✅ 配置合并和覆盖

## 运行测试

### 方式 1：完整测试套件（推荐）

运行所有 OpenCode 相关测试（Rust + 前端 + 类型检查）：

```bash
./test-opencode.sh
```

**输出示例：**

```
=========================================
OpenCode 自动化测试套件
=========================================

[1/3] 运行 Rust 后端测试...
✓ Rust 后端测试通过

[2/3] 运行前端 E2E 测试...
✓ 前端 E2E 测试通过

[3/3] 运行类型检查...
✓ 类型检查通过

=========================================
所有测试通过！✓
=========================================

测试覆盖：
  ✓ OpenCode 配置文件读写
  ✓ OpenCode 供应商管理（添加/更新/删除/切换）
  ✓ OpenCode MCP 服务器管理
  ✓ OpenCode Prompt 管理
  ✓ OpenCode 目录设置
  ✓ 集成测试（完整工作流）
  ✓ 错误处理
```

### 方式 2：快速测试（仅前端）

只运行前端 E2E 测试，适合开发时快速验证：

```bash
./test-opencode-quick.sh
```

**输出示例：**

```
=========================================
OpenCode 前端快速测试
=========================================

运行前端 E2E 测试...

✓ 前端测试通过！

=========================================

测试覆盖：
  ✓ OpenCode 供应商管理
  ✓ OpenCode MCP 服务器管理
  ✓ OpenCode Prompt 管理
  ✓ OpenCode 目录设置
  ✓ 集成测试
  ✓ 错误处理
```

### 方式 3：单独运行测试

#### 运行 Rust 后端测试

```bash
cd src-tauri
cargo test opencode -- --nocapture
```

#### 运行前端 E2E 测试

```bash
pnpm vitest run tests/e2e/opencode.test.tsx
```

#### 运行特定测试用例

```bash
# 测试供应商添加
pnpm vitest run tests/e2e/opencode.test.tsx -t "should add OpenCode provider"

# 测试 MCP 管理
pnpm vitest run tests/e2e/opencode.test.tsx -t "MCP Server Management"

# 测试集成测试
pnpm vitest run tests/e2e/opencode.test.tsx -t "Integration Tests"
```

#### 监听模式（开发时使用）

```bash
pnpm vitest watch tests/e2e/opencode.test.tsx
```

#### 生成覆盖率报告

```bash
pnpm vitest run tests/e2e/opencode.test.tsx --coverage
```

### 方式 4：运行所有单元测试

```bash
pnpm test:unit
```

## 测试架构

### MSW (Mock Service Worker)

使用 MSW 模拟 Tauri API 调用，避免依赖真实的 Tauri 环境。

**配置文件：**

- `tests/msw/handlers.ts` - API 处理器
- `tests/msw/state.ts` - 测试状态管理
- `tests/msw/server.ts` - MSW 服务器配置

### 测试状态管理

测试使用内存状态，每次测试后自动重置：

```typescript
// tests/msw/state.ts
export const resetProviderState = () => {
  providers = createDefaultProviders();
  current = createDefaultCurrent();
  // ...
};
```

### Mock 配置

测试使用 Vitest mock 功能模拟外部依赖：

```typescript
// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock app state
vi.mock("@/lib/state", () => ({
  useAppStore: vi.fn(() => ({
    app: "opencode",
    setApp: vi.fn(),
  })),
}));
```

## 测试用例示例

### 供应商管理测试

```typescript
it("should add OpenCode provider with custom config", async () => {
  const { result } = renderHook(() => useProviderActions("opencode"));

  const mockProvider: Provider = {
    id: "test-opencode-1",
    name: "Test OpenCode Provider",
    app: "opencode",
    settings_config: {
      provider: {
        type: "custom",
        apiKey: "sk-test-api-key",
        baseUrl: "https://api.example.com/v1",
        model: "openai/gpt-4o",
      },
    },
  };

  const result = await result.current.addProvider(mockProvider);
  expect(result.success).toBe(true);
  expect(toast.success).toHaveBeenCalled();
});
```

### MCP 管理测试

```typescript
it("should add MCP server with OpenCode enabled", async () => {
  const { result } = renderHook(() => useMcpActions("opencode"));

  const mockMcpServer: McpServer = {
    id: "mcp-opencode-1",
    name: "Test OpenCode MCP",
    enabled: true,
    apps: {
      claude: false,
      codex: false,
      gemini: false,
      opencode: true,
    },
    server: {
      type: "stdio",
      command: "node",
      args: ["server.js"],
    },
  };

  const result = await result.current.addServer(mockMcpServer);
  expect(result.success).toBe(true);
});
```

### 集成测试

```typescript
it("should complete full OpenCode provider workflow", async () => {
  const { result } = renderHook(() => useProviderActions("opencode"));

  // Step 1: Add provider
  await act(async () => {
    const result = await result.current.addProvider(mockProvider);
    expect(result.success).toBe(true);
  });

  // Step 2: Update provider
  await act(async () => {
    const result = await result.current.updateProvider(updatedProvider);
    expect(result.success).toBe(true);
  });

  // Step 3: Switch to provider
  await act(async () => {
    const result = await result.current.switchProvider("test-opencode-1");
    expect(result.success).toBe(true);
  });

  // Step 4: Cleanup
  await act(async () => {
    const result = await result.current.deleteProvider("test-opencode-1");
    expect(result.success).toBe(true);
  });
});
```

## 调试测试

### 查看详细输出

```bash
# 显示所有测试输出
pnpm vitest run tests/e2e/opencode.test.tsx --reporter=verbose

# 显示 Rust 测试详细输出
cargo test opencode -- --nocapture
```

### 调试单个测试

```bash
# 只运行失败的测试
pnpm vitest run tests/e2e/opencode.test.tsx --bail

# 运行特定测试并显示输出
pnpm vitest run tests/e2e/opencode.test.tsx -t "should add OpenCode provider" --reporter=verbose
```

### 使用 VS Code 调试

1. 安装 Vitest 扩展
2. 在测试文件左侧点击 "Run Test" 或 "Debug Test"
3. 设置断点进行调试

## 持续集成

测试脚本已在项目中配置，可以在 CI/CD 中使用：

```yaml
# .github/workflows/test.yml 示例
- name: Run OpenCode tests
  run: ./test-opencode.sh

- name: Upload coverage
  run: pnpm vitest run --coverage
```

## 最佳实践

### 1. 测试隔离

每个测试用例应该独立运行，不依赖其他测试的状态。

### 2. 使用 act() 包装异步操作

```typescript
await act(async () => {
  await result.current.addProvider(mockProvider);
});
```

### 3. 清理状态

使用 `beforeEach` 和 `afterEach` 确保测试状态干净。

### 4. Mock 外部依赖

使用 MSW 和 Vitest mock 避免依赖真实环境。

### 5. 清晰的断言

使用 `expect()` 进行明确的断言，提供清晰的错误信息。

## 故障排除

### 问题：测试超时

**解决方案：** 增加超时时间

```bash
pnpm vitest run tests/e2e/opencode.test.tsx --timeout=10000
```

### 问题：Mock 未生效

**解决方案：** 确保 mock 在测试前设置

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 问题：状态未重置

**解决方案：** 检查 `resetProviderState()` 是否被调用

```typescript
afterEach(() => {
  resetProviderState();
});
```

### 问题：MSW 处理器未匹配

**解决方案：** 检查请求路径和方法是否正确

```typescript
http.post(`${TAURI_ENDPOINT}/add_provider`, ...)
```

## 扩展测试

### 添加新的测试用例

1. 在 `tests/e2e/opencode.test.tsx` 中添加新的 `describe` 或 `it`
2. 使用现有的 mock 和工具函数
3. 确保测试独立且可重复

### 添加新的 Mock 处理器

在 `tests/msw/handlers.ts` 中添加新的处理器：

```typescript
http.post(`${TAURI_ENDPOINT}/new_endpoint`, async ({ request }) => {
  const data = await withJson(request);
  return success({ success: true });
}),
```

## 贡献指南

提交代码前，请确保：

1. ✅ 所有测试通过：`./test-opencode.sh`
2. ✅ 类型检查通过：`pnpm typecheck`
3. ✅ 代码格式化：`pnpm format`
4. ✅ 新功能有对应的测试覆盖

## 相关文档

- [Vitest 文档](https://vitest.dev/)
- [Testing Library 文档](https://testing-library.com/)
- [MSW 文档](https://mswjs.io/)
- [React Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
