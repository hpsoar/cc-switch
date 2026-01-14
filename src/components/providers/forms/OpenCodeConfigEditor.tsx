import React, { useState, useEffect } from "react";
import {
  OpenCodeEnvSection,
  OpenCodeConfigSection,
} from "./OpenCodeConfigSections";
import { OpenCodeCommonConfigModal } from "./OpenCodeCommonConfigModal";

interface OpenCodeConfigEditorProps {
  envValue: string;
  configValue: string;
  onEnvChange: (value: string) => void;
  onConfigChange: (value: string) => void;
  onEnvBlur?: () => void;
  useCommonConfig: boolean;
  onCommonConfigToggle: (checked: boolean) => void;
  commonConfigSnippet: string;
  onCommonConfigSnippetChange: (value: string) => void;
  commonConfigError: string;
  envError: string;
  configError: string;
  onExtract?: () => void;
  isExtracting?: boolean;
}

const OpenCodeConfigEditor: React.FC<OpenCodeConfigEditorProps> = ({
  envValue,
  configValue,
  onEnvChange,
  onConfigChange,
  onEnvBlur,
  useCommonConfig,
  onCommonConfigToggle,
  commonConfigSnippet,
  onCommonConfigSnippetChange,
  commonConfigError,
  envError,
  configError,
  onExtract,
  isExtracting,
}) => {
  const [isCommonConfigModalOpen, setIsCommonConfigModalOpen] = useState(false);

  // Auto-open common config modal if there's an error
  useEffect(() => {
    if (commonConfigError && !isCommonConfigModalOpen) {
      setIsCommonConfigModalOpen(true);
    }
  }, [commonConfigError, isCommonConfigModalOpen]);

  return (
    <div className="space-y-6">
      {/* Env Section */}
      <OpenCodeEnvSection
        value={envValue}
        onChange={onEnvChange}
        onBlur={onEnvBlur}
        error={envError}
        useCommonConfig={useCommonConfig}
        onCommonConfigToggle={onCommonConfigToggle}
        onEditCommonConfig={() => setIsCommonConfigModalOpen(true)}
        commonConfigError={commonConfigError}
      />

      {/* Config JSON Section */}
      <OpenCodeConfigSection
        value={configValue}
        onChange={onConfigChange}
        configError={configError}
      />

      {/* Common Config Modal */}
      <OpenCodeCommonConfigModal
        isOpen={isCommonConfigModalOpen}
        onClose={() => setIsCommonConfigModalOpen(false)}
        value={commonConfigSnippet}
        onChange={onCommonConfigSnippetChange}
        error={commonConfigError}
        onExtract={onExtract}
        isExtracting={isExtracting}
      />
    </div>
  );
};

export default OpenCodeConfigEditor;
