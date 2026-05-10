import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Banner exibido em telas de permissão legadas.
 * Orienta o usuário a migrar para a nova matriz central em ADM > Visibilidade.
 */
export default function LegacyDeprecationBanner({
  title = "Tela de permissões legada",
  message = "Esta interface continua funcional como fallback, mas foi substituída pela matriz central de permissões.",
}: { title?: string; message?: string }) {
  return (
    <Alert className="border-warning/40 bg-warning/5">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-sm">{title}</AlertTitle>
      <AlertDescription className="text-xs text-muted-foreground">
        {message}{" "}
        <Link to="/app/adm" className="text-primary underline">
          Abrir ADM › Visibilidade
        </Link>
        .
      </AlertDescription>
    </Alert>
  );
}
