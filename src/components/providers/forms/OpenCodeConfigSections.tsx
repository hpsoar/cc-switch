import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import JsonEditor from "@/components/JsonEditor";
import { OpenCodeModelConfig } from "./OpenCodeModelConfig";

interface OpenCodeProviderSectionProps {
  value: string;
  onChange: (value: string) => void;
  configError?: string;
}

export const OpenCodeProviderSection: React.FC<
  OpenCodeProviderSectionProps
> = ({ value, onChange, configError }) => {
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
      <label
        htmlFor="opencodeProviderConfig"
        className="block text-sm font-medium text-foreground"
      >
        {t("opencodeConfig.providerConfig", {
          defaultValue: "供应商配置 (JSON)",
        })}
      </label>

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
              "使用 JSON 格式配置 OpenCode 供应商。必需字段: npm, options, models。详情请参阅 https://opencode.ai/docs/providers/",
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
