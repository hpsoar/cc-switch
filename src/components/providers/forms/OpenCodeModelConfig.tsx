import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ModelConfig {
  name: string;
  limit?: {
    context?: number;
    output?: number;
  };
}

interface OpenCodeModelConfigProps {
  models: Record<string, ModelConfig>;
  onAddModel: (modelId: string, config: ModelConfig) => void;
  onRemoveModel: (modelId: string) => void;
  onUpdateModel: (modelId: string, config: ModelConfig) => void;
}

export function OpenCodeModelConfig({
  models,
  onAddModel,
  onRemoveModel,
  onUpdateModel,
}: OpenCodeModelConfigProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [newModelId, setNewModelId] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newModelContext, setNewModelContext] = useState("");
  const [newModelOutput, setNewModelOutput] = useState("");

  const handleAddModel = () => {
    if (!newModelId.trim() || !newModelName.trim()) return;

    const config: ModelConfig = {
      name: newModelName.trim(),
    };

    // Add limit if at least one value is provided, use defaults for missing values
    const hasContext = newModelContext.trim();
    const hasOutput = newModelOutput.trim();

    if (hasContext || hasOutput) {
      config.limit = {
        context: hasContext ? parseInt(newModelContext, 10) : 128000,
        output: hasOutput ? parseInt(newModelOutput, 10) : 4096,
      };
    }

    onAddModel(newModelId.trim(), config);

    setNewModelId("");
    setNewModelName("");
    setNewModelContext("");
    setNewModelOutput("");
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-between px-0 h-auto py-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-sm font-medium text-foreground">
          {t("opencodeConfig.models", { defaultValue: "模型配置" })}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      {isExpanded && (
        <div className="space-y-4 pt-2">
          {/* Existing Models */}
          {Object.entries(models).length > 0 && (
            <div className="space-y-3">
              {Object.entries(models).map(([modelId, config]) => (
                <div
                  key={modelId}
                  className="border rounded-md p-3 space-y-2 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label
                          htmlFor={`model-id-${modelId}`}
                          className="text-xs"
                        >
                          {t("opencodeConfig.modelId", {
                            defaultValue: "模型 ID",
                          })}
                        </Label>
                        <Input
                          id={`model-id-${modelId}`}
                          value={modelId}
                          onChange={(e) => {
                            const newId = e.target.value;
                            if (newId !== modelId) {
                              onAddModel(newId, config);
                              onRemoveModel(modelId);
                            }
                          }}
                          className="h-8 text-sm"
                          placeholder="openai/gpt-4o"
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor={`model-name-${modelId}`}
                          className="text-xs"
                        >
                          {t("opencodeConfig.modelName", {
                            defaultValue: "显示名称",
                          })}
                        </Label>
                        <Input
                          id={`model-name-${modelId}`}
                          value={config.name}
                          onChange={(e) =>
                            onUpdateModel(modelId, {
                              ...config,
                              name: e.target.value,
                            })
                          }
                          className="h-8 text-sm"
                          placeholder="GPT-4o"
                          autoComplete="off"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label
                            htmlFor={`model-context-${modelId}`}
                            className="text-xs"
                          >
                            {t("opencodeConfig.contextLimit", {
                              defaultValue: "上下文限制",
                            })}
                          </Label>
                          <Input
                            id={`model-context-${modelId}`}
                            type="number"
                            value={config.limit?.context ?? ""}
                            onChange={(e) => {
                              const newContext = e.target.value
                                ? parseInt(e.target.value, 10)
                                : undefined;
                              const existingOutput = config.limit?.output;

                              const newConfig: ModelConfig = { ...config };

                              // If at least one value is provided, keep limit with defaults
                              if (
                                newContext !== undefined ||
                                existingOutput !== undefined
                              ) {
                                newConfig.limit = {
                                  context: newContext ?? 128000,
                                  output: existingOutput ?? 4096,
                                };
                              } else {
                                // Both are undefined, remove limit
                                delete newConfig.limit;
                              }

                              onUpdateModel(modelId, newConfig);
                            }}
                            className="h-8 text-sm"
                            placeholder="128000 (默认)"
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor={`model-output-${modelId}`}
                            className="text-xs"
                          >
                            {t("opencodeConfig.outputLimit", {
                              defaultValue: "输出限制",
                            })}
                          </Label>
                          <Input
                            id={`model-output-${modelId}`}
                            type="number"
                            value={config.limit?.output ?? ""}
                            onChange={(e) => {
                              const newOutput = e.target.value
                                ? parseInt(e.target.value, 10)
                                : undefined;
                              const existingContext = config.limit?.context;

                              const newConfig: ModelConfig = { ...config };

                              // If at least one value is provided, keep limit with defaults
                              if (
                                existingContext !== undefined ||
                                newOutput !== undefined
                              ) {
                                newConfig.limit = {
                                  context: existingContext ?? 128000,
                                  output: newOutput ?? 4096,
                                };
                              } else {
                                // Both are undefined, remove limit
                                delete newConfig.limit;
                              }

                              onUpdateModel(modelId, newConfig);
                            }}
                            className="h-8 text-sm"
                            placeholder="4096 (默认)"
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveModel(modelId)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New Model */}
          <div className="border border-dashed rounded-md p-3 space-y-2 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {t("opencodeConfig.addModel", { defaultValue: "添加新模型" })}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="new-model-id" className="text-xs">
                  {t("opencodeConfig.modelId", { defaultValue: "模型 ID" })}
                </Label>
                <Input
                  id="new-model-id"
                  value={newModelId}
                  onChange={(e) => setNewModelId(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="openai/gpt-4o"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="new-model-name" className="text-xs">
                  {t("opencodeConfig.modelName", { defaultValue: "显示名称" })}
                </Label>
                <Input
                  id="new-model-name"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="GPT-4o"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="new-model-context" className="text-xs">
                  {t("opencodeConfig.contextLimit", {
                    defaultValue: "上下文限制",
                  })}
                </Label>
                <Input
                  id="new-model-context"
                  type="number"
                  value={newModelContext}
                  onChange={(e) => setNewModelContext(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="128000"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="new-model-output" className="text-xs">
                  {t("opencodeConfig.outputLimit", {
                    defaultValue: "输出限制",
                  })}
                </Label>
                <Input
                  id="new-model-output"
                  type="number"
                  value={newModelOutput}
                  onChange={(e) => setNewModelOutput(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="4096"
                  autoComplete="off"
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={handleAddModel}
              disabled={!newModelId.trim() || !newModelName.trim()}
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("opencodeConfig.addModelButton", {
                defaultValue: "添加模型",
              })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OpenCodeModelConfig;
