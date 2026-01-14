import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import JsonEditor from "@/components/JsonEditor";
import { Label } from "@/components/ui/label";
import { OpenCodeModelConfig } from "./OpenCodeModelConfig";

interface OpenCodeProviderSectionProps {
  value: string;
  onChange: (value: string) => void;
  configError?: string;
  useCommonConfig?: boolean;
  onCommonConfigToggle?: (checked: boolean) => void;
  onEditCommonConfig?: () => void;
}

export const OpenCodeProviderSection: React.FC<
  OpenCodeProviderSectionProps
> = ({
  value,
  onChange,
  configError,
  useCommonConfig = false,
  onCommonConfigToggle,
  onEditCommonConfig,
}) => {
  const { t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [models, setModels] = useState<Record<string, any>>({});

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

  useEffect(() => {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && parsed.models) {
        setModels(parsed.models);
      }
    } catch {
      setModels({});
    }
  }, [value]);

  const handleAddModel = (modelId: string, config: any) => {
    try {
      const parsed = JSON.parse(value);
      const updated = {
        ...parsed,
        models: {
          ...parsed.models,
          [modelId]: config,
        },
      };
      onChange(JSON.stringify(updated, null, 2));
    } catch {
      const baseConfig = {
        npm: "@ai-sdk/openai-compatible",
        name: "Custom Provider",
        options: {
          baseURL: "",
          apiKey: "{env:API_KEY}",
        },
        models: {
          [modelId]: config,
        },
      };
      onChange(JSON.stringify(baseConfig, null, 2));
    }
  };

  const handleRemoveModel = (modelId: string) => {
    try {
      const parsed = JSON.parse(value);
      const newModels = { ...parsed.models };
      delete newModels[modelId];
      const updated = {
        ...parsed,
        models: newModels,
      };
      onChange(JSON.stringify(updated, null, 2));
    } catch {}
  };

  const handleUpdateModel = (modelId: string, config: any) => {
    try {
      const parsed = JSON.parse(value);
      const updated = {
        ...parsed,
        models: {
          ...parsed.models,
          [modelId]: config,
        },
      };
      onChange(JSON.stringify(updated, null, 2));
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="opencodeProviderConfig">
          {t("opencodeConfig.providerConfig", {
            defaultValue: "供应商配置 (JSON)",
          })}
        </Label>

        {onCommonConfigToggle && (
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              id="useOpenCodeCommonConfig"
              checked={useCommonConfig}
              onChange={(e) => onCommonConfigToggle(e.target.checked)}
              className="w-4 h-4 text-blue-500 bg-white dark:bg-gray-800 border-border-default rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
            />
            {t("opencodeConfig.writeCommonConfig", {
              defaultValue: "写入通用配置",
            })}
          </label>
        )}
      </div>

      {onEditCommonConfig && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onEditCommonConfig}
            className="text-xs text-blue-400 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            {t("opencodeConfig.editCommonConfig", {
              defaultValue: "编辑通用配置",
            })}
          </button>
        </div>
      )}

      <JsonEditor
        value={value}
        onChange={onChange}
        placeholder={`{
  "npm": "@ai-sdk/openai-compatible",
  "name": "My Provider",
  "options": {
    "baseURL": "https://api.example.com/v1",
    "apiKey": "{env:API_KEY}",
    "headers": {
      "X-Custom-Header": "value"
    }
  },
  "models": {
    "gpt-4": {
      "name": "GPT-4",
      "limit": {
        "context": 128000,
        "output": 4096
      }
    }
  }
}`}
        darkMode={isDarkMode}
        rows={12}
        showValidation={true}
        language="json"
      />

      {configError && (
        <p className="text-xs text-red-500 dark:text-red-400">{configError}</p>
      )}

      {!configError && (
        <p className="text-xs text-muted-foreground">
          {t("opencodeConfig.providerConfigHint", {
            defaultValue:
              "配置当前供应商的设置（不是完整的 opencode.json）。必需字段: npm, name, options, models。保存后会自动合并到 opencode.json 的 provider 对象中。",
          })}
        </p>
      )}

      <OpenCodeModelConfig
        models={models}
        onAddModel={handleAddModel}
        onRemoveModel={handleRemoveModel}
        onUpdateModel={handleUpdateModel}
      />
    </div>
  );
};

export default OpenCodeProviderSection;
