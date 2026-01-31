import type { AppId } from "@/lib/api/types";
import type { McpStatus } from "@/types";
import { mcpApi } from "@/lib/api/mcp";

interface McpStatusAdapter {
  appId: AppId;
  getStatus: () => Promise<McpStatus>;
}

const mcpStatusAdapters: Partial<Record<AppId, McpStatusAdapter>> = {
  claude: { appId: "claude", getStatus: () => mcpApi.getStatus() },
  opencode: { appId: "opencode", getStatus: () => mcpApi.getOpenCodeStatus() },
};

export const mcpStatusAppIds = Object.keys(mcpStatusAdapters) as AppId[];

export const getMcpStatusAdapter = (
  appId: AppId,
): McpStatusAdapter | null => {
  return mcpStatusAdapters[appId] ?? null;
};
