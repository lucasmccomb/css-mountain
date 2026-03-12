import type { Env, OAuthUserInfo } from "../types";
import { getUserByAuth, createUser, updateUser } from "../db/queries";
import { initializeUserStats } from "../db/queries";

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token?: string;
}

interface GoogleUserInfo {
  sub: string;
  name: string;
  email?: string;
  picture?: string;
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUserInfo {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

const OAUTH_STATE_PREFIX = "oauth_state:";
const OAUTH_STATE_TTL = 300; // 5 minutes

export async function storeOAuthState(kv: KVNamespace, state: string): Promise<void> {
  await kv.put(`${OAUTH_STATE_PREFIX}${state}`, "1", {
    expirationTtl: OAUTH_STATE_TTL,
  });
}

export async function validateOAuthState(kv: KVNamespace, state: string): Promise<boolean> {
  const stored = await kv.get(`${OAUTH_STATE_PREFIX}${state}`);
  if (!stored) return false;
  await kv.delete(`${OAUTH_STATE_PREFIX}${state}`);
  return true;
}

export function generateOAuthState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getGoogleAuthUrl(env: Env, state: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${env.APP_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(env: Env, code: string): Promise<OAuthUserInfo> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${env.APP_URL}/api/auth/google/callback`,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Google token exchange failed: ${tokenResponse.status}`);
  }

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

  const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userResponse.ok) {
    throw new Error(`Google userinfo failed: ${userResponse.status}`);
  }

  const user = (await userResponse.json()) as GoogleUserInfo;

  return {
    provider: "google",
    authId: user.sub,
    displayName: user.name,
    email: user.email ?? null,
    avatarUrl: user.picture ?? null,
  };
}

export function getGitHubAuthUrl(env: Env, state: string): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${env.APP_URL}/api/auth/github/callback`,
    scope: "user:email",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeGitHubCode(env: Env, code: string): Promise<OAuthUserInfo> {
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${env.APP_URL}/api/auth/github/callback`,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`GitHub token exchange failed: ${tokenResponse.status}`);
  }

  const tokens = (await tokenResponse.json()) as GitHubTokenResponse;

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "CSS-Mountain",
    },
  });

  if (!userResponse.ok) {
    throw new Error(`GitHub user API failed: ${userResponse.status}`);
  }

  const user = (await userResponse.json()) as GitHubUserInfo;

  return {
    provider: "github",
    authId: String(user.id),
    displayName: user.name ?? user.login,
    email: user.email,
    avatarUrl: user.avatar_url,
  };
}

export async function upsertUser(db: D1Database, userInfo: OAuthUserInfo): Promise<string> {
  const existing = await getUserByAuth(db, userInfo.provider, userInfo.authId);

  if (existing) {
    await updateUser(db, existing.id, userInfo.displayName, userInfo.email, userInfo.avatarUrl);
    return existing.id;
  }

  const id = crypto.randomUUID();
  await createUser(
    db,
    id,
    userInfo.displayName,
    userInfo.email,
    userInfo.avatarUrl,
    userInfo.provider,
    userInfo.authId,
  );
  await initializeUserStats(db, id);
  return id;
}
