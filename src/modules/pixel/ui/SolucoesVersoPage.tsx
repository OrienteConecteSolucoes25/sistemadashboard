import { useLocation, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, User } from "lucide-react";
import PixelOfficePage from "./PixelOfficePage";
import MyCharacterPage from "./MyCharacterPage";

/**
 * Soluções-Verso — antigo "Pixel Office".
 * Reúne em abas o Escritório virtual e a edição do Meu Personagem.
 */
export default function SolucoesVersoPage() {
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const tab =
    pathname.endsWith("/meu-personagem") || params.get("tab") === "meu-personagem"
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
          Universo virtual da Comunidade OCS — escritório, personagens e interações em tempo real.
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
        </TabsList>

        <TabsContent value="escritorio" className="mt-0">
          <PixelOfficePage />
        </TabsContent>
        <TabsContent value="meu-personagem" className="mt-0">
          <MyCharacterPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
