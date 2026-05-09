import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Check, X, Megaphone, MessageSquare, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type Action = "submit" | "approve" | "reject" | "publish" | "comment" | "revise";

const STATUS_COLORS: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  rascunho_ia: "bg-muted text-muted-foreground",
  em_revisao: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  aprovado: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  reprovado: "bg-destructive/15 text-destructive",
  agendado: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  publicado: "bg-primary/20 text-primary",
};

const ACTION_LABEL: Record<Action, string> = {
  submit: "Enviar para revisão",
  approve: "Aprovar",
  reject: "Reprovar",
  publish: "Publicar",
  revise: "Solicitar revisão",
  comment: "Comentar",
};

/**
 * Painel de aprovação reutilizável para qualquer entidade de Comunicação.
 * Renderiza badge de status + linha do tempo + ações conforme permissão.
 */
export function ApprovalPanel({
  entidadeTipo,
  entidadeId,
  status,
  onChanged,
  compact = false,
}: {
  entidadeTipo: string;
  entidadeId: string;
  status: string | null | undefined;
  onChanged?: (newStatus: string) => void;
  compact?: boolean;
}) {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<Action | null>(null);

  async function load() {
    const { data } = await supabase
      .from("comm_approvals")
      .select("*")
      .eq("entidade_tipo", entidadeTipo)
      .eq("entidade_id", entidadeId)
      .order("created_at", { ascending: true });
    setTimeline(data ?? []);
  }
  useEffect(() => {
    if (entidadeId) load();
  }, [entidadeId, entidadeTipo]);

  async function run(action: Action) {
    if ((action === "reject" || action === "comment") && !comment.trim()) {
      toast.error("Escreva um comentário/motivo.");
      return;
    }
    setBusy(action);
    try {
      const { data, error } = await supabase.rpc("comm_workflow_transition", {
        _entidade_tipo: entidadeTipo,
        _entidade_id: entidadeId,
        _action: action,
        _comentario: comment.trim() || null,
      });
      if (error) throw error;
      const r: any = data;
      if (!r?.ok) throw new Error(r?.error ?? "Erro desconhecido");
      toast.success(ACTION_LABEL[action] + " ✓");
      setComment("");
      await load();
      onChanged?.(r.status);
    } catch (e: any) {
      toast.error(e.message ?? "Falha no workflow");
    } finally {
      setBusy(null);
    }
  }

  const cur = status ?? "rascunho";
  const canSubmit = ["rascunho", "rascunho_ia", "reprovado"].includes(cur);
  const canApproveReject = ["em_revisao", "rascunho", "rascunho_ia"].includes(cur);
  const canPublish = ["aprovado", "agendado"].includes(cur);

  return (
    <Card className={compact ? "p-3 space-y-2" : "p-4 space-y-3"}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase text-muted-foreground font-display">Status</span>
          <Badge className={STATUS_COLORS[cur] ?? "bg-muted"}>{cur.replace("_", " ")}</Badge>
        </div>
        <span className="text-[10px] text-muted-foreground">v{timeline.length || 1}</span>
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentário (obrigatório para reprovar/comentar)..."
        rows={2}
        className="text-xs"
      />

      <div className="flex flex-wrap gap-1.5">
        {canSubmit && (
          <Button size="sm" variant="default" disabled={busy !== null} onClick={() => run("submit")}>
            {busy === "submit" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
            Enviar p/ revisão
          </Button>
        )}
        {canApproveReject && (
          <>
            <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700" disabled={busy !== null} onClick={() => run("approve")}>
              {busy === "approve" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
              Aprovar
            </Button>
            <Button size="sm" variant="destructive" disabled={busy !== null} onClick={() => run("reject")}>
              {busy === "reject" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
              Reprovar
            </Button>
          </>
        )}
        {canPublish && (
          <Button size="sm" variant="default" className="bg-primary" disabled={busy !== null} onClick={() => run("publish")}>
            {busy === "publish" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Megaphone className="h-3 w-3 mr-1" />}
            Publicar
          </Button>
        )}
        {cur === "em_revisao" && (
          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => run("revise")}>
            <RotateCcw className="h-3 w-3 mr-1" /> Reabrir
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => run("comment")}>
          <MessageSquare className="h-3 w-3 mr-1" /> Comentar
        </Button>
      </div>

      {timeline.length > 0 && (
        <ScrollArea className="max-h-40 border-t pt-2">
          <div className="space-y-1.5">
            {timeline.map((t) => (
              <div key={t.id} className="text-[11px] flex items-start gap-2">
                <Badge variant="outline" className={STATUS_COLORS[t.status] ?? ""}>
                  {t.status.replace("_", " ")}
                </Badge>
                <div className="flex-1 min-w-0">
                  {t.comentario && <div className="break-words">{t.comentario}</div>}
                  <div className="text-muted-foreground text-[10px]">
                    {new Date(t.created_at).toLocaleString("pt-BR")} · v{t.versao}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
