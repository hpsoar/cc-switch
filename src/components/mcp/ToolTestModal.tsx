import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mcpApi } from "@/lib/api/mcp";
import type { McpServerSpec, ToolInfo, ToolTestResult } from "@/types";

interface ToolTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverSpec: McpServerSpec | null;
  tool: ToolInfo | null;
  tools: ToolInfo[];
}

interface ParameterField {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  defaultValue?: any;
  value: any;
}

interface FormattedDetails {
  text: string;
  isJson: boolean;
}

const formatToolResultDetails = (
  details?: string | null,
): FormattedDetails | null => {
  if (!details) {
    return null;
  }

  const withoutPrefix = details.replace(/^Result[:：]\s*/i, "").trim();
  if (!withoutPrefix) {
    return { text: "", isJson: false };
  }

  const looksLikeJson =
    withoutPrefix.startsWith("{") || withoutPrefix.startsWith("[");

  if (looksLikeJson) {
    try {
      const parsed = JSON.parse(withoutPrefix);
      return { text: JSON.stringify(parsed, null, 2), isJson: true };
    } catch (error) {
      // fall through to plain text rendering when JSON parsing fails
    }
  }

  return { text: withoutPrefix, isJson: false };
};

const ToolTestModal: React.FC<ToolTestModalProps> = ({
  isOpen,
  onClose,
  serverSpec,
  tool,
  tools,
}) => {
  const { t } = useTranslation();
  const [selectedTool, setSelectedTool] = useState<ToolInfo | null>(tool);
  const [parameters, setParameters] = useState<ParameterField[]>([]);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ToolTestResult | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const [showOptionalParams, setShowOptionalParams] = useState(false);
  const [showAllOptional, setShowAllOptional] = useState(false);

  const formattedDetails = useMemo(
    () => formatToolResultDetails(result?.details),
    [result?.details],
  );

  useEffect(() => {
    if (isOpen && tool) {
      setSelectedTool(tool);
      parseToolSchema(tool);
      setResult(null);
      setShowSchema(false);
      setShowOptionalParams(false);
    }
  }, [isOpen, tool]);

  const parseToolSchema = (toolInfo: ToolInfo) => {
    const fields: ParameterField[] = [];
    const schema = toolInfo.input_schema;

    if (!schema || typeof schema !== "object") {
      return;
    }

    const properties = schema.properties;
    const required = schema.required || [];

    if (properties && typeof properties === "object") {
      Object.entries(properties).forEach(
        ([name, propSchema]: [string, any]) => {
          const propType = propSchema.type || "string";
          const isRequired = Array.isArray(required) && required.includes(name);
          const defaultValue = propSchema.default;

          let initialValue: any = "";
          if (defaultValue !== undefined) {
            initialValue = defaultValue;
          } else if (propType === "boolean") {
            initialValue = false;
          } else if (propType === "number" || propType === "integer") {
            initialValue = 0;
          } else if (propType === "array") {
            initialValue = "[]";
          } else if (propType === "object") {
            initialValue = "{}";
          }

          fields.push({
            name,
            type: propType,
            description: propSchema.description,
            required: isRequired,
            defaultValue,
            value: initialValue,
          });
        },
      );
    }

    setParameters(fields);
  };

  const handleToolChange = (toolName: string) => {
    const selected = tools.find((t) => t.name === toolName);
    if (selected) {
      setSelectedTool(selected);
      parseToolSchema(selected);
      setResult(null);
      setShowSchema(false);
      setShowOptionalParams(false);
    }
  };

  const handleParameterChange = (index: number, value: any) => {
    setParameters((prev) => {
      const updated = [...prev];
      updated[index].value = value;
      return updated;
    });
  };

  const handleExecute = async () => {
    if (!serverSpec || !selectedTool) {
      toast.error("Server spec or tool not available", { closeButton: true });
      return;
    }

    const missingRequired = parameters.filter(
      (p) => p.required && (p.value === undefined || p.value === ""),
    );
    if (missingRequired.length > 0) {
      toast.error(
        t("mcp.toolTest.missingRequired", {
          defaultValue: "Missing required parameters",
          names: missingRequired.map((p) => p.name).join(", "),
        }),
        { closeButton: true },
      );
      return;
    }

    const toolArgs: any = {};
    parameters.forEach((p) => {
      if (p.value !== undefined && p.value !== "") {
        try {
          if (p.type === "array" || p.type === "object") {
            toolArgs[p.name] = JSON.parse(p.value);
          } else {
            toolArgs[p.name] = p.value;
          }
        } catch {
          toolArgs[p.name] = p.value;
        }
      }
    });

    setExecuting(true);
    setResult(null);

    try {
      const testResult = await mcpApi.testTool(
        serverSpec,
        selectedTool.name,
        toolArgs,
      );
      setResult(testResult);

      if (testResult.success) {
        toast.success(testResult.message, { closeButton: true });
      } else {
        toast.error(testResult.message, { closeButton: true });
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      setResult({
        success: false,
        message: t("mcp.toolTest.executionFailed", {
          defaultValue: "Tool execution failed",
        }),
        details: errorMessage,
      });
      toast.error(errorMessage, { closeButton: true });
    } finally {
      setExecuting(false);
    }
  };

  const handleCopyResult = () => {
    if (formattedDetails) {
      navigator.clipboard.writeText(formattedDetails.text);
      toast.success(t("common.copied"), { closeButton: true });
    }
  };

  const handleClose = () => {
    setResult(null);
    setShowSchema(false);
    setShowOptionalParams(false);
    setShowAllOptional(false);
    onClose();
  };

  const renderParameterInput = (param: ParameterField, index: number) => {
    const commonProps = {
      id: `param-${param.name}`,
      value: param.value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        handleParameterChange(index, e.target.value),
      disabled: executing,
      className: "font-mono text-sm",
    };

    if (param.type === "boolean") {
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={`param-${param.name}`}
            checked={param.value}
            onCheckedChange={(checked) => handleParameterChange(index, checked)}
            disabled={executing}
          />
          <Label
            htmlFor={`param-${param.name}`}
            className="text-sm text-foreground cursor-pointer"
          >
            {param.name}
          </Label>
        </div>
      );
    }

    if (param.type === "number" || param.type === "integer") {
      return (
        <Input
          type="number"
          step={param.type === "integer" ? 1 : 0.01}
          {...commonProps}
        />
      );
    }

    if (param.type === "array" || param.type === "object") {
      return (
        <textarea
          id={`param-${param.name}`}
          value={param.value}
          onChange={(e) => handleParameterChange(index, e.target.value)}
          disabled={executing}
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
        />
      );
    }

    return <Input type="text" {...commonProps} />;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        zIndex="top"
        className="max-w-3xl max-h-[85vh] flex flex-col p-0"
      >
        <DialogHeader className="flex-shrink-0 border-b border-border-default px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            {t("mcp.toolTest.title", { defaultValue: "Test Tool" })}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-6">
          {/* Tool Selector */}
          <div className="relative">
            <label className="block text-sm font-medium text-foreground mb-2">
              {t("mcp.toolTest.selectTool", { defaultValue: "Select Tool" })}
            </label>
            <Select
              value={selectedTool?.name || ""}
              onValueChange={handleToolChange}
              disabled={executing}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t("mcp.toolTest.selectTool", {
                    defaultValue: "Select Tool",
                  })}
                />
              </SelectTrigger>
              <SelectContent className="z-[120]" position="popper">
                {tools.map((t) => (
                  <SelectItem key={t.name} value={t.name} className="pl-7">
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tool Description */}
          {selectedTool?.description && (
            <div className="glass rounded-lg p-4 border border-white/10">
              <div className="flex items-start gap-2">
                <Code2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedTool.description}
                </p>
              </div>
            </div>
          )}

          {/* Schema Toggle */}
          {selectedTool?.input_schema && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowSchema(!showSchema)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {showSchema ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                {t("mcp.toolTest.viewSchema", {
                  defaultValue: "View Input Schema",
                })}
              </button>

              {showSchema && (
                <div className="glass rounded-lg p-4 border border-white/10">
                  <pre className="text-xs font-mono overflow-x-auto text-muted-foreground">
                    {JSON.stringify(selectedTool.input_schema, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {parameters.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-default pb-3">
                <label className="block text-sm font-medium text-foreground">
                  {t("mcp.toolTest.parameters", { defaultValue: "Parameters" })}
                </label>
                <div className="flex gap-3 text-xs">
                  <span className="text-muted-foreground">
                    <span className="text-red-500 font-medium">
                      {parameters.filter((p) => p.required).length}
                    </span>{" "}
                    {t("mcp.toolTest.required", { defaultValue: "required" })}
                  </span>
                  <span className="text-muted-foreground">
                    <span className="text-blue-500 font-medium">
                      {parameters.filter((p) => !p.required).length}
                    </span>{" "}
                    {t("mcp.toolTest.optional", { defaultValue: "optional" })}
                  </span>
                </div>
              </div>

              {/* Required Parameters */}
              {parameters.filter((p) => p.required).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="text-red-500">*</span>
                    {t("mcp.toolTest.required", { defaultValue: "Required" })}
                  </div>
                  {parameters
                    .filter((p) => p.required)
                    .map((param) => {
                      const index = parameters.findIndex(
                        (p) => p.name === param.name,
                      );
                      return (
                        <div
                          key={param.name}
                          className="rounded-lg border border-border-default bg-card p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-red-500">*</span>
                              <label
                                htmlFor={`param-${param.name}`}
                                className="text-sm font-medium text-foreground truncate"
                              >
                                {param.name}
                              </label>
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary flex-shrink-0">
                                {param.type}
                              </span>
                            </div>
                          </div>
                          {renderParameterInput(param, index)}
                          {param.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {param.description}
                            </p>
                          )}
                          {param.defaultValue !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              {t("mcp.toolTest.default", {
                                defaultValue: "Default",
                              })}
                              : {JSON.stringify(param.defaultValue)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Optional Parameters */}
              {parameters.filter((p) => !p.required).length > 0 && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowOptionalParams(!showOptionalParams)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full group"
                  >
                    {showOptionalParams ? (
                      <ChevronDown size={16} className="transition-transform" />
                    ) : (
                      <ChevronRight
                        size={16}
                        className="transition-transform"
                      />
                    )}
                    {t("mcp.toolTest.optional", { defaultValue: "Optional" })}
                    <span className="text-xs text-muted-foreground">
                      ({parameters.filter((p) => !p.required).length})
                    </span>
                  </button>

                  {showOptionalParams && (
                    <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                      {parameters
                        .filter((p) => !p.required)
                        .slice(0, showAllOptional ? undefined : 5)
                        .map((param) => {
                          const index = parameters.findIndex(
                            (p) => p.name === param.name,
                          );
                          return (
                            <div
                              key={param.name}
                              className="rounded-lg border border-border-default bg-card p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <label
                                    htmlFor={`param-${param.name}`}
                                    className="text-sm font-medium text-foreground truncate"
                                  >
                                    {param.name}
                                  </label>
                                  <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-500 flex-shrink-0">
                                    {param.type}
                                  </span>
                                </div>
                              </div>
                              {renderParameterInput(param, index)}
                              {param.description && (
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {param.description}
                                </p>
                              )}
                              {param.defaultValue !== undefined && (
                                <p className="text-xs text-muted-foreground">
                                  {t("mcp.toolTest.default", {
                                    defaultValue: "Default",
                                  })}
                                  : {JSON.stringify(param.defaultValue)}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      {parameters.filter((p) => !p.required).length > 5 && (
                        <div className="text-center py-2">
                          <button
                            type="button"
                            onClick={() => setShowAllOptional(!showAllOptional)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showAllOptional
                              ? t("common.showLess", {
                                  defaultValue: "Show less",
                                })
                              : `+${parameters.filter((p) => !p.required).length - 5} ${t(
                                  "mcp.toolTest.moreParameters",
                                  {
                                    defaultValue: "more parameters",
                                  },
                                )}`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No Parameters */}
          {parameters.length === 0 && selectedTool?.input_schema && (
            <div className="glass rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle size={16} />
                {t("mcp.toolTest.noParameters", {
                  defaultValue:
                    "This tool has no parameters or uses an empty schema.",
                })}
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {executing && (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-32 bg-muted rounded" />
            </div>
          )}

          {/* Execution Result */}
          {result && (
            <div
              className={`rounded-lg border p-4 space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ${
                result.success
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-red-500/20 bg-red-500/5"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <p className="font-medium text-sm">{result.message}</p>
              </div>
              {formattedDetails && (
                <div className="relative group">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono break-all bg-background/80 p-3 rounded border border-border">
                    {formattedDetails.text}
                  </pre>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyResult}
                    className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy size={12} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t border-border-default px-6 py-4 gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={handleClose}>
            {t("common.close")}
          </Button>
          <Button
            type="button"
            onClick={handleExecute}
            disabled={executing || !selectedTool}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {executing ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                {t("mcp.toolTest.executing", { defaultValue: "Executing..." })}
              </>
            ) : (
              <>
                <Play size={16} className="mr-2" />
                {t("mcp.toolTest.execute", { defaultValue: "Execute" })}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ToolTestModal;
