import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Sparkles, FileText, Wand2 } from "lucide-react";
import AssistenteChatPage from "./AssistenteChatPage";
import { ClassificacaoTab } from "../governanca/tabs/ClassificacaoTab";
import { RelatoriosTab } from "../governanca/tabs/RelatoriosTab";
import ConversorDocumentosTab from "./ConversorDocumentosTab";

export default function AssistentePage() {
  const [tab, setTab] = useState("chat");
  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            <TabsTrigger value="chat" className="gap-1.5"><Bot className="h-3.5 w-3.5" /> Chat IA</TabsTrigger>
            <TabsTrigger value="classificacao" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Classificação IA</TabsTrigger>
            <TabsTrigger value="relatorios" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Relatórios Gerenciais</TabsTrigger>
            <TabsTrigger value="conversor" className="gap-1.5"><Wand2 className="h-3.5 w-3.5" /> Conversor de Documentos</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="chat" className="mt-4"><AssistenteChatPage /></TabsContent>
        <TabsContent value="classificacao" className="mt-4"><ClassificacaoTab /></TabsContent>
        <TabsContent value="relatorios" className="mt-4"><RelatoriosTab filters={{}} /></TabsContent>
        <TabsContent value="conversor" className="mt-4"><ConversorDocumentosTab /></TabsContent>
      </Tabs>
    </div>
  );
}
