import React from "react";
import { OpenCodeProviderSection } from "./OpenCodeConfigSections";

interface OpenCodeConfigEditorProps {
  providerConfigValue: string;
  onProviderConfigChange: (value: string) => void;
  configError: string;
}

const OpenCodeConfigEditor: React.FC<OpenCodeConfigEditorProps> = ({
  providerConfigValue,
  onProviderConfigChange,
  configError,
}) => {
  return (
    <div className="space-y-6">
      <OpenCodeProviderSection
        value={providerConfigValue}
        onChange={onProviderConfigChange}
        configError={configError}
      />
    </div>
  );
};

export default OpenCodeConfigEditor;
