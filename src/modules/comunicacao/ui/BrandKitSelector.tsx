import { Link } from "react-router-dom";
import { Building2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useActiveBrandKit } from "../hooks/useActiveBrandKit";

export function BrandKitSelector() {
  const { brands, activeBrandId, setActiveBrandId, loading } = useActiveBrandKit();

  if (loading) return null;

  if (brands.length === 0) {
    return (
      <Link to="/app/comunicacao/marca">
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="h-4 w-4" /> Cadastrar primeiro cliente/marca
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-primary" />
      <Select value={activeBrandId ?? ""} onValueChange={(v) => setActiveBrandId(v || null)}>
        <SelectTrigger className="h-9 min-w-[200px]">
          <SelectValue placeholder="Selecionar cliente/marca" />
        </SelectTrigger>
        <SelectContent>
          {brands.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.nome} {b.is_default ? "★" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Link to="/app/comunicacao/marca">
        <Button size="sm" variant="ghost" className="gap-1 h-9">
          <Plus className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
