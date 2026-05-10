import { SimpleCrudTab } from "./SimpleCrudTab";

export function TagsTab() {
  return (
    <SimpleCrudTab
      table="crea_gov_tags"
      title="Tags"
      description="Tags operacionais por empresa (ex.: SPDA, Torre, Vistoria). Aceitam regex sugerido para classificação automática."
      fields={[
        { key: "nome", label: "Nome" },
        { key: "cor", label: "Cor", type: "color" },
        { key: "regex_sugerido", label: "Regex sugerido (opcional)" },
      ]}
    />
  );
}
