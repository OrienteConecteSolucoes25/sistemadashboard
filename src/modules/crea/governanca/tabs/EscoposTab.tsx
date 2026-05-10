import { SimpleCrudTab } from "./SimpleCrudTab";

export function EscoposTab() {
  return (
    <SimpleCrudTab
      table="crea_gov_escopos"
      title="Escopos"
      description="Escopos operacionais por empresa (ex.: Preventiva, Corretiva, Laudo)."
      fields={[
        { key: "nome", label: "Nome" },
        { key: "descricao", label: "Descrição", type: "textarea" },
      ]}
    />
  );
}
