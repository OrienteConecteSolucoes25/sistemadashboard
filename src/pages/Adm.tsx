import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AclPermissionsForm from "@/acl/AclPermissionsForm";
import { usePlanosAccess } from "@/modules/planos/hooks/usePlanosAccess";
import { useCan } from "@/acl/AclProvider";

type Profile = { id: string; email: string | null; full_name: string | null };


const Adm = () => {
  const { isAdmin, loading } = useAuth();
  const { isOcsStaff, checking } = usePlanosAccess();
  // Leva 3: aceita também via ACL central
  const canAdmVis = useCan("adm.visibilidade.visualizar");
  if (loading || checking) return null;
  // Equipe OCS (legado) OU usuário com permissão ACL central
  if (!(isOcsStaff || canAdmVis) && !isAdmin) return <Navigate to="/app" replace />;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">ADM — Controle de Visibilidade</h1>
        <p className="text-sm text-muted-foreground">
          Defina quais usuários veem as mesmas coisas, em quais módulos.
        </p>
      </div>
      <PermissoesTab />
    </div>
  );
};

// Componentes de abas removidos (GruposTab, UsuariosTab, BulkTab) em favor apenas das permissões centrais.

// ===== Permissões centrais (ACL) =====
const PermissoesTab = () => {
  const [companies, setCompanies] = useState<{ id: string; nome: string }[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  useEffect(() => {
    (supabase as any).from("companies").select("id,nome").eq("ativo", true).order("nome").then(({ data }: any) => {
      setCompanies(data || []);
    });
  }, []);
  return (
    <div className="space-y-3 mt-4">
      <Card>
        <CardContent className="py-3 flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <Label>Escopo</Label>
            <Select value={companyId || "__global__"} onValueChange={(v) => setCompanyId(v === "__global__" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__global__">Global (vale para todas as empresas)</SelectItem>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground flex-1 min-w-[260px]">
            <strong>Modelo único de permissões:</strong> escolha o escopo (global ou empresa), selecione o usuário e marque as permissões (Ver / Editar / Excluir / Acessar) por recurso.
            Apenas funcionários internos OCS podem alterar.
          </p>
        </CardContent>
      </Card>
      <AclPermissionsForm companyId={companyId || null} />
    </div>
  );
};

export default Adm;

