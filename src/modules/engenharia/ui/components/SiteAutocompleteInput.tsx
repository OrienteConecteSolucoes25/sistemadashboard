import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useSites } from "../../hooks/useSites";

interface Props {
  value: string;
  onChange: (v: { site: string; cidade?: string | null; uf?: string | null }) => void;
  placeholder?: string;
  id?: string;
}

export const SiteAutocompleteInput = ({ value, onChange, placeholder, id }: Props) => {
  const sites = useSites();
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value]);

  return (
    <div className="space-y-1">
      <Input
        id={id}
        list="obras-autocomplete-list"
        value={local}
        placeholder={placeholder ?? "Nome da obra"}
        onChange={(e) => {
          const v = e.target.value;
          setLocal(v);
          const found = sites.find((s) => s.name.toLowerCase() === v.trim().toLowerCase());
          onChange({ site: v, cidade: found?.city ?? null, uf: found?.state ?? null });
        }}
      />
      <datalist id="obras-autocomplete-list">
        {sites.map((s) => <option key={s.name} value={s.name} />)}
      </datalist>
      <p className="text-[11px] text-muted-foreground">
        Se já existe, cidade/UF preenchem automaticamente. Caso contrário, será criado em Obras.
      </p>
    </div>
  );
};
