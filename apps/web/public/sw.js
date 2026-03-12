/**
 * CSS Mountain Service Worker
 *
 * Offline Tier 1: Cache the app shell and seed challenge data
 * so the game is playable offline with locally stored progress.
 *
 * Strategy:
 * - App shell (HTML, JS, CSS, fonts): Cache-first, update in background
 * - API requests: Network-first, fall back to cache
 * - Challenge content: Cache on first load
 */

const CACHE_NAME = "css-mountain-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/fonts/PxPlus_IBM_VGA8.woff2",
];

// ── Install: Pre-cache app shell ────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate: Clean up old caches ───────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch: Route-specific caching strategies ────────────────────────────────

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip cross-origin requests (OAuth redirects, etc.)
  if (url.origin !== self.location.origin) return;

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // App shell and static assets: cache-first with network update
  event.respondWith(cacheFirst(event.request));
});

// ── Cache strategies ────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Update cache in background
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
        }
      })
      .catch(() => {
        // Network unavailable, cached version is fine
      });
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and not cached - return a basic offline page
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    return new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
