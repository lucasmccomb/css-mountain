import { describe, it, expect, vi, beforeEach } from "vitest";
import { authClient, type AuthState } from "../services/auth-client";
import { createGuestProgressStore } from "@css-mountain/core";
import { mergeGuestProgress } from "../services/sync-service";
import * as apiClient from "../services/api-client";

vi.mock("../services/api-client", () => ({
  authApi: {
    getMe: vi.fn(),
    getGoogleAuthUrl: vi.fn(() => "/api/auth/google"),
    getGitHubAuthUrl: vi.fn(() => "/api/auth/github"),
    logout: vi.fn(),
  },
  progressApi: {
    submit: vi.fn(),
  },
}));

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
});

describe("Auth Flow (Integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("full auth flow: guest -> check auth -> authenticated", async () => {
    const user = {
      id: "user-1",
      displayName: "Test User",
      email: "test@example.com",
      avatarUrl: "https://example.com/avatar.png",
      settings: {},
      createdAt: "2025-01-01T00:00:00Z",
    };

    // 1. Initial state is unknown
    let state = authClient.getCachedState();
    expect(state.status).toBe("unknown");

    // 2. Check auth returns authenticated
    vi.mocked(apiClient.authApi.getMe).mockResolvedValueOnce(user);
    state = await authClient.checkAuth();
    expect(state.status).toBe("authenticated");
    expect(state.user).toEqual(user);

    // 3. Cached state is now authenticated
    state = authClient.getCachedState();
    expect(state.status).toBe("authenticated");
  });

  it("guest flow: check auth -> guest (no session)", async () => {
    vi.mocked(apiClient.authApi.getMe).mockResolvedValueOnce(null);

    const state = await authClient.checkAuth();
    expect(state.status).toBe("guest");
    expect(state.user).toBeNull();
  });

  it("logout flow: authenticated -> logout -> guest", async () => {
    // Start authenticated
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

    // Logout
    vi.mocked(apiClient.authApi.logout).mockResolvedValueOnce(undefined);
    await authClient.logout();

    // State is cleared
    const state = authClient.getCachedState();
    expect(state.status).toBe("unknown");
  });

  it("merge-on-auth: guest progress merged when signing in", async () => {
    vi.mocked(apiClient.progressApi.submit).mockResolvedValue({
      success: true,
      isNewBest: true,
      challengeId: "c1",
    });

    // 1. Guest saves progress locally
    const guestStore = createGuestProgressStore();
    guestStore.save({
      challengeId: "test-c1",
      status: "completed",
      bestScore: 700,
      stars: 2,
      attempts: 3,
      bestSolution: "h1 { color: blue; }",
      hintsUsed: 1,
      solutionViewed: false,
      timeSpentMs: 45000,
      completedAt: "2025-01-01T00:00:00Z",
    });
    guestStore.save({
      challengeId: "test-c2",
      status: "completed",
      bestScore: 500,
      stars: 1,
      attempts: 1,
      bestSolution: ".box { display: flex; }",
      hintsUsed: 0,
      solutionViewed: false,
      timeSpentMs: 60000,
      completedAt: "2025-01-02T00:00:00Z",
    });

    // 2. Get merge payload
    const payload = guestStore.getMergePayload();
    expect(payload.progress).toHaveLength(2);
    expect(payload.mergeStrategy).toBe("upsert-keep-best");

    // 3. Merge to API
    const guestProgress = guestStore.loadAll();
    await mergeGuestProgress(guestProgress);

    expect(apiClient.progressApi.submit).toHaveBeenCalledTimes(2);
    expect(apiClient.progressApi.submit).toHaveBeenCalledWith(
      "test-c1",
      expect.objectContaining({ score: 700, stars: 2 }),
    );
    expect(apiClient.progressApi.submit).toHaveBeenCalledWith(
      "test-c2",
      expect.objectContaining({ score: 500, stars: 1 }),
    );

    // 4. Clear guest data after merge
    guestStore.clearAfterMerge();
    expect(guestStore.loadAll()).toEqual({});
  });

  it("auth state persists across page loads", async () => {
    const user = {
      id: "user-1",
      displayName: "Test",
      email: null,
      avatarUrl: null,
      settings: {},
      createdAt: "2025-01-01",
    };

    // First "page load" - authenticate
    vi.mocked(apiClient.authApi.getMe).mockResolvedValueOnce(user);
    await authClient.checkAuth();

    // Verify state was persisted
    const saved = mockStorage["css-mountain:auth-state"];
    expect(saved).toBeDefined();

    const parsed = JSON.parse(saved) as AuthState;
    expect(parsed.status).toBe("authenticated");
    expect(parsed.user?.id).toBe("user-1");

    // Second "page load" - read cached state
    const cached = authClient.getCachedState();
    expect(cached.status).toBe("authenticated");
  });
});
