import { useLocation, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, User, Shield, Sparkles, Settings2 } from "lucide-react";
import PixelOfficePage from "./PixelOfficePage";
import MyCharacterPage from "./MyCharacterPage";
import PixelAdminPage from "./admin/PixelAdminPage";
import MeusAgentesPage from "./MeusAgentesPage";
import ConfigurarAgentesPage from "./ConfigurarAgentesPage";
import { usePlanosAccess } from "@/modules/planos/hooks/usePlanosAccess";

/**
 * Soluções-Verso — antigo "Pixel Office".
 * Reúne em abas o Escritório, Meus Agentes, Meu Personagem e Admin (OCS staff).
 */
export default function SolucoesVersoPage() {
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const { isOcsStaff } = usePlanosAccess();

  const q = params.get("tab");
  const tab =
    pathname.endsWith("/admin") || q === "admin" ? "admin"
    : pathname.endsWith("/meu-personagem") || q === "meu-personagem" ? "meu-personagem"
    : q === "agentes" ? "agentes"
    : q === "configurar-agentes" ? "configurar-agentes"
    : "escritorio";

  const setTab = (v: string) => {
    if (v === "escritorio") params.delete("tab");
    else params.set("tab", v);
    setParams(params, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Soluções-Verso</h1>
        <p className="text-sm text-muted-foreground">
          Escritório digital interligado com funcionários, integrações e agentes virtuais.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="escritorio" className="gap-2">
            <Gamepad2 className="w-4 h-4" /> Escritório
          </TabsTrigger>
          <TabsTrigger value="agentes" className="gap-2">
            <Sparkles className="w-4 h-4" /> Meus Agentes
          </TabsTrigger>
          <TabsTrigger value="meu-personagem" className="gap-2">
            <User className="w-4 h-4" /> Meu Personagem
          </TabsTrigger>
          {isOcsStaff && (
            <TabsTrigger value="configurar-agentes" className="gap-2">
              <Settings2 className="w-4 h-4" /> Configurar Agentes
            </TabsTrigger>
          )}
          {isOcsStaff && (
            <TabsTrigger value="admin" className="gap-2">
              <Shield className="w-4 h-4" /> Admin
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="escritorio" className="mt-0"><PixelOfficePage /></TabsContent>
        <TabsContent value="agentes" className="mt-0"><MeusAgentesPage /></TabsContent>
        <TabsContent value="meu-personagem" className="mt-0"><MyCharacterPage /></TabsContent>
        {isOcsStaff && (
          <TabsContent value="configurar-agentes" className="mt-0"><ConfigurarAgentesPage /></TabsContent>
        )}
        {isOcsStaff && (
          <TabsContent value="admin" className="mt-0"><PixelAdminPage /></TabsContent>
        )}
      </Tabs>
    </div>
  );
}
