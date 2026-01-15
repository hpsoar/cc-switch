import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useProviderActions } from "@/hooks/useProviderActions";
import type { Provider, UsageScript } from "@/types";

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

const invalidateQueriesMock = vi.fn();

vi.mock("@tanstack/react-query", async (importActual) => {
  const actual = await importActual<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: invalidateQueriesMock,
    }),
  };
});

const addMutateMock = vi.fn();
const updateMutateMock = vi.fn();
const deleteMutateMock = vi.fn();
const switchMutateMock = vi.fn();

vi.mock("@/lib/query", async () => {
  const actual = await vi.importActual<typeof import("@/lib/query")>(
    "@/lib/query",
  );
  return {
    ...actual,
    useAddProviderMutation: () => ({ mutateAsync: addMutateMock, isPending: false }),
    useUpdateProviderMutation: () => ({
      mutateAsync: updateMutateMock,
      isPending: false,
    }),
    useDeleteProviderMutation: () => ({
      mutateAsync: deleteMutateMock,
      isPending: false,
    }),
    useSwitchProviderMutation: () => ({
      mutateAsync: switchMutateMock,
      isPending: false,
    }),
  };
});

const updateTrayMenuMock = vi.fn();
const providersUpdateMock = vi.fn();
const settingsGetMock = vi.fn();
const applyPluginMock = vi.fn();

vi.mock("@/lib/api", () => ({
  providersApi: {
    updateTrayMenu: (...args: unknown[]) => updateTrayMenuMock(...args),
    update: (...args: unknown[]) => providersUpdateMock(...args),
  },
  settingsApi: {
    get: (...args: unknown[]) => settingsGetMock(...args),
    applyClaudePluginConfig: (...args: unknown[]) => applyPluginMock(...args),
  },
}));

const createProvider = (overrides: Partial<Provider> = {}): Provider => ({
  id: "provider-1",
  name: "Test Provider",
  app: "claude",
  settingsConfig: {},
  category: "custom",
  ...overrides,
});

const usageScript: UsageScript = {
  enabled: true,
  language: "javascript",
  code: "return 1",
};

describe("useProviderActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateTrayMenuMock.mockResolvedValue(undefined);
    providersUpdateMock.mockResolvedValue(undefined);
    settingsGetMock.mockResolvedValue({
      enableClaudePluginIntegration: true,
    });
    applyPluginMock.mockResolvedValue(undefined);
  });

  it("adds provider through mutation", async () => {
    addMutateMock.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useProviderActions("claude"));
    const newProvider = {
      name: "Added Provider",
      app: "claude",
      settingsConfig: {},
      category: "custom",
    } as Omit<Provider, "id">;

    await act(async () => {
      await result.current.addProvider(newProvider);
    });

    expect(addMutateMock).toHaveBeenCalledWith(newProvider);
  });

  it("updates provider and refreshes tray menu", async () => {
    updateMutateMock.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useProviderActions("claude"));
    const provider = createProvider();

    await act(async () => {
      await result.current.updateProvider(provider);
    });

    expect(updateMutateMock).toHaveBeenCalledWith(provider);
    expect(updateTrayMenuMock).toHaveBeenCalled();
  });

  it("switches provider and syncs Claude plugin when enabled", async () => {
    switchMutateMock.mockResolvedValueOnce({ success: true });
    const provider = createProvider({ id: "official", category: "official" });
    const { result } = renderHook(() => useProviderActions("claude"));

    await act(async () => {
      await result.current.switchProvider(provider);
    });

    expect(switchMutateMock).toHaveBeenCalledWith("official");
    expect(settingsGetMock).toHaveBeenCalled();
    expect(applyPluginMock).toHaveBeenCalledWith({ official: true });
  });

  it("does not sync plugin for non-Claude apps", async () => {
    switchMutateMock.mockResolvedValueOnce({ success: true });
    const provider = createProvider({ id: "other", app: "codex" });
    const { result } = renderHook(() => useProviderActions("codex"));

    await act(async () => {
      await result.current.switchProvider(provider);
    });

    expect(switchMutateMock).toHaveBeenCalledWith("other");
    expect(applyPluginMock).not.toHaveBeenCalled();
  });

  it("deletes provider via mutation", async () => {
    deleteMutateMock.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useProviderActions("claude"));

    await act(async () => {
      await result.current.deleteProvider("provider-1");
    });

    expect(deleteMutateMock).toHaveBeenCalledWith("provider-1");
  });

  it("saves usage script and invalidates cache", async () => {
    const { result } = renderHook(() => useProviderActions("claude"));

    await act(async () => {
      await result.current.saveUsageScript(createProvider(), usageScript);
    });

    expect(providersUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: { usage_script: usageScript },
      }),
      "claude",
    );
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["providers", "claude"],
    });
    expect(toastSuccessMock).toHaveBeenCalled();
  });

  it("shows error toast when usage script save fails", async () => {
    providersUpdateMock.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useProviderActions("claude"));

    await act(async () => {
      await result.current.saveUsageScript(createProvider(), usageScript);
    });

    expect(toastErrorMock).toHaveBeenCalled();
  });
});
