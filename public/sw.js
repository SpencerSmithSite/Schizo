/**
 * Schizo service worker — app-shell cache strategy.
 *
 * On install:   pre-cache the app shell (HTML + hashed assets).
 * On fetch:     serve from cache first; fall back to network and update cache.
 * On activate:  delete stale caches from previous versions.
 *
 * The CACHE_VERSION constant is the only thing that needs bumping on a new
 * deploy to force users onto the latest shell.
 */

const CACHE_VERSION = "v1";
const CACHE_NAME = `schizo-${CACHE_VERSION}`;

// Static assets produced by Vite's build are fingerprinted (content-hashed),
// so we only need to pre-cache the root HTML. Everything else is cached on
// first access via the fetch handler below.
const PRECACHE_URLS = ["/"];

// ── Install ──────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("schizo-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests for same-origin resources
  if (request.method !== "GET") return;
  try {
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
  } catch {
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Only cache successful, non-opaque responses for same-origin assets
    if (response.ok && response.type === "basic") {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and not cached — return a minimal offline page for navigation
    if (request.mode === "navigate") {
      const offlineMatch = await caches.match("/");
      if (offlineMatch) return offlineMatch;
    }
    return new Response("Offline", { status: 503 });
  }
}
