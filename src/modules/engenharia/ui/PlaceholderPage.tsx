import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction } from "lucide-react";

const PlaceholderPage = ({ title, description, table }: { title: string; description: string; table?: string }) => (
  <div className="space-y-3">
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Construction className="w-4 h-4" /> Em construção (Leva 2)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Estrutura e backend já estão prontos. A interface completa será portada do sistema Oriente na Leva 2.</p>
        {table && <Badge variant="outline" className="font-mono text-xs">tabela: {table}</Badge>}
      </CardContent>
    </Card>
  </div>
);

export default PlaceholderPage;
