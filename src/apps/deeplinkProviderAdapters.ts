import type { AppId } from "@/lib/api";
import type { DeepLinkImportRequest } from "@/lib/api/deeplink";

export interface DeeplinkModelField {
  labelKey: string;
  value: string;
}

const getClaudeModelFields = (
  request: DeepLinkImportRequest,
): DeeplinkModelField[] => {
  const fields: Array<DeeplinkModelField | null> = [
    request.haikuModel
      ? { labelKey: "deeplink.haikuModel", value: request.haikuModel }
      : null,
    request.sonnetModel
      ? { labelKey: "deeplink.sonnetModel", value: request.sonnetModel }
      : null,
    request.opusModel
      ? { labelKey: "deeplink.opusModel", value: request.opusModel }
      : null,
    request.model
      ? { labelKey: "deeplink.multiModel", value: request.model }
      : null,
  ];

  return fields.filter((field): field is DeeplinkModelField => Boolean(field));
};

const getDefaultModelFields = (
  request: DeepLinkImportRequest,
): DeeplinkModelField[] => {
  if (!request.model) return [];
  return [{ labelKey: "deeplink.model", value: request.model }];
};

const deeplinkModelFieldAdapters: Partial<
  Record<AppId, (request: DeepLinkImportRequest) => DeeplinkModelField[]>
> = {
  claude: getClaudeModelFields,
  codex: getDefaultModelFields,
  gemini: getDefaultModelFields,
  opencode: getDefaultModelFields,
};

export const getDeeplinkModelFields = (
  appId: AppId | undefined,
  request: DeepLinkImportRequest,
): DeeplinkModelField[] => {
  if (!appId) return [];
  const adapter = deeplinkModelFieldAdapters[appId];
  if (!adapter) return [];
  return adapter(request);
};
