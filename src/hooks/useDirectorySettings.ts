import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { homeDir, join } from "@tauri-apps/api/path";
import type { AppId } from "@/lib/api";
import {
  appConfigDirSettingKeyMap,
  appDefaultConfigDirNameMap,
  appIds,
} from "@/apps/registry";
import { settingsApi } from "@/lib/api";
import type { SettingsFormState } from "./useSettingsForm";

type DirectoryKey = "appConfig" | AppId;

export type ResolvedDirectories = Record<AppId, string> & {
  appConfig: string;
};

const sanitizeDir = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const computeDefaultAppConfigDir = async (): Promise<string | undefined> => {
  try {
    const home = await homeDir();
    return await join(home, ".cc-switch");
  } catch (error) {
    console.error(
      "[useDirectorySettings] Failed to resolve default app config dir",
      error,
    );
    return undefined;
  }
};

const computeDefaultConfigDir = async (
  app: AppId,
): Promise<string | undefined> => {
  try {
    const home = await homeDir();
    const folder = appDefaultConfigDirNameMap[app];
    return await join(home, folder);
  } catch (error) {
    console.error(
      "[useDirectorySettings] Failed to resolve default config dir",
      error,
    );
    return undefined;
  }
};

export interface UseDirectorySettingsProps {
  settings: SettingsFormState | null;
  onUpdateSettings: (updates: Partial<SettingsFormState>) => void;
}

export interface UseDirectorySettingsResult {
  appConfigDir?: string;
  resolvedDirs: ResolvedDirectories;
  directoryOverrides: Record<AppId, string | undefined>;
  isLoading: boolean;
  initialAppConfigDir?: string;
  updateDirectory: (app: AppId, value?: string) => void;
  updateAppConfigDir: (value?: string) => void;
  browseDirectory: (app: AppId) => Promise<void>;
  browseAppConfigDir: () => Promise<void>;
  resetDirectory: (app: AppId) => Promise<void>;
  resetAppConfigDir: () => Promise<void>;
  resetAllDirectories: (
    overrides?: Partial<Record<AppId, string | undefined>>,
  ) => void;
}

/**
 * useDirectorySettings - 目录管理
 * 负责：
 * - appConfigDir 状态
 * - resolvedDirs 状态
 * - 目录选择（browse）
 * - 目录重置
 * - 默认值计算
 */
