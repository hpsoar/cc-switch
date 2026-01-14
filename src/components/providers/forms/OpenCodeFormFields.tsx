import { useTranslation } from "react-i18next";
import { useMemo, useRef } from "react";
import { Info } from "lucide-react";
import EndpointSpeedTest from "./EndpointSpeedTest";
import { ApiKeySection, EndpointField } from "./shared";
import type { ProviderCategory } from "@/types";
import { generateProviderKey } from "@/utils/opencode";

interface EndpointCandidate {
  url: string;
}

interface OpenCodeFormFieldsProps {
  providerId?: string;
  providerName: string;
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
  providerName,
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

  // Generate provider key from name
  const providerKey = useMemo(() => {
    return providerName ? generateProviderKey(providerName) : "";
  }, [providerName]);

  // 为每个header维护一个稳定的ID映射，避免React key变化导致重新渲染
  const headerIdMapRef = useRef<Map<string, string>>(new Map());
  const nextIdRef = useRef(0);

  const headerEntries = useMemo(() => {
    const entries = Object.entries(headers);
    const currentKeys = new Set(entries.map(([key]) => key));

    // 清理已删除的header的ID映射
    for (const [oldKey] of Array.from(headerIdMapRef.current.entries())) {
      if (!currentKeys.has(oldKey)) {
        headerIdMapRef.current.delete(oldKey);
      }
    }

    // 为新header分配稳定的ID
    return entries.map(([key, value]) => {
      let id = headerIdMapRef.current.get(key);
      if (!id) {
        id = `header-${nextIdRef.current++}`;
        headerIdMapRef.current.set(key, id);
      }
      return { id, key, value };
    });
  }, [headers]);

  const handleHeaderChange = (
    oldKey: string,
    newKey: string,
    value: string,
  ) => {
    const newHeaders = { ...headers };

    // 如果key改变了，先删除旧的key，并更新ID映射
    if (oldKey !== newKey && oldKey in newHeaders) {
      delete newHeaders[oldKey];

      // 将旧key的ID映射转移到新key
      const id = headerIdMapRef.current.get(oldKey);
      if (id) {
        headerIdMapRef.current.delete(oldKey);
        if (newKey.trim()) {
          headerIdMapRef.current.set(newKey.trim(), id);
        }
      }
    }

    // 如果新key不为空，设置新值（允许value为空，方便用户先编辑key再填value）
    if (newKey.trim()) {
      newHeaders[newKey.trim()] = value;
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

      {providerKey && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            {t("provider.form.opencode.providerKey", {
              defaultValue: "供应商标识 (Provider Key)",
            })}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={providerKey}
              readOnly
              className="flex-1 h-9 rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("provider.form.opencode.providerKeyHint", {
              defaultValue:
                "自动从供应商名称生成，用于在 opencode.json 中标识此供应商。",
            })}
          </p>
        </div>
      )}

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
          {headerEntries.map((entry) => (
            <div key={entry.id} className="flex gap-2 items-start">
              <input
                type="text"
                value={entry.key}
                onChange={(e) => {
                  const newKey = e.target.value;
                  handleHeaderChange(entry.key, newKey, entry.value);
                }}
                className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="X-Custom-Header"
              />
              <input
                type="text"
                value={entry.value}
                onChange={(e) => handleHeaderChange(entry.key, entry.key, e.target.value)}
                className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="value"
              />
              <button
                type="button"
                onClick={() => removeHeader(entry.key)}
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
