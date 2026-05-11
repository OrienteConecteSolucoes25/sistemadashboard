import { Outlet } from "react-router-dom";
import {
  LayoutDashboard, FileSignature, FileStack, Users, Building2, KeyRound, ScrollText,
  Award, FileMinus, FolderOpen, MessageSquare, BookOpen, CalendarClock, Bot, Link as LinkIcon, ShieldCheck, HardHat, Settings, Gauge, Receipt
} from "lucide-react";
import { useMemo } from "react";
import { CollapsibleModuleSidebar } from "@/modules/aparencia/ui/CollapsibleModuleSidebar";
import { useCan } from "@/acl/AclProvider";

const allTabs = [
  { to: "/app/crea", label: "Dashboard", icon: LayoutDashboard, end: true, group: "Visão geral", moduleKey: "crea.base" },
  { to: "/app/crea/arts", label: "ARTs", icon: FileSignature, group: "Operação", moduleKey: "crea.arts" },
  { to: "/app/crea/cats", label: "CATs / Acervo", icon: Award, group: "Operação", moduleKey: "crea.cats" },
  { to: "/app/crea/certidoes", label: "Certidões", icon: ScrollText, group: "Operação", moduleKey: "crea.certidoes" },
  { to: "/app/crea/baixas", label: "Baixas", icon: FileMinus, group: "Operação", moduleKey: "crea.baixas" },
  { to: "/app/crea/rts", label: "Responsáveis Técnicos", icon: Users, group: "Cadastros", moduleKey: "crea.rts" },
  { to: "/app/crea/empresas", label: "Empresas", icon: Building2, group: "Cadastros", moduleKey: "crea.empresas" },
  { to: "/app/crea/documentos", label: "Documentações", icon: FolderOpen, group: "Cadastros", moduleKey: "crea.documentos" },
  
  { to: "/app/crea/normas", label: "Normas e Regras", icon: BookOpen, group: "Conhecimento", moduleKey: "crea.normas" },
  { to: "/app/crea/assistente", label: "Assistente IA", icon: Bot, group: "Conhecimento", moduleKey: "crea.assistente" },
  { to: "/app/crea/governanca", label: "Governança ART", icon: Gauge, group: "Governança", moduleKey: "crea.base" },
  { to: "/app/crea/admin", label: "Admin", icon: Settings, group: "Admin", moduleKey: "crea.base" },
];

export default function CreaLayout() {
  const canCrea = useCan("crea.acessar");
  const tabs = useMemo(() => {
    if (canCrea) return allTabs;
    return [];
  }, [canCrea]);

  return (
    <div className="flex gap-0 -m-4 md:-m-6 min-h-[calc(100vh-3rem)] rounded-none overflow-hidden">
      <CollapsibleModuleSidebar
        moduleKey="crea"
        moduleTitle="CREA & ART"
        moduleSubtitle="ERP OCS · módulo"
        moduleIcon={HardHat}
        tabs={tabs.map(t => ({ to: t.to, label: t.label, icon: t.icon, end: t.end, group: t.group }))}
      />
      <div className="flex-1 min-w-0 bg-background">
        <div className="p-4 lg:p-6 min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}
