/**
 * OAuth flow client for Google and GitHub authentication.
 *
 * Handles redirecting to the auth URL and processing the callback.
 * Session tokens are stored as HttpOnly cookies by the API, so we
 * only track auth status client-side.
 */

import { authApi, type UserInfo } from "./api-client";

/** localStorage key for auth state */
const AUTH_STATE_KEY = "css-mountain:auth-state";

/** Possible auth states */
export type AuthStatus = "unknown" | "authenticated" | "guest";

/** Auth provider options */
export type AuthProvider = "google" | "github";

export interface AuthState {
  status: AuthStatus;
  user: UserInfo | null;
}

// ── State persistence ───────────────────────────────────────────────────────

function saveAuthState(state: AuthState): void {
  try {
    localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

function loadAuthState(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STATE_KEY);
    if (raw) {
      return JSON.parse(raw) as AuthState;
    }
  } catch {
    // Parse error or localStorage unavailable
  }
  return { status: "unknown", user: null };
}

function clearAuthState(): void {
  try {
    localStorage.removeItem(AUTH_STATE_KEY);
  } catch {
    // localStorage unavailable
  }
}

// ── Auth client ─────────────────────────────────────────────────────────────

export const authClient = {
  /**
   * Check if the user is currently authenticated by calling /auth/me.
   * Updates the cached auth state.
   */
  async checkAuth(): Promise<AuthState> {
    try {
      const user = await authApi.getMe();
      if (user) {
        const state: AuthState = { status: "authenticated", user };
        saveAuthState(state);
        return state;
      }
    } catch {
      // Network error or API failure - fall through to guest
    }

    const state: AuthState = { status: "guest", user: null };
    saveAuthState(state);
    return state;
  },

  /**
   * Get the cached auth state without making a network request.
   * Returns "unknown" if no cached state exists.
   */
  getCachedState(): AuthState {
    return loadAuthState();
  },

  /**
   * Start the OAuth login flow by redirecting to the provider.
   * The API handles the OAuth state/CSRF token generation.
   */
  login(provider: AuthProvider): void {
    const url =
      provider === "google"
        ? authApi.getGoogleAuthUrl()
        : authApi.getGitHubAuthUrl();

    // Redirect to the API's OAuth initiation endpoint.
    // The API generates the state parameter and redirects to the provider.
    window.location.href = url;
  },

  /**
   * Log out the current user.
   * Clears the session cookie and local state.
   */
  async logout(): Promise<void> {
    try {
      await authApi.logout();
    } catch {
      // Even if logout API fails, clear local state
    }
    clearAuthState();
  },

  /**
   * Check if the current page is a post-OAuth redirect.
   * After successful auth, the API redirects to APP_URL.
   * We detect this by checking for the session cookie via /auth/me.
   */
  isPostAuthRedirect(): boolean {
    // The API redirects to the app URL after successful OAuth.
    // We detect this by checking if we just came from an auth flow.
    // The referrer check helps distinguish from normal page loads.
    const referrer = document.referrer;
    return (
      referrer.includes("accounts.google.com") ||
      referrer.includes("github.com/login")
    );
  },
};