export function useDirectorySettings({
  settings,
  onUpdateSettings,
}: UseDirectorySettingsProps): UseDirectorySettingsResult {
  const { t } = useTranslation();

  const [appConfigDir, setAppConfigDir] = useState<string | undefined>(
    undefined,
  );
  const [resolvedDirs, setResolvedDirs] = useState<ResolvedDirectories>({
    appConfig: "",
    claude: "",
    codex: "",
    gemini: "",
    opencode: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const defaultsRef = useRef<ResolvedDirectories>({
    appConfig: "",
    claude: "",
    codex: "",
    gemini: "",
    opencode: "",
  });
  const initialAppConfigDirRef = useRef<string | undefined>(undefined);

  // 加载目录信息
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const load = async () => {
      try {
        const [
          overrideRaw,
          defaultAppConfig,
          appConfigDirs,
          defaultConfigDirs,
        ] = await Promise.all([
          settingsApi.getAppConfigDirOverride(),
          computeDefaultAppConfigDir(),
          Promise.all(appIds.map((appId) => settingsApi.getConfigDir(appId))),
          Promise.all(appIds.map((appId) => computeDefaultConfigDir(appId))),
        ]);

        if (!active) return;

        const normalizedOverride = sanitizeDir(overrideRaw ?? undefined);

        const defaults = appIds.reduce<Record<AppId, string>>(
          (acc, appId, index) => {
            acc[appId] = defaultConfigDirs[index] ?? "";
            return acc;
          },
          {} as Record<AppId, string>,
        );

        defaultsRef.current = {
          appConfig: defaultAppConfig ?? "",
          ...defaults,
        };

        setAppConfigDir(normalizedOverride);
        initialAppConfigDirRef.current = normalizedOverride;

        const resolved = appIds.reduce<Record<AppId, string>>(
          (acc, appId, index) => {
            acc[appId] = appConfigDirs[index] || defaultsRef.current[appId];
            return acc;
          },
          {} as Record<AppId, string>,
        );

        setResolvedDirs({
          appConfig: normalizedOverride ?? defaultsRef.current.appConfig,
          ...resolved,
        });
      } catch (error) {
        console.error(
          "[useDirectorySettings] Failed to load directory info",
          error,
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const updateDirectoryState = useCallback(
    (key: DirectoryKey, value?: string) => {
      const sanitized = sanitizeDir(value);
      if (key === "appConfig") {
        setAppConfigDir(sanitized);
      } else {
        const settingsKey = appConfigDirSettingKeyMap[key];
        onUpdateSettings(
          ({
            [settingsKey]: sanitized,
          } as Partial<SettingsFormState>),
        );
      }

      setResolvedDirs((prev) => ({
        ...prev,
        [key]: sanitized ?? defaultsRef.current[key],
      }));
    },
    [onUpdateSettings],
  );

  const updateAppConfigDir = useCallback(
    (value?: string) => {
      updateDirectoryState("appConfig", value);
    },
    [updateDirectoryState],
  );

  const updateDirectory = useCallback(
    (app: AppId, value?: string) => {
      updateDirectoryState(app, value);
    },
    [updateDirectoryState],
  );

  const browseDirectory = useCallback(
    async (app: AppId) => {
      const key: DirectoryKey = app;
      const settingsKey = appConfigDirSettingKeyMap[app];
      const currentValue =
        (settings?.[settingsKey as keyof SettingsFormState] as string) ??
        resolvedDirs[key];

      try {
        const picked = await settingsApi.selectConfigDirectory(currentValue);
        const sanitized = sanitizeDir(picked ?? undefined);
        if (!sanitized) return;
        updateDirectoryState(key, sanitized);
      } catch (error) {
        console.error("[useDirectorySettings] Failed to pick directory", error);
        toast.error(
          t("settings.selectFileFailed", {
            defaultValue: "选择目录失败",
          }),
        );
      }
    },
    [settings, resolvedDirs, t, updateDirectoryState],
  );

  const browseAppConfigDir = useCallback(async () => {
    const currentValue = appConfigDir ?? resolvedDirs.appConfig;
    try {
      const picked = await settingsApi.selectConfigDirectory(currentValue);
      const sanitized = sanitizeDir(picked ?? undefined);
      if (!sanitized) return;
      updateDirectoryState("appConfig", sanitized);
    } catch (error) {
      console.error(
        "[useDirectorySettings] Failed to pick app config directory",
        error,
      );
      toast.error(
        t("settings.selectFileFailed", {
          defaultValue: "选择目录失败",
        }),
      );
    }
  }, [appConfigDir, resolvedDirs.appConfig, t, updateDirectoryState]);

  const resetDirectory = useCallback(
    async (app: AppId) => {
      const key: DirectoryKey = app;
      if (!defaultsRef.current[key]) {
        const fallback = await computeDefaultConfigDir(app);
        if (fallback) {
          defaultsRef.current = {
            ...defaultsRef.current,
            [key]: fallback,
          };
        }
      }
      updateDirectoryState(key, undefined);
    },
    [updateDirectoryState],
  );

  const resetAppConfigDir = useCallback(async () => {
    if (!defaultsRef.current.appConfig) {
      const fallback = await computeDefaultAppConfigDir();
      if (fallback) {
        defaultsRef.current = {
          ...defaultsRef.current,
          appConfig: fallback,
        };
      }
    }
    updateDirectoryState("appConfig", undefined);
  }, [updateDirectoryState]);

  const resetAllDirectories = useCallback(
    (overrides?: Partial<Record<AppId, string | undefined>>) => {
      setAppConfigDir(initialAppConfigDirRef.current);
      const resolved = appIds.reduce<Record<AppId, string>>((acc, appId) => {
        acc[appId] =
          overrides?.[appId] ?? defaultsRef.current[appId] ?? "";
        return acc;
      }, {} as Record<AppId, string>);

      setResolvedDirs({
        appConfig:
          initialAppConfigDirRef.current ?? defaultsRef.current.appConfig,
        ...resolved,
      });
    },
    [],
  );

  const directoryOverrides = useMemo(() => {
    return appIds.reduce<Record<AppId, string | undefined>>((acc, appId) => {
      const settingsKey = appConfigDirSettingKeyMap[appId];
      acc[appId] = sanitizeDir(
        settings?.[settingsKey as keyof SettingsFormState] as string,
      );
      return acc;
    }, {} as Record<AppId, string | undefined>);
  }, [settings]);

  return {
    appConfigDir,
    resolvedDirs,
    directoryOverrides,
    isLoading,
    initialAppConfigDir: initialAppConfigDirRef.current,
    updateDirectory,
    updateAppConfigDir,
    browseDirectory,
    browseAppConfigDir,
    resetDirectory,
    resetAppConfigDir,
    resetAllDirectories,
  };
}
