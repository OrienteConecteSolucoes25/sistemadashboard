import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { buildCatalog } from "@/acl/catalog";
import { useIsInternalOcs } from "@/acl/AclProvider";

/**
 * Sincroniza o catálogo de permissões (módulos/abas/sub-abas declarados em
 * `src/acl/catalog.ts`) com a tabela `acl_permissions_catalog`.
 *
 * - Insere chaves novas (ex.: módulo ou aba recém-criada).
 * - Atualiza label/descrição/ordem das existentes.
 * - Mostra o total registrado e roda automaticamente ao abrir a página
 *   para usuários internos OCS.
 */
export default function CatalogSyncCard() {
  const isInternal = useIsInternalOcs();
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const expected = buildCatalog();

  const refreshCount = async () => {
    const { count: c } = await (supabase as any)
      .from("acl_permissions_catalog")
      .select("*", { count: "exact", head: true })
      .eq("ativo", true);
    setCount(c ?? 0);
  };

  const sync = async (silent = false) => {
    if (!isInternal) return;
    setBusy(true);
    const rows = expected.map((e) => ({
      key: e.key,
      module: e.module,
      resource: e.resource,
      action: e.action,
      label: e.label,
      description: e.description ?? null,
      ordem: e.ordem,
      ativo: true,
    }));
    const { error } = await (supabase as any)
      .from("acl_permissions_catalog")
      .upsert(rows, { onConflict: "key" });
    setBusy(false);
    if (error) {
      if (!silent) toast.error("Falha ao sincronizar catálogo: " + error.message);
      return;
    }
    setLastSync(new Date().toLocaleTimeString("pt-BR"));
    await refreshCount();
    if (!silent) toast.success(`Catálogo sincronizado (${rows.length} permissões).`);
  };

  useEffect(() => {
    refreshCount();
    if (isInternal) sync(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInternal]);

  return (
    <Card>
      <CardContent className="py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" /> Catálogo de permissões
          </div>
          <div className="text-xs text-muted-foreground">
            {count ?? "…"} permissões registradas · {expected.length} esperadas pelo código
            {lastSync && <> · sincronizado às {lastSync}</>}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Toda nova aba/sub-aba registrada em <code>src/acl/catalog.ts</code> aparece aqui automaticamente
            para o admin liberar por usuário.
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => sync()} disabled={!isInternal || busy}>
          <RefreshCw className={`w-4 h-4 mr-1 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Sincronizando…" : "Sincronizar agora"}
        </Button>
      </CardContent>
    </Card>
  );
}
