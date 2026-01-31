import type { UseFormReturn } from "react-hook-form";

import type { AppId } from "@/lib/api";
import type { ProviderFormData } from "@/lib/schemas/provider";
import type { ProviderCategory } from "@/types";
import type { ProviderPresetEntry } from "@/apps/providerFormAdapters";
import type { ProviderPreset } from "@/config/claudeProviderPresets";
import type { CodexProviderPreset } from "@/config/codexProviderPresets";
import type { GeminiProviderPreset } from "@/config/geminiProviderPresets";
import type { OpenCodeProviderPreset } from "@/config/opencodeProviderPresets";

import { getCustomPresetTemplate } from "@/apps/providerFormAdapters";
import { applyTemplateValues } from "@/utils/providerConfigUtils";

export interface PresetMetaSummary {
  id: string;
  category?: ProviderCategory;
  isPartner?: boolean;
  partnerPromotionKey?: string;
}

export const getPresetMetaSummary = (
  entry: ProviderPresetEntry,
): PresetMetaSummary => ({
  id: entry.id,
  category: entry.preset.category,
  isPartner: entry.preset.isPartner,
  partnerPromotionKey: entry.preset.partnerPromotionKey,
});

interface ApplyPresetContext {
  appId: AppId;
  entry: ProviderPresetEntry;
  form: UseFormReturn<ProviderFormData>;
  resetCodexConfig: (auth: Record<string, unknown>, config: string) => void;
  resetGeminiConfig: (
    env: Record<string, unknown>,
    config: Record<string, unknown>,
  ) => void;
  resetOpenCodeConfig: (
    env: Record<string, unknown>,
    config: Record<string, unknown>,
  ) => void;
}

export const applyProviderPresetEntry = ({
  appId,
  entry,
  form,
  resetCodexConfig,
  resetGeminiConfig,
  resetOpenCodeConfig,
}: ApplyPresetContext): void => {
  const applyCodexPreset = () => {
    const preset = entry.preset as CodexProviderPreset;
    const auth = preset.auth ?? {};
    const config = preset.config ?? "";

    resetCodexConfig(auth, config);
    form.reset({
      name: preset.name,
      websiteUrl: preset.websiteUrl ?? "",
      settingsConfig: JSON.stringify({ auth, config }, null, 2),
      icon: preset.icon ?? "",
      iconColor: preset.iconColor ?? "",
    });
  };

  const applyGeminiPreset = () => {
    const preset = entry.preset as GeminiProviderPreset;
    const env = (preset.settingsConfig as Record<string, unknown>)?.env ?? {};
    const config =
      (preset.settingsConfig as Record<string, unknown>)?.config ?? {};

    resetGeminiConfig(env, config);
    form.reset({
      name: preset.name,
      websiteUrl: preset.websiteUrl ?? "",
      settingsConfig: JSON.stringify(preset.settingsConfig, null, 2),
      icon: preset.icon ?? "",
      iconColor: preset.iconColor ?? "",
    });
  };

  const applyOpenCodePreset = () => {
    const preset = entry.preset as OpenCodeProviderPreset;
    const env = (preset.settingsConfig as Record<string, unknown>)?.env ?? {};
    const config =
      (preset.settingsConfig as Record<string, unknown>)?.config ?? {};

    resetOpenCodeConfig(env, config);
    form.reset({
      name: preset.name,
      websiteUrl: preset.websiteUrl ?? "",
      settingsConfig: JSON.stringify(preset.settingsConfig, null, 2),
      icon: preset.icon ?? "",
      iconColor: preset.iconColor ?? "",
    });
  };

  const applyClaudePreset = () => {
    const preset = entry.preset as ProviderPreset;
    const config = applyTemplateValues(
      preset.settingsConfig,
      preset.templateValues,
    );

    form.reset({
      name: preset.name,
      websiteUrl: preset.websiteUrl ?? "",
      settingsConfig: JSON.stringify(config, null, 2),
      icon: preset.icon ?? "",
      iconColor: preset.iconColor ?? "",
    });
  };

  const applyAdapterMap: Record<AppId, () => void> = {
    claude: applyClaudePreset,
    codex: applyCodexPreset,
    gemini: applyGeminiPreset,
    opencode: applyOpenCodePreset,
  };

  applyAdapterMap[appId]();
};

interface ResetCustomPresetContext {
  appId: AppId;
  form: UseFormReturn<ProviderFormData>;
  defaultValues: ProviderFormData;
  resetCodexConfig: (auth: Record<string, unknown>, config: string) => void;
  resetGeminiConfig: (
    env: Record<string, unknown>,
    config: Record<string, unknown>,
  ) => void;
  resetOpenCodeConfig: (
    env: Record<string, unknown>,
    config: Record<string, unknown>,
  ) => void;
}

export const resetProviderFormForCustomPreset = ({
  appId,
  form,
  defaultValues,
  resetCodexConfig,
  resetGeminiConfig,
  resetOpenCodeConfig,
}: ResetCustomPresetContext): void => {
  form.reset(defaultValues);

  const customTemplate = getCustomPresetTemplate(appId);
  if (customTemplate) {
    resetCodexConfig(customTemplate.auth ?? {}, customTemplate.config ?? "");
    return;
  }

  const resetAdapterMap: Partial<Record<AppId, () => void>> = {
    gemini: () => resetGeminiConfig({}, {}),
    opencode: () => resetOpenCodeConfig({}, {}),
  };

  resetAdapterMap[appId]?.();
};

interface InitCustomPresetContext {
  appId: AppId;
  initialData?: {
    name?: string;
  };
  selectedPresetId: string | null;
  resetCodexConfig: (auth: Record<string, unknown>, config: string) => void;
}

export const maybeInitCustomCodexPreset = ({
  appId,
  initialData,
  selectedPresetId,
  resetCodexConfig,
}: InitCustomPresetContext): void => {
  if (initialData || selectedPresetId !== "custom") return;

  const template = getCustomPresetTemplate(appId);
  if (!template) return;
  resetCodexConfig(template.auth ?? {}, template.config ?? "");
};
