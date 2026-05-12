// Cleanup de Service Worker legado.
// O modo offline foi desativado temporariamente para estabilizar navegação e preview.

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker
    .getRegistrations()
    .then(async (registrations) => {
      await Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)));

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName).catch(() => false)));
      }
    })
    .catch(() => {
      // noop
    });
}
