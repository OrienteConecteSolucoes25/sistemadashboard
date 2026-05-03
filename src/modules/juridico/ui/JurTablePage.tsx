import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Col = { key: string; label: string };
type Props = {
  title: string;
  description?: string;
  columns: Col[];
  rows: Record<string, any>[];
};

const JurTablePage = ({ title, description, columns, rows }: Props) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Badge variant="secondary">{rows.length} registros (mock)</Badge>
    </div>
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="text-left px-3 py-2 font-medium">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">Sem dados.</td></tr>
          ) : rows.map((r, i) => (
            <tr key={r.id ?? i} className="border-t">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2">{String(r[c.key] ?? "—")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

export default JurTablePage;
