import { useEffect, useMemo, useState } from "react";

import type { AppId } from "@/lib/api";
import type { ProviderCategory } from "@/types";

import {
  getPresetCategory,
  getProviderPresetEntries,
} from "@/apps/providerFormAdapters";

interface UseProviderCategoryProps {
  appId: AppId;
  selectedPresetId: string | null;
  isEditMode: boolean;
  initialCategory?: ProviderCategory;
}

/**
 * 管理供应商类别状态
 * 根据选择的预设自动更新类别
 */
export function useProviderCategory({
  appId,
  selectedPresetId,
  isEditMode,
  initialCategory,
}: UseProviderCategoryProps) {
  const [category, setCategory] = useState<ProviderCategory | undefined>(
    // 编辑模式：使用 initialCategory
    isEditMode ? initialCategory : undefined,
  );

  const presetEntries = useMemo(
    () => getProviderPresetEntries(appId),
    [appId],
  );

  useEffect(() => {
    // 编辑模式：只在初始化时设置，后续不自动更新
    if (isEditMode) {
      setCategory(initialCategory);
      return;
    }

    if (selectedPresetId === "custom") {
      setCategory("custom");
      return;
    }

    if (!selectedPresetId) return;

    const presetEntry = presetEntries.find(
      (entry) => entry.id === selectedPresetId,
    );
    if (!presetEntry) return;

    setCategory(getPresetCategory(presetEntry.preset));
  }, [appId, selectedPresetId, isEditMode, initialCategory, presetEntries]);

  return { category, setCategory };
}
