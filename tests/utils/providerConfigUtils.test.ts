import { describe, expect, it } from "vitest";
import {
  getApiKeyFromConfig,
  hasApiKeyField,
  setApiKeyInConfig,
} from "@/utils/providerConfigUtils";

const BASE_CONFIG = JSON.stringify(
  {
    npm: "@ai-sdk/openai-compatible",
    name: "Demo Provider",
    options: {
      baseURL: "https://api.example.com",
      apiKey: "sk-old",
    },
    models: {},
  },
  null,
  2,
);

describe("providerConfigUtils - OpenCode helpers", () => {
  it("reads OpenCode apiKey from options", () => {
    expect(getApiKeyFromConfig(BASE_CONFIG, "opencode")).toBe("sk-old");
    expect(hasApiKeyField(BASE_CONFIG, "opencode")).toBe(true);
  });

  it("updates options apiKey when field exists", () => {
    const updated = setApiKeyInConfig(BASE_CONFIG, "sk-new", {
      appType: "opencode",
    });
    const parsed = JSON.parse(updated);
    expect(parsed.options.apiKey).toBe("sk-new");
  });

  it("creates options apiKey when allowed", () => {
    const configWithoutOptions = JSON.stringify({
      npm: "@ai-sdk/openai-compatible",
      name: "Missing Options",
      models: {},
    });

    const updated = setApiKeyInConfig(configWithoutOptions, "sk-new", {
      appType: "opencode",
      createIfMissing: true,
    });

    const parsed = JSON.parse(updated);
    expect(parsed.options.apiKey).toBe("sk-new");
  });
});
