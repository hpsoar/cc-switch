import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import EndpointSpeedTest from "./EndpointSpeedTest";
import { ApiKeySection, EndpointField } from "./shared";
import type { ProviderCategory } from "@/types";

interface EndpointCandidate {
  url: string;
}

interface OpenCodeFormFieldsProps {
  providerId?: string;
  shouldShowApiKey: boolean;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  category?: ProviderCategory;
  shouldShowApiKeyLink: boolean;
  websiteUrl: string;
  isPartner?: boolean;
  partnerPromotionKey?: string;

  shouldShowSpeedTest: boolean;
  baseUrl: string;
  onBaseUrlChange: (url: string) => void;
  isEndpointModalOpen: boolean;
  onEndpointModalToggle: (open: boolean) => void;
  onCustomEndpointsChange: (endpoints: string[]) => void;
  autoSelect: boolean;
  onAutoSelectChange: (checked: boolean) => void;

  headers: Record<string, string>;
  onHeadersChange: (headers: Record<string, string>) => void;

  speedTestEndpoints: EndpointCandidate[];
}

export function OpenCodeFormFields({
  providerId,
  shouldShowApiKey,
  apiKey,
  onApiKeyChange,
  category,
  shouldShowApiKeyLink,
  websiteUrl,
  isPartner,
  partnerPromotionKey,
  shouldShowSpeedTest,
  baseUrl,
  onBaseUrlChange,
  isEndpointModalOpen,
  onEndpointModalToggle,
  onCustomEndpointsChange,
  autoSelect,
  onAutoSelectChange,
  headers,
  onHeadersChange,
  speedTestEndpoints,
}: OpenCodeFormFieldsProps) {
  const { t } = useTranslation();

  const handleHeaderChange = (
    oldKey: string,
    newKey: string,
    value: string,
  ) => {
    const newHeaders = { ...headers };

    if (oldKey !== newKey) {
      delete newHeaders[oldKey];
    }

    if (newKey && value.trim()) {
      newHeaders[newKey] = value.trim();
    } else if (!value.trim() && newKey) {
      delete newHeaders[newKey];
    }

    onHeadersChange(newHeaders);
  };

  const addHeader = () => {
    const key = `custom-${Object.keys(headers).length + 1}`;
    const newHeaders = { ...headers, [key]: "" };
    onHeadersChange(newHeaders);
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[key];
    onHeadersChange(newHeaders);
  };

  return (
    <>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <div className="flex gap-3">
          <Info className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t("provider.form.opencode.title", {
                defaultValue: "OpenCode 配置",
              })}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t("provider.form.opencode.hint", {
                defaultValue:
                  "OpenCode 使用 JSON 配置文件来管理供应商。请在下方配置供应商的 npm 包、API 端点和模型信息。详情请参阅 https://opencode.ai/docs/providers/",
              })}
            </p>
          </div>
        </div>
      </div>

      {shouldShowApiKey && (
        <ApiKeySection
          value={apiKey}
          onChange={onApiKeyChange}
          category={category}
          shouldShowLink={shouldShowApiKeyLink}
          websiteUrl={websiteUrl}
          isPartner={isPartner}
          partnerPromotionKey={partnerPromotionKey}
        />
      )}

      {shouldShowSpeedTest && (
        <EndpointField
          id="opencodeBaseUrl"
          label={t("providerForm.apiEndpoint", { defaultValue: "API 端点" })}
          value={baseUrl}
          onChange={onBaseUrlChange}
          placeholder={t("providerForm.apiEndpointPlaceholder", {
            defaultValue: "https://your-api-endpoint.com/v1",
          })}
          onManageClick={() => onEndpointModalToggle(true)}
        />
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          {t("provider.form.opencode.headers", {
            defaultValue: "自定义请求头 (Headers)",
          })}
        </label>
        <div className="space-y-2">
          {Object.entries(headers).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-start">
              <input
                type="text"
                value={key}
                onChange={(e) => {
                  const newKey = e.target.value;
                  const newValue = headers[key];
                  handleHeaderChange(key, newKey, newValue);
                }}
                className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="X-Custom-Header"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => handleHeaderChange(key, key, e.target.value)}
                className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="value"
              />
              <button
                type="button"
                onClick={() => removeHeader(key)}
                className="h-9 w-9 flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addHeader}
            className="w-full h-9 flex items-center justify-center rounded-md border border-dashed border-input hover:bg-accent hover:text-accent-foreground text-sm text-muted-foreground"
          >
            +{" "}
            {t("provider.form.opencode.addHeader", {
              defaultValue: "添加请求头",
            })}
          </button>
        </div>
      </div>

      {shouldShowSpeedTest && isEndpointModalOpen && (
        <EndpointSpeedTest
          appId="opencode"
          providerId={providerId}
          value={baseUrl}
          onChange={onBaseUrlChange}
          initialEndpoints={speedTestEndpoints}
          visible={isEndpointModalOpen}
          onClose={() => onEndpointModalToggle(false)}
          autoSelect={autoSelect}
          onAutoSelectChange={onAutoSelectChange}
          onCustomEndpointsChange={onCustomEndpointsChange}
        />
      )}
    </>
  );
}
