import { SimpleCrudTab } from "./SimpleCrudTab";

export function SetoresTab() {
  return (
    <SimpleCrudTab
      table="crea_gov_setores"
      title="Setores"
      description="Setores personalizados por empresa (ex.: Telecom, Civil, Elétrica). Usados para classificar ARTs."
      extraDefaults={{ status: "ativo" }}
      fields={[
        { key: "nome", label: "Nome" },
        { key: "descricao", label: "Descrição", type: "textarea" },
        { key: "cor", label: "Cor", type: "color" },
      ]}
    />
  );
}
