import { Suspense, type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetProviderState, getProviders } from "../msw/state";
import { emitTauriEvent } from "../msw/tauriMocks";

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("@/components/providers/ProviderList", () => ({
  ProviderList: ({
    providers,
    currentProviderId,
    onSwitch,
    onEdit,
    onDuplicate,
    onConfigureUsage,
    onOpenWebsite,
    onCreate,
  }: any) => {
    const currentProvider = providers?.[currentProviderId];

    return (
      <div>
        <div data-testid="provider-list">{JSON.stringify(providers)}</div>
        <div data-testid="current-provider">{currentProviderId}</div>
        <button
          onClick={() =>
            onSwitch && currentProvider && onSwitch(currentProvider)
          }
        >
          switch
        </button>
        <button
          onClick={() => onEdit && currentProvider && onEdit(currentProvider)}
        >
          edit
        </button>
        <button
          onClick={() =>
            onDuplicate && currentProvider && onDuplicate(currentProvider)
          }
        >
          duplicate
        </button>
        <button
          onClick={() =>
            onConfigureUsage &&
            currentProvider &&
            onConfigureUsage(currentProvider)
          }
        >
          usage
        </button>
        <button
          onClick={() =>
            onOpenWebsite &&
            currentProvider &&
            onOpenWebsite("https://example.com")
          }
        >
          open-website
        </button>
        <button onClick={() => onCreate && onCreate()}>create</button>
      </div>
    );
  },
}));

vi.mock("@/components/providers/AddProviderDialog", () => ({
  AddProviderDialog: ({ open, onOpenChange, onSubmit, appId }: any) =>
    open ? (
      <div data-testid="add-provider-dialog">
        <button
          onClick={() =>
            onSubmit({
              name: `New ${appId} Provider`,
              settingsConfig: {},
              category: "custom",
              sortIndex: 99,
              settings_config: {
                provider: {
                  type: "custom",
                  apiKey: "sk-test-key",
                },
                env: {},
                config: {},
              },
            })
          }
        >
          confirm-add
        </button>
        <button onClick={() => onOpenChange(false)}>close-add</button>
      </div>
    ) : null,
}));

vi.mock("@/components/providers/EditProviderDialog", () => ({
  EditProviderDialog: ({ open, provider, onSubmit, onOpenChange }: any) =>
    open ? (
      <div data-testid="edit-provider-dialog">
        <button
          onClick={() =>
            onSubmit({
              ...provider,
              name: `${provider.name}-edited`,
              settingsConfig: {
                ...provider.settingsConfig,
                sortIndex: provider.sortIndex,
              },
            })
          }
        >
          confirm-edit
        </button>
        <button onClick={() => onOpenChange(false)}>close-edit</button>
      </div>
    ) : null,
}));

vi.mock("@/components/ConfirmDialog", () => ({
  ConfirmDialog: ({ isOpen, onConfirm, onCancel }: any) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <button onClick={() => onConfirm()}>confirm-delete</button>
        <button onClick={() => onCancel()}>cancel-delete</button>
      </div>
    ) : null,
}));

vi.mock("@/components/AppSwitcher", () => ({
  AppSwitcher: ({ activeApp, onSwitch }: any) => (
    <div data-testid="app-switcher">
      <span>{activeApp}</span>
      <button onClick={() => onSwitch("claude")}>switch-claude</button>
      <button onClick={() => onSwitch("codex")}>switch-codex</button>
      <button onClick={() => onSwitch("gemini")}>switch-gemini</button>
      <button onClick={() => onSwitch("opencode")}>switch-opencode</button>
    </div>
  ),
}));

vi.mock("@/components/UpdateBadge", () => ({
  UpdateBadge: () => <div data-testid="update-badge" />,
}));

vi.mock("@/components/mcp/McpPanel", () => ({
  default: ({ open, onOpenChange }: any) =>
    open ? (
      <div data-testid="mcp-panel">
        <button onClick={() => onOpenChange(false)}>close-mcp</button>
      </div>
    ) : (
      <button onClick={() => onOpenChange(true)}>open-mcp</button>
    ),
}));

const renderApp = (AppComponent: ComponentType) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <Suspense fallback={<div data-testid="loading">loading</div>}>
        <AppComponent />
      </Suspense>
    </QueryClientProvider>,
  );
};

