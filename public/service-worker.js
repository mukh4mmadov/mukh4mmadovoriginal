const CACHE_NAME = "muhammadov-ielts-offline-v4";
const OFFLINE_PAGE = "/offline.html";
const OFFLINE_STATUS = "/__offline-status__";

self.addEventListener("message", (event) => {
  if (event.data?.type !== "NETWORK_STATUS" && event.data?.type !== "CLEAR_OFFLINE") return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (event.data.type === "NETWORK_STATUS") {
      if (event.data.online === false) {
        await cache.put(OFFLINE_STATUS, new Response("offline"));
      }
    } else {
      await cache.delete(OFFLINE_STATUS);
    }
    event.ports?.[0]?.postMessage({ ok: true });
  })());
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_PAGE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("muhammadov-ielts-offline-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const offlinePage = async () => {
      const cachedPage = await caches.match(OFFLINE_PAGE);
      return cachedPage || new Response(
        "You are offline. Reconnect, then retry to continue your reading practice.",
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
    };

    const cache = await caches.open(CACHE_NAME);
    const forcedOffline = await cache.match(OFFLINE_STATUS);
    if (forcedOffline || !self.navigator.onLine) return offlinePage();

    try {
      return await fetch(event.request, { cache: "no-store" });
    } catch {
      return offlinePage();
    }
  })());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch {
    payload = { body: event.data?.text() || "Your reading practice is ready when you are." };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "IELTS Reading practice", {
      body: payload.body || "It's been a while since your last practice. Continue whenever you're ready.",
      data: { url: payload.url || "/reading" },
      tag: "study-reminder",
      renotify: false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/reading", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => client.url.startsWith(self.location.origin));
      if (existingClient) {
        return existingClient.navigate(targetUrl).then(() => existingClient.focus());
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
