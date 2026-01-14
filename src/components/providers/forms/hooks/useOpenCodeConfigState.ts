import { useState, useCallback, useEffect } from "react";

interface UseOpenCodeConfigStateProps {
  initialData?: {
    settingsConfig?: Record<string, unknown>;
  };
}

/**
 * 管理 OpenCode 配置状态
 * OpenCode 配置包含两部分：env (环境变量) 和 config (扩展配置 JSON)
 */
export function useOpenCodeConfigState({
  initialData,
}: UseOpenCodeConfigStateProps) {
  const [opencodeEnv, setOpenCodeEnvState] = useState("");
  const [opencodeConfig, setOpenCodeConfigState] = useState("");
  const [opencodeApiKey, setOpenCodeApiKey] = useState("");
  const [opencodeBaseUrl, setOpenCodeBaseUrl] = useState("");
  const [opencodeModel, setOpenCodeModel] = useState("");
  const [envError, setEnvError] = useState("");
  const [configError, setConfigError] = useState("");

  // 将 JSON env 对象转换为 .env 格式字符串
  const envObjToString = useCallback(
    (envObj: Record<string, unknown>): string => {
      const priorityKeys = ["OPENCODE_BASE_URL", "OPENCODE_API_KEY", "MODEL"];
      const lines: string[] = [];
      const addedKeys = new Set<string>();

      for (const key of priorityKeys) {
        if (typeof envObj[key] === "string" && envObj[key]) {
          lines.push(`${key}=${envObj[key]}`);
          addedKeys.add(key);
        }
      }

      for (const [key, value] of Object.entries(envObj)) {
        if (!addedKeys.has(key) && typeof value === "string") {
          lines.push(`${key}=${value}`);
        }
      }

      return lines.join("\n");
    },
    [],
  );

  // 将 .env 格式字符串转换为 JSON env 对象
  const envStringToObj = useCallback(
    (envString: string): Record<string, string> => {
      const env: Record<string, string> = {};
      const lines = envString.split("\n");
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const equalIndex = trimmed.indexOf("=");
        if (equalIndex > 0) {
          const key = trimmed.substring(0, equalIndex).trim();
          const value = trimmed.substring(equalIndex + 1).trim();
          env[key] = value;
        }
      });
      return env;
    },
    [],
  );

  // 初始化 OpenCode 配置（编辑模式）
  useEffect(() => {
    if (!initialData) return;

    const config = initialData.settingsConfig;
    if (typeof config === "object" && config !== null) {
      const env = (config as any).env || {};
      setOpenCodeEnvState(envObjToString(env));

      const configObj = (config as any).config || {};
      setOpenCodeConfigState(JSON.stringify(configObj, null, 2));

      if (typeof env.OPENCODE_API_KEY === "string") {
        setOpenCodeApiKey(env.OPENCODE_API_KEY);
      }
      if (typeof env.OPENCODE_BASE_URL === "string") {
        setOpenCodeBaseUrl(env.OPENCODE_BASE_URL);
      }
      if (typeof env.MODEL === "string") {
        setOpenCodeModel(env.MODEL);
      }
    }
  }, [initialData, envObjToString]);

  // 从 opencodeEnv 中提取并同步 API Key、Base URL 和 Model
  useEffect(() => {
    const envObj = envStringToObj(opencodeEnv);
    const extractedKey = envObj.OPENCODE_API_KEY || "";
    const extractedBaseUrl = envObj.OPENCODE_BASE_URL || "";
    const extractedModel = envObj.MODEL || "";

    if (extractedKey !== opencodeApiKey) {
      setOpenCodeApiKey(extractedKey);
    }
    if (extractedBaseUrl !== opencodeBaseUrl) {
      setOpenCodeBaseUrl(extractedBaseUrl);
    }
    if (extractedModel !== opencodeModel) {
      setOpenCodeModel(extractedModel);
    }
  }, [
    opencodeEnv,
    envStringToObj,
    opencodeApiKey,
    opencodeBaseUrl,
    opencodeModel,
  ]);

  const validateOpenCodeConfig = useCallback((value: string): string => {
    if (!value.trim()) return "";
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return "";
      }
      return "Config must be a JSON object";
    } catch {
      return "Invalid JSON format";
    }
  }, []);

  const setOpenCodeEnv = useCallback((value: string) => {
    setOpenCodeEnvState(value);
    setEnvError("");
  }, []);

  const setOpenCodeConfig = useCallback(
    (value: string | ((prev: string) => string)) => {
      const newValue =
        typeof value === "function" ? value(opencodeConfig) : value;
      setOpenCodeConfigState(newValue);
      setConfigError(validateOpenCodeConfig(newValue));
    },
    [opencodeConfig, validateOpenCodeConfig],
  );

  const handleOpenCodeApiKeyChange = useCallback(
    (key: string) => {
      const trimmed = key.trim();
      setOpenCodeApiKey(trimmed);

      const envObj = envStringToObj(opencodeEnv);
      envObj.OPENCODE_API_KEY = trimmed;
      const newEnv = envObjToString(envObj);
      setOpenCodeEnv(newEnv);
    },
    [opencodeEnv, envStringToObj, envObjToString, setOpenCodeEnv],
  );

  const handleOpenCodeBaseUrlChange = useCallback(
    (url: string) => {
      const sanitized = url.trim().replace(/\/+$/, "");
      setOpenCodeBaseUrl(sanitized);

      const envObj = envStringToObj(opencodeEnv);
      envObj.OPENCODE_BASE_URL = sanitized;
      const newEnv = envObjToString(envObj);
      setOpenCodeEnv(newEnv);
    },
    [opencodeEnv, envStringToObj, envObjToString, setOpenCodeEnv],
  );

  const handleOpenCodeModelChange = useCallback(
    (model: string) => {
      const trimmed = model.trim();
      setOpenCodeModel(trimmed);

      const envObj = envStringToObj(opencodeEnv);
      envObj.MODEL = trimmed;
      const newEnv = envObjToString(envObj);
      setOpenCodeEnv(newEnv);
    },
    [opencodeEnv, envStringToObj, envObjToString, setOpenCodeEnv],
  );

  const handleOpenCodeEnvChange = useCallback(
    (value: string) => {
      setOpenCodeEnv(value);
    },
    [setOpenCodeEnv],
  );

  const handleOpenCodeConfigChange = useCallback(
    (value: string) => {
      setOpenCodeConfig(value);
    },
    [setOpenCodeConfig],
  );

  const resetOpenCodeConfig = useCallback(
    (env: Record<string, unknown>, config: Record<string, unknown>) => {
      const envString = envObjToString(env);
      const configString = JSON.stringify(config, null, 2);

      setOpenCodeEnv(envString);
      setOpenCodeConfig(configString);

      if (typeof env.OPENCODE_API_KEY === "string") {
        setOpenCodeApiKey(env.OPENCODE_API_KEY);
      } else {
        setOpenCodeApiKey("");
      }

      if (typeof env.OPENCODE_BASE_URL === "string") {
        setOpenCodeBaseUrl(env.OPENCODE_BASE_URL);
      } else {
        setOpenCodeBaseUrl("");
      }

      if (typeof env.MODEL === "string") {
        setOpenCodeModel(env.MODEL);
      } else {
        setOpenCodeModel("");
      }
    },
    [envObjToString, setOpenCodeEnv, setOpenCodeConfig],
  );

  return {
    opencodeEnv,
    opencodeConfig,
    opencodeApiKey,
    opencodeBaseUrl,
    opencodeModel,
    envError,
    configError,
    setOpenCodeEnv,
    setOpenCodeConfig,
    handleOpenCodeApiKeyChange,
    handleOpenCodeBaseUrlChange,
    handleOpenCodeModelChange,
    handleOpenCodeEnvChange,
    handleOpenCodeConfigChange,
    resetOpenCodeConfig,
    envStringToObj,
    envObjToString,
  };
}
