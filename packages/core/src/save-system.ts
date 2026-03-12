import type { PlayerProfile, PlayerSettings, ChallengeProgress } from "./types";
import { DEFAULT_SETTINGS } from "./state/settings-store";

/** localStorage key prefix */
const STORAGE_PREFIX = "css-mountain";

/** Storage keys */
const KEYS = {
  profile: `${STORAGE_PREFIX}:profile`,
  settings: `${STORAGE_PREFIX}:settings`,
  progress: `${STORAGE_PREFIX}:progress`,
} as const;

/**
 * Default player profile for new/guest players.
 */
export function createDefaultProfile(): PlayerProfile {
  return {
    userId: null,
    displayName: "Guest",
    avatarUrl: null,
    currentZone: "junior",
    totalStars: 0,
    totalScore: 0,
    challengeProgress: {},
    achievements: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

/**
 * Safely write to localStorage, catching quota errors.
 * Returns true on success, false if storage is full.
 */
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    // QuotaExceededError or SecurityError (incognito mode, etc.)
    return false;
  }
}

/**
 * Safely read from localStorage.
 * Returns null if the key doesn't exist or access is denied.
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Save the full player profile to localStorage.
 */
export function saveProfile(profile: PlayerProfile): boolean {
  return safeSetItem(KEYS.profile, JSON.stringify(profile));
}

/**
 * Load the player profile from localStorage.
 * Returns a default profile if nothing is saved.
 */
export function loadProfile(): PlayerProfile {
  const raw = safeGetItem(KEYS.profile);
  if (!raw) return createDefaultProfile();

  try {
    const parsed = JSON.parse(raw) as PlayerProfile;
    // Merge with defaults to handle new fields added in updates
    return {
      ...createDefaultProfile(),
      ...parsed,
      settings: {
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
      },
    };
  } catch {
    return createDefaultProfile();
  }
}

/**
 * Save player settings to localStorage.
 */
export function saveSettings(settings: PlayerSettings): boolean {
  return safeSetItem(KEYS.settings, JSON.stringify(settings));
}

/**
 * Load player settings from localStorage.
 */
export function loadSettings(): PlayerSettings {
  const raw = safeGetItem(KEYS.settings);
  if (!raw) return { ...DEFAULT_SETTINGS };

  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save challenge progress to localStorage.
 */
export function saveProgress(
  progress: Record<string, ChallengeProgress>
): boolean {
  return safeSetItem(KEYS.progress, JSON.stringify(progress));
}

/**
 * Load challenge progress from localStorage.
 */
export function loadProgress(): Record<string, ChallengeProgress> {
  const raw = safeGetItem(KEYS.progress);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Record<string, ChallengeProgress>;
  } catch {
    return {};
  }
}

/**
 * Check if there is any saved data in localStorage.
 */
export function hasSavedData(): boolean {
  return safeGetItem(KEYS.profile) !== null;
}

/**
 * Clear all saved data from localStorage.
 */
export function clearAllData(): void {
  try {
    localStorage.removeItem(KEYS.profile);
    localStorage.removeItem(KEYS.settings);
    localStorage.removeItem(KEYS.progress);
  } catch {
    // Silently ignore if localStorage is unavailable
  }
}
