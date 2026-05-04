import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction } from "lucide-react";
import { EngPageHeader } from "./components/EngPageHeader";

const PlaceholderPage = ({ title, description, table }: { title: string; description: string; table?: string }) => (
  <div className="space-y-4">
    <EngPageHeader
      title={title}
      description={description}
      actions={table && <Badge variant="outline" className="font-mono text-[10px]">tabela: {table}</Badge>}
    />
    <Card className="card-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-display">
          <Construction className="w-4 h-4 text-primary" /> Módulo em construção
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Estrutura e backend já estão prontos. A interface completa será portada na próxima leva.
      </CardContent>
    </Card>
  </div>
);

export default PlaceholderPage;
