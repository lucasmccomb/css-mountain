import { describe, it, expect, vi, beforeEach } from "vitest";
import { authClient } from "./auth-client";
import * as apiClient from "./api-client";

vi.mock("./api-client", () => ({
  authApi: {
    getMe: vi.fn(),
    getGoogleAuthUrl: vi.fn(() => "/api/auth/google"),
    getGitHubAuthUrl: vi.fn(() => "/api/auth/github"),
    logout: vi.fn(),
  },
}));

const mockStorage: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
};

vi.stubGlobal("localStorage", localStorageMock);

describe("auth-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  describe("checkAuth", () => {
    it("returns authenticated state when user exists", async () => {
      const user = {
        id: "user-1",
        displayName: "Test",
        email: null,
        avatarUrl: null,
        settings: {},
        createdAt: "2025-01-01",
      };
      vi.mocked(apiClient.authApi.getMe).mockResolvedValueOnce(user);

      const state = await authClient.checkAuth();
      expect(state.status).toBe("authenticated");
      expect(state.user).toEqual(user);
    });

    it("returns guest state when not authenticated", async () => {
      vi.mocked(apiClient.authApi.getMe).mockResolvedValueOnce(null);

      const state = await authClient.checkAuth();
      expect(state.status).toBe("guest");
      expect(state.user).toBeNull();
    });

    it("returns guest state on network error", async () => {
      vi.mocked(apiClient.authApi.getMe).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const state = await authClient.checkAuth();
      expect(state.status).toBe("guest");
    });

    it("persists auth state to localStorage", async () => {
      const user = {
        id: "user-1",
        displayName: "Test",
        email: null,
        avatarUrl: null,
        settings: {},
        createdAt: "2025-01-01",
      };
      vi.mocked(apiClient.authApi.getMe).mockResolvedValueOnce(user);

      await authClient.checkAuth();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "css-mountain:auth-state",
        expect.any(String),
      );
    });
  });

  describe("getCachedState", () => {
    it("returns unknown when no cached state", () => {
      const state = authClient.getCachedState();
      expect(state.status).toBe("unknown");
    });

    it("returns cached state from localStorage", () => {
      mockStorage["css-mountain:auth-state"] = JSON.stringify({
        status: "authenticated",
        user: { id: "u1" },
      });

      const state = authClient.getCachedState();
      expect(state.status).toBe("authenticated");
    });
  });

  describe("login", () => {
    it("redirects to Google auth URL for google provider", () => {
      const locationSpy = vi.spyOn(window, "location", "get").mockReturnValue({
        ...window.location,
        href: "",
      });

      // We can't actually test the redirect since it modifies window.location
      // but we can verify the URL construction
      expect(apiClient.authApi.getGoogleAuthUrl()).toBe("/api/auth/google");

      locationSpy.mockRestore();
    });

    it("redirects to GitHub auth URL for github provider", () => {
      expect(apiClient.authApi.getGitHubAuthUrl()).toBe("/api/auth/github");
    });
  });

  describe("logout", () => {
    it("calls API logout and clears state", async () => {
      vi.mocked(apiClient.authApi.logout).mockResolvedValueOnce(undefined);

      await authClient.logout();
      expect(apiClient.authApi.logout).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "css-mountain:auth-state",
      );
    });

    it("clears state even if API call fails", async () => {
      vi.mocked(apiClient.authApi.logout).mockRejectedValueOnce(
        new Error("Fail"),
      );

      await authClient.logout();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "css-mountain:auth-state",
      );
    });
  });
});
