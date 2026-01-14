import React, { useState, useEffect } from "react";
import { OpenCodeProviderSection } from "./OpenCodeConfigSections";
import { OpenCodeCommonConfigModal } from "./OpenCodeCommonConfigModal";

interface OpenCodeConfigEditorProps {
  providerConfigValue: string;
  onProviderConfigChange: (value: string) => void;
  configError: string;
  useCommonConfig: boolean;
  onCommonConfigToggle: (checked: boolean) => void;
  commonConfigSnippet: string;
  onCommonConfigSnippetChange: (value: string) => void;
  commonConfigError: string;
  onExtract?: () => void;
  isExtracting?: boolean;
  onClearCommonConfigError?: () => void;
}

const OpenCodeConfigEditor: React.FC<OpenCodeConfigEditorProps> = ({
  providerConfigValue,
  onProviderConfigChange,
  configError,
  useCommonConfig,
  onCommonConfigToggle,
  commonConfigSnippet,
  onCommonConfigSnippetChange,
  commonConfigError,
  onExtract,
  isExtracting,
  onClearCommonConfigError,
}) => {
  const [isCommonConfigModalOpen, setIsCommonConfigModalOpen] = useState(false);

  // Auto-open common config modal if there's an error
  useEffect(() => {
    if (commonConfigError && !isCommonConfigModalOpen) {
      setIsCommonConfigModalOpen(true);
    }
  }, [commonConfigError, isCommonConfigModalOpen]);

  // Handle modal close: clear error when user closes manually
  const handleModalClose = () => {
    setIsCommonConfigModalOpen(false);
    if (onClearCommonConfigError) {
      onClearCommonConfigError();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <OpenCodeProviderSection
          value={providerConfigValue}
          onChange={onProviderConfigChange}
          configError={configError}
          useCommonConfig={useCommonConfig}
          onCommonConfigToggle={onCommonConfigToggle}
          onEditCommonConfig={() => setIsCommonConfigModalOpen(true)}
        />
        {/* Show error only when modal is not open (to avoid duplication) */}
        {commonConfigError && !isCommonConfigModalOpen && (
          <p className="text-xs text-red-500 dark:text-red-400 text-right">
            {commonConfigError}
          </p>
        )}
      </div>

      {/* Common Config Modal */}
      <OpenCodeCommonConfigModal
        isOpen={isCommonConfigModalOpen}
        onClose={handleModalClose}
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
