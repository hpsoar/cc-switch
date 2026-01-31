import { toast } from "sonner";
import type { TFunction } from "i18next";
import type { AppId } from "@/lib/api";
import type { Provider } from "@/types";
import { settingsApi } from "@/lib/api";
import { extractErrorMessage } from "@/utils/errorUtils";

export interface ProviderActionContext {
  t: TFunction;
}

export interface ProviderActionAdapter {
  onSwitch?: (
    provider: Provider,
    context: ProviderActionContext,
  ) => Promise<void>;
}

const claudeAdapter: ProviderActionAdapter = {
  onSwitch: async (provider, { t }) => {
    try {
      const settings = await settingsApi.get();
      if (!settings?.enableClaudePluginIntegration) {
        return;
      }

      const isOfficial = provider.category === "official";
      await settingsApi.applyClaudePluginConfig({ official: isOfficial });
    } catch (error) {
      const detail =
        extractErrorMessage(error) ||
        t("notifications.syncClaudePluginFailed", {
          defaultValue: "同步 Claude 插件失败",
        });
      toast.error(detail, { duration: 4200 });
    }
  },
};

export const providerActionAdapters: Record<AppId, ProviderActionAdapter> = {
  claude: claudeAdapter,
  codex: {},
  gemini: {},
  opencode: {},
};

export function getProviderActionAdapter(appId: AppId): ProviderActionAdapter {
  return providerActionAdapters[appId];
}
