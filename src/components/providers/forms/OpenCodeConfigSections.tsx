import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import JsonEditor from "@/components/JsonEditor";

interface OpenCodeEnvSectionProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  useCommonConfig: boolean;
  onCommonConfigToggle: (checked: boolean) => void;
  onEditCommonConfig: () => void;
  commonConfigError?: string;
}

/**
 * OpenCodeEnvSection - .env editor section for OpenCode environment variables
 */
export const OpenCodeEnvSection: React.FC<OpenCodeEnvSectionProps> = ({
  value,
  onChange,
  onBlur,
  error,
  useCommonConfig,
  onCommonConfigToggle,
  onEditCommonConfig,
  commonConfigError,
}) => {
  const { t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="opencodeEnv"
          className="block text-sm font-medium text-foreground"
        >
          {t("opencodeConfig.envFile", { defaultValue: "环境变量 (.env)" })}
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={useCommonConfig}
            onChange={(e) => onCommonConfigToggle(e.target.checked)}
            className="w-4 h-4 text-blue-500 bg-white dark:bg-gray-800 border-border-default rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
          />
          {t("opencodeConfig.writeCommonConfig", {
            defaultValue: "写入通用配置",
          })}
        </label>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onEditCommonConfig}
          className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
        >
          {t("opencodeConfig.editCommonConfig", {
            defaultValue: "编辑通用配置",
          })}
        </button>
      </div>

      {commonConfigError && (
        <p className="text-xs text-red-500 dark:text-red-400 text-right">
          {commonConfigError}
        </p>
      )}

      <JsonEditor
        value={value}
        onChange={handleChange}
        placeholder={`OPENCODE_BASE_URL=https://your-api-endpoint.com/
OPENCODE_API_KEY=sk-your-api-key-here
MODEL=openai/gpt-4o`}
        darkMode={isDarkMode}
        rows={6}
        showValidation={false}
        language="javascript"
      />

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}

      {!error && (
        <p className="text-xs text-muted-foreground">
          {t("opencodeConfig.envFileHint", {
            defaultValue: "使用 .env 格式配置 OpenCode 环境变量",
          })}
        </p>
      )}
    </div>
  );
};

interface OpenCodeConfigSectionProps {
  value: string;
  onChange: (value: string) => void;
  configError?: string;
}

/**
 * OpenCodeConfigSection - Config JSON editor section with common config support
 */
export const OpenCodeConfigSection: React.FC<OpenCodeConfigSectionProps> = ({
  value,
  onChange,
  configError,
}) => {
  const { t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-2">
      <label
        htmlFor="opencodeConfig"
        className="block text-sm font-medium text-foreground"
      >
        {t("opencodeConfig.configJson", {
          defaultValue: "配置文件 (config.json)",
        })}
      </label>

      <JsonEditor
        value={value}
        onChange={onChange}
        placeholder={`{
  "timeout": 30000,
  "maxRetries": 3
}`}
        darkMode={isDarkMode}
        rows={8}
        showValidation={true}
        language="json"
      />

      {configError && (
        <p className="text-xs text-red-500 dark:text-red-400">{configError}</p>
      )}

      {!configError && (
        <p className="text-xs text-muted-foreground">
          {t("opencodeConfig.configJsonHint", {
            defaultValue: "使用 JSON 格式配置 OpenCode 扩展参数（可选）",
          })}
        </p>
      )}
    </div>
  );
};
