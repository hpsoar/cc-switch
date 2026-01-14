import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Code2,
  FileJson,
  MessageSquare,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { McpTestResult } from "@/types";

interface McpTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testResult: McpTestResult | null;
  testing: boolean;
}

export function McpTestModal({
  open,
  onOpenChange,
  testResult,
  testing,
}: McpTestModalProps) {
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    tools: true,
    resources: true,
    prompts: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[80vh] flex flex-col"
        zIndex="top"
      >
        <DialogHeader>
          <DialogTitle>{t("mcp.testResults")}</DialogTitle>
          <DialogDescription>{t("mcp.testDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4">
          {testing ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {t("mcp.testing")}
              </p>
            </div>
          ) : testResult ? (
            <div className="space-y-4">
              {/* Status Section */}
              <div
                className={`p-4 rounded-lg border ${
                  testResult.success
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{testResult.message}</p>
                    {testResult.details && (
                      <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                        {testResult.details}
                      </pre>
                    )}
                  </div>
                </div>
              </div>

              {/* Server Info */}
              {testResult.server_info && (
                <div className="p-4 rounded-lg border bg-muted/50">
                  <h3 className="font-medium mb-2">
                    {t("mcp.serverInformation")}
                  </h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">
                      {t("mcp.serverName")}:
                    </dt>
                    <dd className="font-mono">{testResult.server_info.name}</dd>
                    <dt className="text-muted-foreground">
                      {t("mcp.serverVersion")}:
                    </dt>
                    <dd className="font-mono">
                      {testResult.server_info.version}
                    </dd>
                    <dt className="text-muted-foreground">
                      {t("mcp.protocolVersion")}:
                    </dt>
                    <dd className="font-mono">
                      {testResult.server_info.protocol_version}
                    </dd>
                  </dl>
                </div>
              )}

              {/* Tools Section */}
              {testResult.tools && testResult.tools.length > 0 && (
                <div className="border rounded-lg">
                  <button
                    onClick={() => toggleSection("tools")}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4" />
                      <h3 className="font-medium">
                        {t("mcp.tools")} ({testResult.tools.length})
                      </h3>
                    </div>
                    {expandedSections.tools ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {expandedSections.tools && (
                    <div className="px-4 pb-4 space-y-2">
                      {testResult.tools.map((tool, index) => (
                        <div
                          key={index}
                          className="p-3 rounded border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="font-mono font-medium text-sm">
                            {tool.name}
                          </div>
                          {tool.description && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {tool.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Resources Section */}
              {testResult.resources && testResult.resources.length > 0 && (
                <div className="border rounded-lg">
                  <button
                    onClick={() => toggleSection("resources")}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4" />
                      <h3 className="font-medium">
                        {t("mcp.resources")} ({testResult.resources.length})
                      </h3>
                    </div>
                    {expandedSections.resources ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {expandedSections.resources && (
                    <div className="px-4 pb-4 space-y-2">
                      {testResult.resources.map((resource, index) => (
                        <div
                          key={index}
                          className="p-3 rounded border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="font-mono font-medium text-sm break-all">
                            {resource.uri}
                          </div>
                          {resource.name && (
                            <div className="mt-1 text-sm">{resource.name}</div>
                          )}
                          {resource.description && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {resource.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Prompts Section */}
              {testResult.prompts && testResult.prompts.length > 0 && (
                <div className="border rounded-lg">
                  <button
                    onClick={() => toggleSection("prompts")}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <h3 className="font-medium">
                        {t("mcp.prompts")} ({testResult.prompts.length})
                      </h3>
                    </div>
                    {expandedSections.prompts ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {expandedSections.prompts && (
                    <div className="px-4 pb-4 space-y-2">
                      {testResult.prompts.map((prompt, index) => (
                        <div
                          key={index}
                          className="p-3 rounded border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="font-mono font-medium text-sm">
                            {prompt.name}
                          </div>
                          {prompt.description && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {prompt.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">
                {t("mcp.noTestResults")}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
