import { useEffect, useRef } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { processQueue, queueSize } from "@/lib/offlineQueue";
import { toast } from "sonner";

export function OfflineBanner() {
  const online = useOnlineStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      toast.warning("Você está offline", {
        description: "Mostrando dados em cache. Alterações serão sincronizadas quando voltar.",
      });
    } else if (wasOffline.current) {
      wasOffline.current = false;
      (async () => {
        const pending = await queueSize();
        if (pending > 0) {
          const r = await processQueue();
          toast.success("Conexão restaurada", {
            description: `Sincronizado: ${r.ok} • Falhas: ${r.fail}`,
          });
        } else {
          toast.success("Conexão restaurada");
        }
      })();
    }
  }, [online]);

  if (online) return null;
  return (
    <div className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs px-4 py-1.5 flex items-center gap-2">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Modo offline — exibindo dados em cache. As alterações serão enviadas quando a conexão voltar.</span>
    </div>
  );
}

export function OnlineDot() {
  const online = useOnlineStatus();
  return online ? (
    <Wifi className="w-3.5 h-3.5 text-emerald-500" aria-label="Online" />
  ) : (
    <WifiOff className="w-3.5 h-3.5 text-amber-500" aria-label="Offline" />
  );
}
