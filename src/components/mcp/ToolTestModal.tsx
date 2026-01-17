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

interface ListedTool {
  name: string;
  description?: string;
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

  const [isMetaToolMode, setIsMetaToolMode] = useState(false);
  const [listedTools, setListedTools] = useState<ListedTool[]>([]);
  const [fetchingTools, setFetchingTools] = useState(false);
  const [selectedListedTool, setSelectedListedTool] = useState<string | null>(
    null,
  );
  const [fetchingSchema, setFetchingSchema] = useState(false);

  const formattedDetails = useMemo(
    () => formatToolResultDetails(result?.details),
    [result?.details],
  );

  const sortedTools = useMemo(() => {
    return [...tools].sort((a, b) => a.name.localeCompare(b.name));
  }, [tools]);

  useEffect(() => {
    if (isOpen && tool) {
      setSelectedTool(tool);
      parseToolSchema(tool);
      setResult(null);
      setShowSchema(false);
      setShowOptionalParams(false);

      const metaToolNames = ["TOOL_LIST", "TOOL_GET", "TOOL_CALL"];
      setIsMetaToolMode(metaToolNames.includes(tool.name));

      if (!metaToolNames.includes(tool.name)) {
        setListedTools([]);
        setSelectedListedTool(null);
      }
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

      const metaToolNames = ["TOOL_LIST", "TOOL_GET", "TOOL_CALL"];
      setIsMetaToolMode(metaToolNames.includes(selected.name));

      if (!metaToolNames.includes(selected.name)) {
        setListedTools([]);
        setSelectedListedTool(null);
      }
    }
  };

  const handleFetchToolList = async () => {
    if (!serverSpec) return;

    setFetchingTools(true);
    setListedTools([]);
    setResult(null);

    try {
      const testResult = await mcpApi.testTool(serverSpec, "TOOL_LIST", {});

      setResult(testResult);

      if (testResult.success && testResult.details) {
        try {
          let detailsText = testResult.details;

          if (detailsText.startsWith("Result:")) {
            detailsText = detailsText.substring(7).trim();
          } else if (detailsText.startsWith("Result：")) {
            detailsText = detailsText.substring(8).trim();
          } else if (detailsText.startsWith("Result:")) {
            detailsText = detailsText.substring(8).trim();
          }

          console.log("Parsing tool list details:", detailsText);

          const parsed = JSON.parse(detailsText);
          console.log("Parsed tool list:", parsed);

          const tools: ListedTool[] = [];

          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              if (item.name) {
                tools.push({
                  name: item.name,
                  description: item.description,
                });
              }
            });
          } else if (Array.isArray(parsed.tools)) {
            parsed.tools.forEach((item: any) => {
              if (item.name) {
                tools.push({
                  name: item.name,
                  description: item.description,
                });
              }
            });
          } else if (parsed.result && Array.isArray(parsed.result)) {
            parsed.result.forEach((item: any) => {
              if (item.name) {
                tools.push({
                  name: item.name,
                  description: item.description,
                });
              }
            });
          } else if (parsed.result && Array.isArray(parsed.result.tools)) {
            parsed.result.tools.forEach((item: any) => {
              if (item.name) {
                tools.push({
                  name: item.name,
                  description: item.description,
                });
              }
            });
          } else if (parsed.content && Array.isArray(parsed.content)) {
            parsed.content.forEach((item: any) => {
              if (item.text) {
                try {
                  const pythonList = eval(`(${item.text})`) as any[];
                  console.log(`Python list item: ${item.text}`);

                  pythonList.forEach((toolItem: any) => {
                    if (toolItem.name) {
                      tools.push({
                        name: toolItem.name,
                        description: toolItem.description,
                      });
                    }
                  });
                } catch (e: any) {
                  console.error("Failed to parse Python list:", e);
                }
              } else if (item.name) {
                tools.push({
                  name: item.name,
                  description: item.description,
                });
              }
            });
          }

          if (tools.length > 0) {
            console.log(`Found ${tools.length} tools:`, tools);
            setListedTools(tools);
          } else {
            console.error("No tools found in parsed data");
            toast.error(
              t("mcp.toolTest.parseToolsFailed", {
                defaultValue: "Failed to parse tool list",
              }) +
                ": " +
                t("mcp.toolTest.noToolsFound", {
                  defaultValue: "No tools found",
                }),
              { closeButton: true },
            );
          }
        } catch (parseError: any) {
          console.error("Failed to parse tool list:", parseError);
          console.error("Original details:", testResult.details);
          toast.error(
            t("mcp.toolTest.parseToolsFailed", {
              defaultValue: "Failed to parse tool list",
            }) +
              ": " +
              parseError.message +
              ". Details: " +
              testResult.details.substring(0, 200),
            { closeButton: true },
          );
        }
      } else if (!testResult.success) {
        toast.error(testResult.message, { closeButton: true });
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      setResult({
        success: false,
        message: t("mcp.toolTest.fetchToolsFailed", {
          defaultValue: "Failed to fetch tool list",
        }),
        details: errorMessage,
      });
      toast.error(errorMessage, { closeButton: true });
    } finally {
      setFetchingTools(false);
    }
  };

  const handleFetchToolSchema = async (toolName: string) => {
    if (!serverSpec) return;

    setFetchingSchema(true);
    setSelectedListedTool(toolName);
    setResult(null);

    try {
      const testResult = await mcpApi.testTool(serverSpec, "TOOL_GET", {
        tool_name: toolName,
      });

      setResult(testResult);

      if (testResult.success && testResult.details) {
        try {
          let detailsText = testResult.details;

          if (detailsText.startsWith("Result:")) {
            detailsText = detailsText.substring(7).trim();
          }

          const details = JSON.parse(detailsText);

          if (details) {
            const dynamicTool: ToolInfo = {
              name: toolName,
              description: details.description,
              input_schema: details.parameters || details.input_schema,
            };
            setSelectedTool(dynamicTool);
            parseToolSchema(dynamicTool);
            setIsMetaToolMode(false);
          }
        } catch (parseError: any) {
          console.error("Failed to parse tool schema:", parseError);
          console.error("Original details:", testResult.details);
          toast.error(
            t("mcp.toolTest.parseSchemaFailed", {
              defaultValue: "Failed to parse tool schema",
            }),
            { closeButton: true },
          );
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      setResult({
        success: false,
        message: t("mcp.toolTest.fetchSchemaFailed", {
          defaultValue: "Failed to fetch tool schema",
        }),
        details: errorMessage,
      });
      toast.error(errorMessage, { closeButton: true });
    } finally {
      setFetchingSchema(false);
    }
  };

  const handleExecuteWithMetaTool = async () => {
    if (!serverSpec || !selectedListedTool) {
      toast.error("Please select a tool first", { closeButton: true });
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

    const toolArgs: any = {
      tool_name: selectedListedTool,
      arguments: {},
    };

    parameters.forEach((p) => {
      if (p.value !== undefined && p.value !== "") {
        try {
          if (p.type === "array" || p.type === "object") {
            toolArgs.arguments[p.name] = JSON.parse(p.value);
          } else {
            toolArgs.arguments[p.name] = p.value;
          }
        } catch {
          toolArgs.arguments[p.name] = p.value;
        }
      }
    });

    setExecuting(true);
    setResult(null);

    try {
      const testResult = await mcpApi.testTool(
        serverSpec,
        "TOOL_CALL",
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
                {sortedTools.map((t) => (
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

          {isMetaToolMode && selectedTool?.name === "TOOL_LIST" && (
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchToolList}
                disabled={fetchingTools || !serverSpec}
                className="w-full"
              >
                {fetchingTools ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    {t("mcp.toolTest.fetchingTools", {
                      defaultValue: "Fetching tools...",
                    })}
                  </>
                ) : (
                  <>
                    <Code2 size={16} className="mr-2" />
                    {t("mcp.toolTest.fetchToolsList", {
                      defaultValue: "Fetch Tool List",
                    })}
                  </>
                )}
              </Button>

              {listedTools.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    {t("mcp.toolTest.availableTools", {
                      defaultValue: "Available Tools",
                    })}
                  </label>
                  <div className="max-h-60 overflow-y-auto rounded-lg border border-border-default bg-card">
                    {listedTools.map((tool) => (
                      <button
                        key={tool.name}
                        type="button"
                        onClick={() => handleFetchToolSchema(tool.name)}
                        disabled={fetchingSchema}
                        className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 ${
                          selectedListedTool === tool.name
                            ? "bg-muted/80 font-medium"
                            : ""
                        }`}
                      >
                        <div className="font-mono text-sm">{tool.name}</div>
                        {tool.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {tool.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
            onClick={
              isMetaToolMode && selectedListedTool
                ? handleExecuteWithMetaTool
                : handleExecute
            }
            disabled={
              executing ||
              !selectedTool ||
              (isMetaToolMode && !selectedListedTool)
            }
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
