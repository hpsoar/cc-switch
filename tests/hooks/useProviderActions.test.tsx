import { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useProviderActions } from "@/hooks/useProviderActions";
import type { Provider } from "@/types";

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

vi.mock("@/lib/query", () => ({
  useQueryClient: vi.fn(() => new QueryClient()),
}));

vi.mock("@/lib/state", () => ({
  useAppStore: vi.fn(() => ({
    app: "claude",
    setApp: vi.fn(),
  })),
}));

describe("useProviderActions - OpenCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addProvider", () => {
    it("should add OpenCode provider successfully", async () => {
      const wrapper = renderHook(() => useProviderActions());

      const mockProvider: Provider = {
        id: "test-opencode-provider",
        name: "Test OpenCode Provider",
        settings_config: {
          provider: {
            type: "custom",
            apiKey: "sk-test-key",
            baseUrl: "https://custom.api.com/v1",
            model: "custom-model",
          },
        },
        app: "opencode",
      };

      const { result, mutateAsync } = wrapper.result.current;

      vi.mocked(mutateAsync).mockResolvedValueOnce({
        success: true,
        provider: { ...mockProvider },
      });

      const result = await wrapper.result.current.addProvider(mockProvider);

      expect(result.success).toBe(true);
      expect(toastSuccessMock).toHaveBeenCalledWith("添加成功");
    });

    it("should handle add provider error", async () => {
      const wrapper = renderHook(() => useProviderActions());

      const mockProvider: Provider = {
        id: "test-opencode-provider",
        name: "Test OpenCode Provider",
        settings_config: {
          provider: {
            type: "custom",
            apiKey: "sk-test-key",
          },
        },
        app: "opencode",
      };

      const { mutateAsync } = wrapper.result.current;

      vi.mocked(mutateAsync).mockResolvedValueOnce({
        success: false,
        error: "Failed to add provider",
      });

      const result = await wrapper.result.current.addProvider(mockProvider);

      expect(result.success).toBe(false);
      expect(toastErrorMock).toHaveBeenCalledWith("添加失败");
    });
  });

  describe("updateProvider", () => {
    it("should update OpenCode provider successfully", async () => {
      const wrapper = renderHook(() => useProviderActions());

      const mockProvider: Provider = {
        id: "test-opencode-provider",
        name: "Updated OpenCode Provider",
        settings_config: {
          provider: {
            type: "custom",
            apiKey: "sk-updated-key",
            baseUrl: "https://updated.api.com/v1",
            model: "updated-model",
          },
        },
        app: "opencode",
      };

      const { mutateAsync } = wrapper.result.current;

      vi.mocked(mutateAsync).mockResolvedValueOnce({
        success: true,
      });

      const result = await wrapper.result.current.updateProvider(mockProvider);

      expect(result.success).toBe(true);
    });

    it("should handle update provider error", async () => {
      const wrapper = renderHook(() => useProviderActions());

      const mockProvider: Provider = {
        id: "test-opencode-provider",
        name: "Test OpenCode Provider",
        settings_config: {},
        app: "opencode",
      };

      const { mutateAsync } = wrapper.result.current;

      vi.mocked(mutateAsync).mockResolvedValueOnce({
        success: false,
        error: "Failed to update provider",
      });

      const result = await wrapper.result.current.updateProvider(mockProvider);

      expect(result.success).toBe(false);
      expect(toastErrorMock).toHaveBeenCalled();
    });
  });

  describe("deleteProvider", () => {
    it("should delete OpenCode provider successfully", async () => {
      const wrapper = renderHook(() => useProviderActions());

      const { mutateAsync } = wrapper.result.current;

      vi.mocked(mutateAsync).mockResolvedValueOnce({
        success: true,
      });

      const result =
        await wrapper.result.current.deleteProvider("test-opencode-id");

      expect(result.success).toBe(true);
      expect(toastSuccessMock).toHaveBeenCalledWith("删除成功");
    });

    it("should handle delete provider error", async () => {
      const wrapper = renderHook(() => useProviderActions());

      const { mutateAsync } = wrapper.result.current;

      vi.mocked(mutateAsync).mockResolvedValueOnce({
        success: false,
        error: "Failed to delete provider",
      });

      const result =
        await wrapper.result.current.deleteProvider("test-opencode-id");

      expect(result.success).toBe(false);
      expect(toastErrorMock).toHaveBeenCalled();
    });
  });

  describe("switchProvider", () => {
    it("should switch to OpenCode provider successfully", async () => {
      const wrapper = renderHook(() => useProviderActions());

      const { mutateAsync } = wrapper.result.current;

      vi.mocked(mutateAsync).mockResolvedValueOnce({
        success: true,
      });

      const result =
        await wrapper.result.current.switchProvider("test-opencode-id");

      expect(result.success).toBe(true);
      expect(toastSuccessMock).toHaveBeenCalledWith("切换成功");
    });

    it("should handle switch provider error", async () => {
      const wrapper = renderHook(() => useProviderActions());

      const { mutateAsync } = wrapper.result.current;

      vi.mocked(mutateAsync).mockResolvedValueOnce({
        success: false,
        error: "Failed to switch provider",
      });

      const result =
        await wrapper.result.current.switchProvider("test-opencode-id");

      expect(result.success).toBe(false);
      expect(toastErrorMock).toHaveBeenCalled();
    });
  });

  describe("integration with MSW handlers", () => {
    it("should call OpenCode specific handlers", async () => {
      const wrapper = renderHook(() => useProviderActions());

      const mockProvider: Provider = {
        id: "test-opencode-msw-provider",
        name: "MSW Test Provider",
        settings_config: {
          provider: {
            type: "custom",
            apiKey: "sk-msw-key",
          },
        },
        app: "opencode",
      };

      const { mutateAsync } = wrapper.result.current;

      // Mock the MSW handler response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await wrapper.result.current.addProvider(mockProvider);

      expect(result.success).toBe(true);
      global.fetch.mockRestore();
    });
  });
});
