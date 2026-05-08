import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CadastroSimplesCrud } from "./CadastroSimplesCrud";

export function CadastrosGeraisTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Gerencie os cadastros usados nos selects da <strong>Nova Solicitação</strong> de materiais e em outras telas da Engenharia.
        Tudo o que for adicionado aqui aparecerá automaticamente para os solicitantes.
      </p>
      <Tabs defaultValue="cliente">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="cliente">Cliente</TabsTrigger>
          <TabsTrigger value="categoria">Categoria</TabsTrigger>
          <TabsTrigger value="sla">SLA</TabsTrigger>
          <TabsTrigger value="centro_custo">Centro de custo</TabsTrigger>
          <TabsTrigger value="tipo">Tipo de solicitação</TabsTrigger>
          <TabsTrigger value="coordenador">Coordenador / Analista</TabsTrigger>
          <TabsTrigger value="escopo">Escopo</TabsTrigger>
        </TabsList>
        <TabsContent value="cliente" className="mt-3">
          <CadastroSimplesCrud
            fieldKey="cliente"
            title="Clientes"
            metaFields={[{ key: "cc", label: "Centro de custo padrão" }]}
          />
        </TabsContent>
        <TabsContent value="categoria" className="mt-3">
          <CadastroSimplesCrud
            fieldKey="categoria"
            title="Categorias"
            metaFields={[
              { key: "conta_financeira", label: "Conta financeira" },
              { key: "comprador", label: "Comprador padrão" },
              { key: "sla_dias", label: "SLA (dias)", type: "number" },
            ]}
          />
        </TabsContent>
        <TabsContent value="sla" className="mt-3">
          <CadastroSimplesCrud
            fieldKey="sla"
            title="SLA (catálogo)"
            metaFields={[{ key: "dias", label: "Dias", type: "number" }]}
          />
        </TabsContent>
        <TabsContent value="centro_custo" className="mt-3">
          <CadastroSimplesCrud
            fieldKey="centro_custo"
            title="Clientes × Centros de custo"
            valueLabel="Cliente"
            valuePlaceholder="Ex: NEOENERGIA SP"
            metaFields={[{ key: "centro_custo", label: "Centro de custo" }]}
          />
        </TabsContent>
        <TabsContent value="tipo" className="mt-3">
          <CadastroSimplesCrud fieldKey="tipo" title="Tipos de solicitação" />
        </TabsContent>
        <TabsContent value="coordenador" className="mt-3">
          <CadastroSimplesCrud fieldKey="coordenador" title="Coordenadores / Analistas" />
        </TabsContent>
        <TabsContent value="escopo" className="mt-3">
          <CadastroSimplesCrud fieldKey="escopo" title="Escopos de engenharia" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
