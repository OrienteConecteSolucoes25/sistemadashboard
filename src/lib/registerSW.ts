// Registro guardado do Service Worker.
// Não registra em: dev, dentro de iframe, hosts de preview do Lovable.
// Em ambientes bloqueados, faz cleanup de SWs antigos para evitar cache travado.

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const isDev = import.meta.env.DEV;
  const inIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("preview--") ||
    host.endsWith(".lovableproject.com") ||
    host.endsWith(".lovableproject-dev.com");

  if (isDev || inIframe || isPreviewHost) {
    // Cleanup de qualquer SW residual
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister().catch(() => {}));
    });
    return;
  }

  // Carrega o registrador gerado pelo vite-plugin-pwa
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onRegisteredSW(_swUrl, reg) {
          // Checa por updates a cada 30 min
          if (reg) {
            setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
          }
        },
        onNeedRefresh() {
          // Atualização silenciosa — auto-update já configurado
        },
        onOfflineReady() {
          console.info("[PWA] App pronto para uso offline.");
        },
      });
    })
    .catch(() => {
      /* virtual module ausente em alguns builds — ignorar */
    });
}
