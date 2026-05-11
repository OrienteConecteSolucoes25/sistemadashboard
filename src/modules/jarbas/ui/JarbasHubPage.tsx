import { useSearchParams, useNavigate } from "react-router-dom";
import { Cpu, GraduationCap, BarChart3, Terminal, Share2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { JarbasCentralDashboard } from "./JarbasCentralDashboard";
import { JarbasTrainingDashboard } from "./JarbasTrainingDashboard";
import { JarbasAnalyticsDashboard } from "./JarbasAnalyticsDashboard";
import { JarbasCommandCenter } from "./JarbasCommandCenter";
import { JarbasIntegrationHub } from "./JarbasIntegrationHub";

const TABS = [
  { value: "core", label: "AI Core", icon: Cpu, render: () => <JarbasCentralDashboard /> },
  { value: "training", label: "Training", icon: GraduationCap, render: () => <JarbasTrainingDashboard /> },
  { value: "analytics", label: "Analytics", icon: BarChart3, render: () => <JarbasAnalyticsDashboard /> },
  { value: "command", label: "Command Center", icon: Terminal, render: () => <JarbasCommandCenter /> },
  { value: "api", label: "API Brain", icon: Share2, render: () => <JarbasIntegrationHub /> },
];

export const JarbasHubPage = () => {
  const [params, setParams] = useSearchParams();
  const active = TABS.some((t) => t.value === params.get("tab")) ? params.get("tab")! : "core";

  return (
    <div className="min-h-screen bg-[#02020a]">
      <Tabs value={active} onValueChange={(v) => setParams({ tab: v })}>
        <div className="sticky top-0 z-30 bg-[#02020a]/90 backdrop-blur border-b border-cyan-500/20 px-4 py-3">
          <TabsList className="bg-cyan-950/40 border border-cyan-500/20 h-auto p-1 flex-wrap">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-cyan-300 text-[11px] font-bold uppercase tracking-wider px-4 py-2"
              >
                <t.icon className="w-3.5 h-3.5 mr-2" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="m-0">
            {t.render()}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default JarbasHubPage;
