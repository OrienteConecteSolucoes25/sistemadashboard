import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  titulo: string;
  descricao?: string;
}

/** Placeholder visual quando uma automação não está configurada/credenciada. */
export function AutomationFallback({ titulo, descricao }: Props) {
  return (
    <Card className="border-dashed border-muted-foreground/30">
      <CardContent className="p-4 flex items-start gap-3 text-sm">
        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div>
          <div className="font-medium">{titulo}</div>
          {descricao && <div className="text-xs text-muted-foreground mt-1">{descricao}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
