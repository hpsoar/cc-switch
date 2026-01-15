import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mcpApi } from "@/lib/api/mcp";
import type { McpServer } from "@/types";
import type { AppId } from "@/lib/api/types";

/**
 * 查询所有 MCP 服务器（统一管理）
 */
export function useAllMcpServers() {
  return useQuery({
    queryKey: ["mcp", "all"],
    queryFn: () => mcpApi.getAllServers(),
  });
}

/**
 * 查询 Claude MCP 状态（从配置文件读取）
 */
export function useClaudeMcpStatus() {
  return useQuery({
    queryKey: ["mcp", "status", "claude"],
    queryFn: () => mcpApi.getStatus(),
  });
}

/**
 * 查询 OpenCode MCP 状态（从配置文件读取）
 */
export function useOpenCodeMcpStatus() {
  return useQuery({
    queryKey: ["mcp", "status", "opencode"],
    queryFn: () => mcpApi.getOpenCodeStatus(),
  });
}

/**
 * 添加或更新 MCP 服务器
 */
export function useUpsertMcpServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (server: McpServer) => mcpApi.upsertUnifiedServer(server),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp", "all"] });
      queryClient.invalidateQueries({
        queryKey: ["mcp", "status", "opencode"],
      });
    },
  });
}

/**
 * 切换 MCP 服务器在特定应用的启用状态
 */
export function useToggleMcpApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      serverId,
      app,
      enabled,
    }: {
      serverId: string;
      app: AppId;
      enabled: boolean;
    }) => mcpApi.toggleApp(serverId, app, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp", "all"] });
      // 同时失效 OpenCode 状态查询，因为分类数量依赖它
      queryClient.invalidateQueries({
        queryKey: ["mcp", "status", "opencode"],
      });
    },
  });
}

/**
 * 删除 MCP 服务器
 */
export function useDeleteMcpServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mcpApi.deleteUnifiedServer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp", "all"] });
      queryClient.invalidateQueries({
        queryKey: ["mcp", "status", "opencode"],
      });
    },
  });
}

/**
 * 从所有应用导入 MCP 服务器
 */
export function useImportMcpFromApps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mcpApi.importFromApps(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp", "all"] });
      queryClient.invalidateQueries({
        queryKey: ["mcp", "status", "opencode"],
      });
    },
  });
}
