import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AppId } from "@/lib/api/types";
import type { McpServer } from "@/types";

import { getMcpStatusAdapter, mcpStatusAppIds } from "@/apps/mcpAdapters";
import { mcpApi } from "@/lib/api/mcp";

const invalidateMcpStatusQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  mcpStatusAppIds.forEach((appId) => {
    queryClient.invalidateQueries({ queryKey: ["mcp", "status", appId] });
  });
};

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
export function useMcpStatus(appId: AppId) {
  const adapter = getMcpStatusAdapter(appId);
  return useQuery({
    queryKey: ["mcp", "status", appId],
    queryFn: () => adapter?.getStatus() ?? Promise.resolve({ enabled: false }),
  });
}

/**
 * 查询 Claude MCP 状态（从配置文件读取）
 */
export function useClaudeMcpStatus() {
  return useMcpStatus("claude");
}

/**
 * 查询 OpenCode MCP 状态（从配置文件读取）
 */
export function useOpenCodeMcpStatus() {
  return useMcpStatus("opencode");
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
      invalidateMcpStatusQueries(queryClient);
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
      // 同时失效所有状态查询，因为分类数量依赖它
      invalidateMcpStatusQueries(queryClient);
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
      invalidateMcpStatusQueries(queryClient);
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
      invalidateMcpStatusQueries(queryClient);
    },
  });
}
