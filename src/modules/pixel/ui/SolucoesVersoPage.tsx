import { useLocation, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, User, Shield } from "lucide-react";
import PixelOfficePage from "./PixelOfficePage";
import MyCharacterPage from "./MyCharacterPage";
import PixelAdminPage from "./admin/PixelAdminPage";
import { usePlanosAccess } from "@/modules/planos/hooks/usePlanosAccess";

/**
 * Soluções-Verso — antigo "Pixel Office".
 * Reúne em abas o Escritório virtual, edição do Meu Personagem e Admin (OCS staff).
 */
export default function SolucoesVersoPage() {
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const { isOcsStaff } = usePlanosAccess();

  const tab = pathname.endsWith("/admin") || params.get("tab") === "admin"
    ? "admin"
    : pathname.endsWith("/meu-personagem") || params.get("tab") === "meu-personagem"
    ? "meu-personagem"
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
          <TabsTrigger value="meu-personagem" className="gap-2">
            <User className="w-4 h-4" /> Meu Personagem
          </TabsTrigger>
          {isOcsStaff && (
            <TabsTrigger value="admin" className="gap-2">
              <Shield className="w-4 h-4" /> Admin
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="escritorio" className="mt-0">
          <PixelOfficePage />
        </TabsContent>
        <TabsContent value="meu-personagem" className="mt-0">
          <MyCharacterPage />
        </TabsContent>
        {isOcsStaff && (
          <TabsContent value="admin" className="mt-0">
            <PixelAdminPage />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
