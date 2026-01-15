import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { configApi } from "@/lib/api";

const DEFAULT_OPENCODE_COMMON_CONFIG_SNIPPET = "{}";

// OpenCode通用配置中禁止包含的字段（这些字段应该在每个provider中单独配置）
const OPENCODE_COMMON_CONFIG_FORBIDDEN_KEYS = ["baseURL", "apiKey"] as const;
type OpenCodeForbiddenKey =
  (typeof OPENCODE_COMMON_CONFIG_FORBIDDEN_KEYS)[number];

interface UseOpenCodeCommonConfigProps {
  providerConfigValue: string;
  onProviderConfigChange: (config: string) => void;
  initialData?: {
    settingsConfig?: Record<string, unknown>;
  };
  selectedPresetId?: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

/**
 * 管理 OpenCode 通用配置片段 (JSON 格式)
 * 写入 OpenCode provider 的 options，但会排除以下敏感字段：
 * - baseURL
 * - apiKey
 */
export function useOpenCodeCommonConfig({
  providerConfigValue,
  onProviderConfigChange,
  initialData,
  selectedPresetId,
}: UseOpenCodeCommonConfigProps) {
  const { t } = useTranslation();
  const [useCommonConfig, setUseCommonConfig] = useState(false);
  const [commonConfigSnippet, setCommonConfigSnippetState] = useState<string>(
    DEFAULT_OPENCODE_COMMON_CONFIG_SNIPPET,
  );
  const [commonConfigError, setCommonConfigError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);

  // 用于跟踪是否正在通过通用配置更新
  const isUpdatingFromCommonConfig = useRef(false);
  // 用于跟踪新建模式是否已初始化默认勾选
  const hasInitializedNewMode = useRef(false);

  // 当预设变化时，重置初始化标记，使新预设能够重新触发初始化逻辑
  useEffect(() => {
    hasInitializedNewMode.current = false;
  }, [selectedPresetId]);

  const parseSnippetOptions = useCallback(
    (
      snippetString: string,
    ): { options: Record<string, unknown>; error?: string } => {
      const trimmed = snippetString.trim();
      if (!trimmed) {
        return { options: {} };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        return {
          options: {},
          error: t("opencodeConfig.invalidJsonFormat", {
            defaultValue: "无效的 JSON 格式",
          }),
        };
      }

      if (!isPlainObject(parsed)) {
        return {
          options: {},
          error: t("opencodeConfig.invalidJsonFormat", {
            defaultValue: "无效的 JSON 格式",
          }),
        };
      }

      const keys = Object.keys(parsed);
      const forbiddenKeys = keys.filter((key) =>
        OPENCODE_COMMON_CONFIG_FORBIDDEN_KEYS.includes(
          key as OpenCodeForbiddenKey,
        ),
      );
      if (forbiddenKeys.length > 0) {
        return {
          options: {},
          error: t("opencodeConfig.commonConfigInvalidKeys", {
            keys: forbiddenKeys.join(", "),
            defaultValue: `通用配置不允许包含以下字段: ${forbiddenKeys.join(", ")}`,
          }),
        };
      }

      return { options: parsed };
    },
    [t],
  );

  const hasProviderCommonConfigSnippet = useCallback(
    (
      providerOptions: Record<string, unknown>,
      snippetOptions: Record<string, unknown>,
    ) => {
      const entries = Object.entries(snippetOptions);
      if (entries.length === 0) return false;
      return entries.every(([key, value]) => {
        const providerValue = providerOptions[key];
        return JSON.stringify(providerValue) === JSON.stringify(value);
      });
    },
    [],
  );

  const applySnippetToProvider = useCallback(
    (
      providerOptions: Record<string, unknown>,
      snippetOptions: Record<string, unknown>,
    ) => {
      const updated = { ...providerOptions };
      for (const [key, value] of Object.entries(snippetOptions)) {
        updated[key] = value;
      }
      return updated;
    },
    [],
  );

  const removeSnippetFromProvider = useCallback(
    (
      providerOptions: Record<string, unknown>,
      snippetOptions: Record<string, unknown>,
    ) => {
      const updated = { ...providerOptions };
      for (const [key, value] of Object.entries(snippetOptions)) {
        if (JSON.stringify(updated[key]) === JSON.stringify(value)) {
          delete updated[key];
        }
      }
      return updated;
    },
    [],
  );

  // 初始化：从 config.json 加载
  useEffect(() => {
    let mounted = true;

    const loadSnippet = async () => {
      try {
        const snippet = await configApi.getCommonConfigSnippet("opencode");

        if (snippet && snippet.trim()) {
          if (mounted) {
            setCommonConfigSnippetState(snippet);
          }
        }
      } catch (error) {
        console.error("加载 OpenCode 通用配置失败:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSnippet();

    return () => {
      mounted = false;
    };
  }, []);

  // 初始化时检查通用配置片段（编辑模式）
  useEffect(() => {
    if (initialData?.settingsConfig && !isLoading) {
      try {
        const providerConfig = initialData.settingsConfig;
        if (!isPlainObject(providerConfig)) return;

        const options = isPlainObject(providerConfig.options)
          ? providerConfig.options
          : {};
        const parsed = parseSnippetOptions(commonConfigSnippet);
        if (parsed.error) return;

        const hasCommon = hasProviderCommonConfigSnippet(
          options,
          parsed.options,
        );
        setUseCommonConfig(hasCommon);
      } catch {
        // ignore parse error
      }
    }
  }, [
    commonConfigSnippet,
    hasProviderCommonConfigSnippet,
    initialData,
    isLoading,
    parseSnippetOptions,
  ]);

  // 新建模式：如果通用配置片段存在且有效，默认启用
  useEffect(() => {
    if (!initialData && !isLoading && !hasInitializedNewMode.current) {
      hasInitializedNewMode.current = true;

      const parsed = parseSnippetOptions(commonConfigSnippet);
      if (parsed.error) return;
      const hasContent = Object.keys(parsed.options).length > 0;
      if (!hasContent) return;

      setUseCommonConfig(true);

      try {
        const providerConfig = JSON.parse(providerConfigValue);
        const currentOptions = isPlainObject(providerConfig.options)
          ? providerConfig.options
          : {};
        const merged = applySnippetToProvider(currentOptions, parsed.options);
        const updated = { ...providerConfig, options: merged };

        isUpdatingFromCommonConfig.current = true;
        onProviderConfigChange(JSON.stringify(updated, null, 2));
        setTimeout(() => {
          isUpdatingFromCommonConfig.current = false;
        }, 0);
      } catch {
        // ignore
      }
    }
  }, [
    initialData,
    isLoading,
    commonConfigSnippet,
    providerConfigValue,
    applySnippetToProvider,
    onProviderConfigChange,
    parseSnippetOptions,
  ]);

  // 处理通用配置开关
  const handleCommonConfigToggle = useCallback(
    (checked: boolean) => {
      const parsed = parseSnippetOptions(commonConfigSnippet);
      if (parsed.error) {
        setCommonConfigError(parsed.error);
        setUseCommonConfig(false);
        return;
      }
      if (Object.keys(parsed.options).length === 0) {
        setCommonConfigError(
          t("opencodeConfig.noCommonConfigToApply", {
            defaultValue: "没有可应用的通用配置",
          }),
        );
        setUseCommonConfig(false);
        return;
      }

      try {
        const providerConfig = JSON.parse(providerConfigValue);
        const currentOptions = isPlainObject(providerConfig.options)
          ? providerConfig.options
          : {};

        const updatedOptions = checked
          ? applySnippetToProvider(currentOptions, parsed.options)
          : removeSnippetFromProvider(currentOptions, parsed.options);

        const updated = { ...providerConfig, options: updatedOptions };

        setCommonConfigError("");
        setUseCommonConfig(checked);

        isUpdatingFromCommonConfig.current = true;
        onProviderConfigChange(JSON.stringify(updated, null, 2));
        setTimeout(() => {
          isUpdatingFromCommonConfig.current = false;
        }, 0);
      } catch (error) {
        setCommonConfigError(
          t("opencodeConfig.failedToUpdateConfig", {
            defaultValue: "更新配置失败",
          }),
        );
      }
    },
    [
      applySnippetToProvider,
      commonConfigSnippet,
      onProviderConfigChange,
      parseSnippetOptions,
      providerConfigValue,
      removeSnippetFromProvider,
      t,
    ],
  );

  // 处理通用配置片段变化
  const handleCommonConfigSnippetChange = useCallback(
    (value: string) => {
      const previousSnippet = commonConfigSnippet;
      setCommonConfigSnippetState(value);

      if (!value.trim()) {
        setCommonConfigError("");
        configApi.setCommonConfigSnippet("opencode", "").catch((error) => {
          console.error("保存 OpenCode 通用配置失败:", error);
          setCommonConfigError(
            t("opencodeConfig.saveFailed", {
              error: String(error),
              defaultValue: "保存失败",
            }),
          );
        });

        if (useCommonConfig) {
          const parsed = parseSnippetOptions(previousSnippet);
          if (!parsed.error && Object.keys(parsed.options).length > 0) {
            try {
              const providerConfig = JSON.parse(providerConfigValue);
              const currentOptions = isPlainObject(providerConfig.options)
                ? providerConfig.options
                : {};
              const updatedOptions = removeSnippetFromProvider(
                currentOptions,
                parsed.options,
              );
              const updated = { ...providerConfig, options: updatedOptions };
              onProviderConfigChange(JSON.stringify(updated, null, 2));
            } catch {
              // ignore
            }
          }
          setUseCommonConfig(false);
        }
        return;
      }

      const parsed = parseSnippetOptions(value);
      if (parsed.error) {
        setCommonConfigError(parsed.error);
        return;
      }

      setCommonConfigError("");
      configApi.setCommonConfigSnippet("opencode", value).catch((error) => {
        console.error("保存 OpenCode 通用配置失败:", error);
        setCommonConfigError(
          t("opencodeConfig.saveFailed", {
            error: String(error),
            defaultValue: "保存失败",
          }),
        );
      });

      // 若当前启用通用配置，需要替换为最新片段
      if (useCommonConfig) {
        const prevParsed = parseSnippetOptions(previousSnippet);
        const prevOptions = prevParsed.error ? {} : prevParsed.options;
        const nextOptions = parsed.options;

        try {
          const providerConfig = JSON.parse(providerConfigValue);
          const currentOptions = isPlainObject(providerConfig.options)
            ? providerConfig.options
            : {};

          const withoutOld =
            Object.keys(prevOptions).length > 0
              ? removeSnippetFromProvider(currentOptions, prevOptions)
              : currentOptions;
          const withNew =
            Object.keys(nextOptions).length > 0
              ? applySnippetToProvider(withoutOld, nextOptions)
              : withoutOld;

          const updated = { ...providerConfig, options: withNew };

          isUpdatingFromCommonConfig.current = true;
          onProviderConfigChange(JSON.stringify(updated, null, 2));
          setTimeout(() => {
            isUpdatingFromCommonConfig.current = false;
          }, 0);
        } catch {
          // ignore
        }
      }
    },
    [
      applySnippetToProvider,
      commonConfigSnippet,
      onProviderConfigChange,
      parseSnippetOptions,
      providerConfigValue,
      removeSnippetFromProvider,
      t,
      useCommonConfig,
    ],
  );

  // 当 provider config 变化时检查是否包含通用配置
  useEffect(() => {
    if (isUpdatingFromCommonConfig.current || isLoading) {
      return;
    }

    try {
      const parsed = parseSnippetOptions(commonConfigSnippet);
      if (parsed.error) return;

      const providerConfig = JSON.parse(providerConfigValue);
      if (!isPlainObject(providerConfig)) return;

      const options = isPlainObject(providerConfig.options)
        ? providerConfig.options
        : {};
      setUseCommonConfig(
        hasProviderCommonConfigSnippet(options, parsed.options),
      );
    } catch {
      // ignore
    }
  }, [
    providerConfigValue,
    commonConfigSnippet,
    hasProviderCommonConfigSnippet,
    isLoading,
    parseSnippetOptions,
  ]);

  // 从编辑器当前内容提取通用配置片段
  const handleExtract = useCallback(async () => {
    setIsExtracting(true);
    setCommonConfigError("");

    try {
      const extracted = await configApi.extractCommonConfigSnippet("opencode", {
        settingsConfig: providerConfigValue,
      });

      if (!extracted || extracted === "{}") {
        setCommonConfigError(
          t("opencodeConfig.extractNoCommonConfig", {
            defaultValue: "没有可提取的通用配置",
          }),
        );
        return;
      }

      const parsed = parseSnippetOptions(extracted);
      if (parsed.error) {
        setCommonConfigError(
          t("opencodeConfig.extractedConfigInvalid", {
            defaultValue: "提取的配置无效",
          }),
        );
        return;
      }

      setCommonConfigSnippetState(extracted);
      await configApi.setCommonConfigSnippet("opencode", extracted);
    } catch (error) {
      console.error("提取 OpenCode 通用配置失败:", error);
      setCommonConfigError(
        t("opencodeConfig.extractFailed", {
          error: String(error),
          defaultValue: "提取失败",
        }),
      );
    } finally {
      setIsExtracting(false);
    }
  }, [providerConfigValue, parseSnippetOptions, t]);

  // 清除通用配置错误
  const clearCommonConfigError = useCallback(() => {
    setCommonConfigError("");
  }, []);

  return {
    useCommonConfig,
    commonConfigSnippet,
    commonConfigError,
    isLoading,
    isExtracting,
    handleCommonConfigToggle,
    handleCommonConfigSnippetChange,
    handleExtract,
    clearCommonConfigError,
  };
}
