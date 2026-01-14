import { useState, useCallback, useEffect } from "react";

interface UseOpenCodeConfigStateProps {
  initialData?: {
    settingsConfig?: Record<string, unknown>;
  };
}

interface OpenCodeProviderConfig {
  npm: string;
  name: string;
  options: {
    baseURL?: string;
    apiKey?: string;
    headers?: Record<string, string>;
  };
  models: Record<
    string,
    {
      name: string;
      limit?: {
        context?: number;
        output?: number;
      };
    }
  >;
}

export function useOpenCodeConfigState({
  initialData,
}: UseOpenCodeConfigStateProps) {
  const [providerConfigJson, setProviderConfigJson] = useState("");
  const [opencodeApiKey, setOpenCodeApiKey] = useState("");
  const [opencodeBaseUrl, setOpenCodeBaseUrl] = useState("");
  const [configError, setConfigError] = useState("");

  const validateProviderConfig = useCallback((value: string): string => {
    if (!value.trim()) return "";

    try {
      const parsed = JSON.parse(value) as unknown;

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return "配置必须是 JSON 对象";
      }

      const config = parsed as Partial<OpenCodeProviderConfig>;

      if (!config.npm || typeof config.npm !== "string") {
        return "缺少必需字段: npm (string)";
      }

      if (!config.name || typeof config.name !== "string") {
        return "缺少必需字段: name (string)";
      }

      if (!config.options || typeof config.options !== "object") {
        return "缺少必需字段: options (object)";
      }

      if (!config.models || typeof config.models !== "object") {
        return "缺少必需字段: models (object)";
      }

      return "";
    } catch (error) {
      return `无效的 JSON 格式: ${error instanceof Error ? error.message : String(error)}`;
    }
  }, []);

  const parseProviderConfig = useCallback(
    (jsonString: string): OpenCodeProviderConfig | null => {
      try {
        const parsed = JSON.parse(jsonString);
        return parsed as OpenCodeProviderConfig;
      } catch {
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    if (!initialData) return;

    const config = initialData.settingsConfig;
    if (typeof config === "object" && config !== null) {
      const jsonString = JSON.stringify(config, null, 2);
      setProviderConfigJson(jsonString);

      const parsed = parseProviderConfig(jsonString);
      if (parsed?.options) {
        if (
          parsed.options.apiKey &&
          typeof parsed.options.apiKey === "string"
        ) {
          const apiKey = parsed.options.apiKey;
          if (!apiKey.startsWith("{env:")) {
            setOpenCodeApiKey(apiKey);
          }
        }
        if (parsed.options.baseURL) {
          setOpenCodeBaseUrl(parsed.options.baseURL);
        }
      }
    }
  }, [initialData, parseProviderConfig]);

  useEffect(() => {
    const parsed = parseProviderConfig(providerConfigJson);
    if (parsed?.options) {
      let apiKey = "";
      let baseUrl = "";

      if (parsed.options.apiKey && typeof parsed.options.apiKey === "string") {
        const key = parsed.options.apiKey;
        if (!key.startsWith("{env:")) {
          apiKey = key;
        }
      }

      if (parsed.options.baseURL) {
        baseUrl = parsed.options.baseURL;
      }

      if (apiKey !== opencodeApiKey) {
        setOpenCodeApiKey(apiKey);
      }
      if (baseUrl !== opencodeBaseUrl) {
        setOpenCodeBaseUrl(baseUrl);
      }
    }
  }, [
    providerConfigJson,
    parseProviderConfig,
    opencodeApiKey,
    opencodeBaseUrl,
  ]);

  const setProviderConfig = useCallback(
    (value: string | ((prev: string) => string)) => {
      const newValue =
        typeof value === "function" ? value(providerConfigJson) : value;
      setProviderConfigJson(newValue);
      setConfigError(validateProviderConfig(newValue));
    },
    [providerConfigJson, validateProviderConfig],
  );

  const handleOpenCodeApiKeyChange = useCallback(
    (key: string) => {
      const trimmed = key.trim();
      setOpenCodeApiKey(trimmed);

      const parsed = parseProviderConfig(providerConfigJson);

      let config: OpenCodeProviderConfig;
      if (!parsed) {
        config = {
          npm: "@ai-sdk/openai-compatible",
          name: "Custom Provider",
          options: {
            apiKey: trimmed || "{env:API_KEY}",
            baseURL: "",
          },
          models: {},
        };
      } else {
        config = {
          ...parsed,
          options: {
            ...parsed.options,
            apiKey: trimmed || "{env:API_KEY}",
          },
        };
      }

      const newJson = JSON.stringify(config, null, 2);
      setProviderConfig(newJson);
    },
    [providerConfigJson, parseProviderConfig, setProviderConfig],
  );

  const handleOpenCodeBaseUrlChange = useCallback(
    (url: string) => {
      const trimmed = url.trim();
      setOpenCodeBaseUrl(trimmed);

      const parsed = parseProviderConfig(providerConfigJson);

      let config: OpenCodeProviderConfig;
      if (!parsed) {
        config = {
          npm: "@ai-sdk/openai-compatible",
          name: "Custom Provider",
          options: {
            apiKey: "{env:API_KEY}",
            baseURL: trimmed,
          },
          models: {},
        };
      } else {
        config = {
          ...parsed,
          options: {
            ...parsed.options,
            baseURL: trimmed,
          },
        };
      }

      const newJson = JSON.stringify(config, null, 2);
      setProviderConfig(newJson);
    },
    [providerConfigJson, parseProviderConfig, setProviderConfig],
  );

  const handleOpenCodeHeadersChange = useCallback(
    (headers: Record<string, string>) => {
      const parsed = parseProviderConfig(providerConfigJson);
      if (!parsed) return;

      const updated = {
        ...parsed,
        options: {
          ...parsed.options,
          headers,
        },
      };

      const newJson = JSON.stringify(updated, null, 2);
      setProviderConfig(newJson);
    },
    [providerConfigJson, parseProviderConfig, setProviderConfig],
  );

  const handleOpenCodeConfigChange = useCallback(
    (value: string) => {
      setProviderConfig(value);
    },
    [setProviderConfig],
  );

  const addModel = useCallback(
    (modelId: string, modelConfig: any) => {
      const parsed = parseProviderConfig(providerConfigJson);
      if (!parsed) return;

      const updated = {
        ...parsed,
        models: {
          ...parsed.models,
          [modelId]: modelConfig,
        },
      };

      const newJson = JSON.stringify(updated, null, 2);
      setProviderConfig(newJson);
    },
    [providerConfigJson, parseProviderConfig, setProviderConfig],
  );

  const removeModel = useCallback(
    (modelId: string) => {
      const parsed = parseProviderConfig(providerConfigJson);
      if (!parsed) return;

      const newModels = { ...parsed.models };
      delete newModels[modelId];

      const updated = {
        ...parsed,
        models: newModels,
      };

      const newJson = JSON.stringify(updated, null, 2);
      setProviderConfig(newJson);
    },
    [providerConfigJson, parseProviderConfig, setProviderConfig],
  );

  const updateModel = useCallback(
    (modelId: string, modelConfig: any) => {
      const parsed = parseProviderConfig(providerConfigJson);
      if (!parsed) return;

      const updated = {
        ...parsed,
        models: {
          ...parsed.models,
          [modelId]: modelConfig,
        },
      };

      const newJson = JSON.stringify(updated, null, 2);
      setProviderConfig(newJson);
    },
    [providerConfigJson, parseProviderConfig, setProviderConfig],
  );

  const getOpenCodeSettingsConfig = useCallback((): Record<string, unknown> => {
    if (!providerConfigJson.trim()) {
      return {};
    }

    try {
      return JSON.parse(providerConfigJson);
    } catch {
      return {};
    }
  }, [providerConfigJson]);

  const resetOpenCodeConfig = useCallback(
    (arg1: Record<string, unknown>, arg2?: Record<string, unknown>) => {
      let config: Record<string, unknown>;

      if (arg2 !== undefined) {
        config = { env: arg1, config: arg2 };
      } else {
        config = arg1;
      }

      const jsonString = JSON.stringify(config, null, 2);
      setProviderConfigJson(jsonString);
      setConfigError("");

      const parsed = parseProviderConfig(jsonString);
      if (parsed?.options) {
        if (
          parsed.options.apiKey &&
          typeof parsed.options.apiKey === "string"
        ) {
          const key = parsed.options.apiKey;
          if (!key.startsWith("{env:")) {
            setOpenCodeApiKey(key);
          } else {
            setOpenCodeApiKey("");
          }
        }
        if (parsed.options.baseURL) {
          setOpenCodeBaseUrl(parsed.options.baseURL);
        }
      }
    },
    [parseProviderConfig],
  );

  return {
    providerConfigJson,
    opencodeApiKey,
    opencodeBaseUrl,
    configError,
    setProviderConfig,
    handleOpenCodeApiKeyChange,
    handleOpenCodeBaseUrlChange,
    handleOpenCodeHeadersChange,
    handleOpenCodeConfigChange,
    resetOpenCodeConfig,
    getOpenCodeSettingsConfig,
    validateProviderConfig,
    addModel,
    removeModel,
    updateModel,
    parseProviderConfig,
    opencodeEnv: providerConfigJson,
    opencodeConfig: providerConfigJson,
    opencodeModel: "",
    opencodeName: "",
    envError: "",
    handleOpenCodeModelChange: () => {},
    handleOpenCodeEnvChange: handleOpenCodeConfigChange,
    handleOpenCodeNameChange: () => {},
    envStringToObj: () => ({}),
  };
}
