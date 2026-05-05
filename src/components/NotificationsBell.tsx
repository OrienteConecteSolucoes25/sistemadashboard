import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInternalNotifications } from "@/modules/engenharia/hooks/useInternalNotifications";

const TIPO_ICON: Record<string, string> = {
  prazo: "⏰", status: "🔁", vinculo: "🔗", tarefa: "📝", info: "ℹ️",
};

export function NotificationsBell() {
  const { items, unread, markRead, markAllRead } = useInternalNotifications(30);
  const navigate = useNavigate();

  const onClick = async (id: string, route: string | null) => {
    await markRead(id);
    if (route) navigate(route);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Notificações"
          className="relative h-9 w-9 rounded-full bg-card border shadow-sm flex items-center justify-center hover:bg-accent transition"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]" variant="destructive">
              {unread > 99 ? "99+" : unread}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-3 py-2 border-b text-sm font-semibold flex items-center justify-between">
          <span>Notificações</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{items.length} item(ns)</span>
            {unread > 0 && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => markAllRead()}>
                <CheckCheck className="h-3 w-3 mr-1" /> marcar todas
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-80">
          {items.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Nada pendente por aqui ✨
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id} className={n.lida ? "opacity-60" : ""}>
                  <button
                    type="button"
                    onClick={() => onClick(n.id, n.route)}
                    className="w-full text-left p-3 text-xs hover:bg-muted/60 transition-colors focus:outline-none"
                  >
                    <div className="font-medium leading-snug flex items-start gap-2">
                      <span>{TIPO_ICON[n.tipo] ?? "•"}</span>
                      <span className="flex-1">{n.titulo}</span>
                      {!n.lida && <span className="h-2 w-2 rounded-full bg-primary mt-1" />}
                    </div>
                    {n.detalhe && <div className="text-muted-foreground mt-0.5 ml-5">{n.detalhe}</div>}
                    {n.modulo && (
                      <div className="text-[10px] text-primary mt-1 ml-5">
                        {n.modulo} {n.route && "→"}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
