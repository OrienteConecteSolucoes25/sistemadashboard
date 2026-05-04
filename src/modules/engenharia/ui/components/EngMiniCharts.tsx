import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--warn))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

export const DistribuicaoCard = ({
  title, rows, groupKey,
}: { title: string; rows: any[]; groupKey: string }) => {
  const map: Record<string, number> = {};
  rows.forEach((r) => {
    const k = String(r[groupKey] ?? "—");
    map[k] = (map[k] ?? 0) + 1;
  });
  const data = Object.entries(map).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  return (
    <Card className="card-elegant p-4">
      <div className="text-sm font-display font-semibold mb-3">{title}</div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export const RankingCard = ({
  title, rows, groupKey, limit = 8,
}: { title: string; rows: any[]; groupKey: string; limit?: number }) => {
  const map: Record<string, number> = {};
  rows.forEach((r) => {
    const k = String(r[groupKey] ?? "—");
    if (!k || k === "—") return;
    map[k] = (map[k] ?? 0) + 1;
  });
  const data = Object.entries(map)
    .map(([name, value]) => ({ name: name.length > 18 ? name.slice(0, 18) + "…" : name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
  return (
    <Card className="card-elegant p-4">
      <div className="text-sm font-display font-semibold mb-3">{title}</div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