describe("OpenCode Integration Tests", () => {
  beforeEach(() => {
    resetProviderState();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  describe("1. Basic OpenCode Provider Flow", () => {
    it("should add OpenCode provider successfully", async () => {
      const { default: App } = await import("@/App");
      renderApp(App);

      await waitFor(() =>
        expect(screen.getByTestId("provider-list").textContent).toContain(
          "claude-1",
        ),
      );

      fireEvent.click(screen.getByText("switch-opencode"));
      await waitFor(() =>
        expect(screen.getByTestId("app-switcher").textContent).toContain(
          "opencode",
        ),
      );

      fireEvent.click(screen.getByText("create"));
      expect(screen.getByTestId("add-provider-dialog")).toBeInTheDocument();

      fireEvent.click(screen.getByText("confirm-add"));

      await waitFor(() => {
        expect(screen.getByTestId("provider-list").textContent).toMatch(
          /New opencode Provider/,
        );
      });

      expect(toastSuccessMock).toHaveBeenCalled();

      const providers = getProviders("opencode");
      expect(Object.values(providers)).toHaveLength(1);
      const providerId = Object.keys(providers)[0];
      expect(providerId).toBeDefined();
      expect(providers[providerId]?.name).toBe("New opencode Provider");
    });

    it("should edit OpenCode provider", async () => {
      const { default: App } = await import("@/App");
      renderApp(App);

      fireEvent.click(screen.getByText("switch-opencode"));
      await waitFor(() =>
        expect(screen.getByTestId("app-switcher").textContent).toContain(
          "opencode",
        ),
      );

      fireEvent.click(screen.getByText("create"));
      fireEvent.click(screen.getByText("confirm-add"));

      await waitFor(() => {
        expect(screen.getByTestId("provider-list").textContent).toMatch(
          /New opencode Provider/,
        );
      });

      expect(toastSuccessMock).toHaveBeenCalled();
    });

    it("should delete OpenCode provider", async () => {
      const { default: App } = await import("@/App");
      renderApp(App);

      fireEvent.click(screen.getByText("switch-opencode"));
      await waitFor(() =>
        expect(screen.getByTestId("app-switcher").textContent).toContain(
          "opencode",
        ),
      );

      fireEvent.click(screen.getByText("create"));
      fireEvent.click(screen.getByText("confirm-add"));

      await waitFor(() => {
        expect(screen.getByTestId("provider-list").textContent).toMatch(
          /New opencode Provider/,
        );
      });

      fireEvent.click(screen.getByText("switch"));
      expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();

      fireEvent.click(screen.getByText("confirm-delete"));

      await waitFor(() => {
        const providers = getProviders("opencode");
        expect(Object.values(providers)).toHaveLength(0);
      });

      expect(toastSuccessMock).toHaveBeenCalled();
    });
  });

  describe("2. OpenCode Provider Switching", () => {
    it("should switch between OpenCode providers", async () => {
      const { default: App } = await import("@/App");
      renderApp(App);

      fireEvent.click(screen.getByText("switch-opencode"));
      await waitFor(() =>
        expect(screen.getByTestId("app-switcher").textContent).toContain(
          "opencode",
        ),
      );

      fireEvent.click(screen.getByText("create"));
      fireEvent.click(screen.getByText("confirm-add"));

      await waitFor(() => {
        expect(screen.getByTestId("provider-list").textContent).toMatch(
          /New opencode Provider/,
        );
      });

      fireEvent.click(screen.getByText("create"));
      fireEvent.click(screen.getByText("confirm-add"));

      await waitFor(() => {
        expect(screen.getByTestId("provider-list").textContent).toMatch(
          /New opencode Provider.*New opencode Provider/s,
        );
      });

      const providers = getProviders("opencode");
      expect(Object.values(providers)).toHaveLength(2);

      fireEvent.click(screen.getByText("switch"));

      await waitFor(() => {
        expect(toastSuccessMock).toHaveBeenCalledWith(
          expect.stringContaining("切换"),
        );
      });
    });

    it("should switch from other apps to OpenCode", async () => {
      const { default: App } = await import("@/App");
      renderApp(App);

      await waitFor(() =>
        expect(screen.getByTestId("provider-list").textContent).toContain(
          "claude-1",
        ),
      );

      fireEvent.click(screen.getByText("switch-codex"));
      await waitFor(() =>
        expect(screen.getByTestId("app-switcher").textContent).toContain(
          "codex",
        ),
      );

      fireEvent.click(screen.getByText("switch-opencode"));
      await waitFor(() =>
        expect(screen.getByTestId("app-switcher").textContent).toContain(
          "opencode",
        ),
      );

      const opencodeProviders = getProviders("opencode");
      expect(Object.values(opencodeProviders)).toHaveLength(0);
    });
  });

  describe("3. OpenCode Provider Duplication", () => {
    it("should duplicate OpenCode provider", async () => {
      const { default: App } = await import("@/App");
      renderApp(App);

      fireEvent.click(screen.getByText("switch-opencode"));
      await waitFor(() =>
        expect(screen.getByTestId("app-switcher").textContent).toContain(
          "opencode",
        ),
      );

      fireEvent.click(screen.getByText("create"));
      fireEvent.click(screen.getByText("confirm-add"));

      await waitFor(() => {
        expect(screen.getByTestId("provider-list").textContent).toMatch(
          /New opencode Provider/,
        );
      });

      fireEvent.click(screen.getByText("switch"));
      fireEvent.click(screen.getByText("duplicate"));

      await waitFor(() => {
        expect(screen.getByTestId("provider-list").textContent).toMatch(/copy/);
      });

      const providers = getProviders("opencode");
      expect(Object.values(providers)).toHaveLength(2);

      expect(toastSuccessMock).toHaveBeenCalled();
    });
  });

  describe("4. OpenCode Provider Events", () => {
    it("should handle provider-switched event for OpenCode", async () => {
      const { default: App } = await import("@/App");
      renderApp(App);

      fireEvent.click(screen.getByText("switch-opencode"));
      await waitFor(() =>
        expect(screen.getByTestId("app-switcher").textContent).toContain(
          "opencode",
        ),
      );

      fireEvent.click(screen.getByText("create"));
      fireEvent.click(screen.getByText("confirm-add"));

      await waitFor(() => {
        expect(screen.getByTestId("provider-list").textContent).toMatch(
          /New opencode Provider/,
        );
      });

      const providers = getProviders("opencode");
      const providerId = Object.keys(providers)[0];

      emitTauriEvent("provider-switched", {
        appType: "opencode",
        providerId,
      });

      await waitFor(() => {
        expect(screen.getByTestId("current-provider").textContent).toBe(
          providerId,
        );
      });

      expect(toastSuccessMock).toHaveBeenCalled();
    });
  });

  describe("5. Error Handling", () => {
    it("should handle add provider error gracefully", async () => {
      const { default: App } = await import("@/App");
      renderApp(App);

      fireEvent.click(screen.getByText("switch-opencode"));
      await waitFor(() =>
        expect(screen.getByTestId("app-switcher").textContent).toContain(
          "opencode",
        ),
      );

      fireEvent.click(screen.getByText("create"));
      expect(screen.getByTestId("add-provider-dialog")).toBeInTheDocument();

      fireEvent.click(screen.getByText("close-add"));

      expect(
        screen.queryByTestId("add-provider-dialog"),
      ).not.toBeInTheDocument();
    });

    it("should handle edit provider error gracefully", async () => {
      const { default: App } = await import("@/App");
      renderApp(App);

      fireEvent.click(screen.getByText("switch-opencode"));
      await waitFor(() =>
        expect(screen.getByTestId("app-switcher").textContent).toContain(
          "opencode",
        ),
      );

      fireEvent.click(screen.getByText("edit"));
      expect(
        screen.getByTestId("edit-provider-dialog"),
      ).not.toBeInTheDocument();
    });

    it("should handle delete provider cancellation", async () => {
      const { default: App } = await import("@/App");
      renderApp(App);

      fireEvent.click(screen.getByText("switch-opencode"));
      await waitFor(() =>
        expect(screen.getByTestId("app-switcher").textContent).toContain(
          "opencode",
        ),
      );

      fireEvent.click(screen.getByText("create"));
      fireEvent.click(screen.getByText("confirm-add"));

      await waitFor(() => {
        expect(screen.getByTestId("provider-list").textContent).toMatch(
          /New opencode Provider/,
        );
      });

      fireEvent.click(screen.getByText("switch"));
      expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();

      fireEvent.click(screen.getByText("cancel-delete"));

      expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();

      const providers = getProviders("opencode");
      expect(Object.values(providers)).toHaveLength(1);
    });
  });

  describe("6. Cross-App Integration", () => {
    it("should maintain separate provider states for each app", async () => {
      const { default: App } = await import("@/App");
      renderApp(App);

      await waitFor(() =>
        expect(screen.getByTestId("provider-list").textContent).toContain(
          "claude-1",
        ),
      );

      const claudeProviders = getProviders("claude");
      expect(Object.values(claudeProviders)).toHaveLength(2);

      fireEvent.click(screen.getByText("switch-opencode"));
      await waitFor(() =>
        expect(screen.getByTestId("app-switcher").textContent).toContain(
          "opencode",
        ),
      );

      const opencodeProviders = getProviders("opencode");
      expect(Object.values(opencodeProviders)).toHaveLength(0);

      fireEvent.click(screen.getByText("create"));
      fireEvent.click(screen.getByText("confirm-add"));

      await waitFor(() => {
        expect(screen.getByTestId("provider-list").textContent).toMatch(
          /New opencode Provider/,
        );
      });

      const updatedOpencodeProviders = getProviders("opencode");
      expect(Object.values(updatedOpencodeProviders)).toHaveLength(1);

      const updatedClaudeProviders = getProviders("claude");
      expect(Object.values(updatedClaudeProviders)).toHaveLength(2);
    });
  });
});
