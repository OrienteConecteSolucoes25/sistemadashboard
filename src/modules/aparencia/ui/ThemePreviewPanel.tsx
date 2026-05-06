import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";

const pieData = [
  { name: "Concluído", value: 42 },
  { name: "Em andamento", value: 28 },
  { name: "Atrasado", value: 12 },
  { name: "Aguardando", value: 18 },
];
const barData = [
  { mes: "Jan", val: 24 }, { mes: "Fev", val: 32 }, { mes: "Mar", val: 28 },
  { mes: "Abr", val: 41 }, { mes: "Mai", val: 36 }, { mes: "Jun", val: 49 },
];

export function ThemePreviewPanel() {
  const colors = ["hsl(var(--chart-1, var(--primary)))", "hsl(var(--chart-2, var(--accent)))", "hsl(var(--chart-3, var(--success)))", "hsl(var(--chart-4, var(--warn)))", "hsl(var(--chart-5, var(--destructive)))"];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-3 rounded-md bg-primary/10 border border-primary/30 text-sm">
        <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
        <p>Esta é uma pré-visualização. As alterações só serão aplicadas para a empresa após clicar em <strong>Salvar tema</strong> e confirmar.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Receita", value: "R$ 184k", color: "kpi-teal" },
          { label: "Pendências", value: "12", color: "kpi-warn" },
          { label: "Atrasos", value: "3", color: "kpi-danger" },
          { label: "Concluídos", value: "127", color: "kpi-success" },
        ].map(k => (
          <Card key={k.label} className={`card-elegant ${k.color} min-w-0`}>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground truncate">{k.label}</div>
              <div className="text-3xl font-display mt-1 truncate">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="card-elegant min-w-0">
          <CardHeader><CardTitle className="text-sm">Distribuição (Pizza)</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer><PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={70} label>
                {pieData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart></ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elegant min-w-0">
          <CardHeader><CardTitle className="text-sm">Mensal (Barras)</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer><BarChart data={barData}>
              <XAxis dataKey="mes" fontSize={11} /><YAxis fontSize={11} /><Tooltip />
              <Bar dataKey="val" fill={colors[0]} radius={4} />
            </BarChart></ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elegant min-w-0">
          <CardHeader><CardTitle className="text-sm">Tendência (Linha)</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer><LineChart data={barData}>
              <XAxis dataKey="mes" fontSize={11} /><YAxis fontSize={11} /><Tooltip />
              <Line type="monotone" dataKey="val" stroke={colors[1]} strokeWidth={2} />
            </LineChart></ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Botões e badges */}
      <Card className="card-elegant">
        <CardHeader><CardTitle className="text-sm">Componentes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button>Primário</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Perigo</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>default</Badge>
            <Badge variant="secondary">secondary</Badge>
            <Badge variant="outline">outline</Badge>
            <Badge variant="destructive">destructive</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Nome</Label><Input placeholder="Digite o nome" /></div>
            <div className="space-y-1"><Label>E-mail</Label><Input placeholder="email@ocs.com.br" /></div>
          </div>
          {/* Tabela */}
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr><th className="text-left p-2">Item</th><th className="text-left p-2">Status</th><th className="text-right p-2">Valor</th></tr>
              </thead>
              <tbody>
                <tr className="border-t"><td className="p-2">Obra A</td><td className="p-2"><Badge>Em andamento</Badge></td><td className="p-2 text-right">R$ 42.000</td></tr>
                <tr className="border-t"><td className="p-2">Obra B</td><td className="p-2"><Badge variant="destructive">Atrasada</Badge></td><td className="p-2 text-right">R$ 18.500</td></tr>
                <tr className="border-t"><td className="p-2">Obra C</td><td className="p-2"><Badge variant="outline">Aguardando</Badge></td><td className="p-2 text-right">R$ 7.300</td></tr>
              </tbody>
            </table>
          </div>
          {/* Mock sidebar */}
          <div className="grid grid-cols-[140px_1fr] rounded-md border overflow-hidden h-32">
            <div className="bg-sidebar text-sidebar-foreground p-2 space-y-1 text-xs">
              <div className="px-2 py-1 rounded bg-sidebar-primary text-sidebar-primary-foreground">Dashboard</div>
              <div className="px-2 py-1 rounded hover:bg-sidebar-accent">Obras</div>
              <div className="px-2 py-1 rounded hover:bg-sidebar-accent">Equipes</div>
              <div className="px-2 py-1 rounded hover:bg-sidebar-accent">RFI</div>
            </div>
            <div className="p-3 text-xs text-muted-foreground bg-background">
              Exemplo de módulo Engenharia / Jurídico — a sidebar interna agora segue o tema da empresa.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
