import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, KeyRound } from "lucide-react";
import RtsPessoasPage from "./RtsPessoasPage";
import CreaLoginsPage from "./CreaLoginsPage";

export default function RtsWithLoginsPage() {
  return (
    <Tabs defaultValue="pessoas" className="space-y-4">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="pessoas"><Users className="w-4 h-4 mr-1" /> Responsáveis Técnicos</TabsTrigger>
        <TabsTrigger value="logins"><KeyRound className="w-4 h-4 mr-1" /> Login</TabsTrigger>
      </TabsList>
      <TabsContent value="pessoas"><RtsPessoasPage /></TabsContent>
      <TabsContent value="logins"><CreaLoginsPage /></TabsContent>
    </Tabs>
  );
}
