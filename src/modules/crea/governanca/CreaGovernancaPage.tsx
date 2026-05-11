import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gauge } from "lucide-react";
import { GovArtFilterBar } from "./GovArtFilterBar";
import { GovFilters } from "./lib/govTypes";
import { VisaoExecutivaTab } from "./tabs/VisaoExecutivaTab";

const TABS = [
  { value: "executiva", label: "Visão Executiva", icon: Gauge },
];

export default function CreaGovernancaPage() {
  const [filters, setFilters] = useState<GovFilters>({});
  const [tab, setTab] = useState("executiva");

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Governança ART</h1>
        <p className="text-sm text-muted-foreground">
          Centro nacional de inteligência das ARTs · multiempresa, multi-CREA, multi-ano.
        </p>
      </header>

      <GovArtFilterBar value={filters} onChange={setFilters} />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                <t.icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="executiva" className="mt-4">
          <VisaoExecutivaTab filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
