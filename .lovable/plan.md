# Refactor Governança ART · Dashboard CREA · Assistente IA

Mudança grande, dividida em **5 levas** para não atrapalhar quem está usando o sistema agora. Só a aba Governança ART antiga será apagada mas antes transferi as sub-abas solicitadas para a aba Assistente IA — o resto preserva dados existentes.

## Leva 1 — Correções rápidas + nova estrutura de tabs

- Corrigir aba **ARTs** e aba **Empresas** (não estão renderizando) — investigar `CreaPages.tsx` / `CreaCrudPage` / `EmpresasPage` sem apagar dados colocados pelos usuarios.
- **Mover** "Classificação IA" e "Relatórios Gerenciais" da aba Governança ART para dentro da aba **Assistente IA** como sub-abas.
- **Apagar** as sub-abas que sobraram antigas de Governança ART **exceto Visão Executiva**.
- Nada destrutivo no banco — só remoção de UI.

## Leva 2 — 3 novas tabelas + sub-abas com importação

Criar 3 tabelas novas no banco (sem mexer nas antigas):

`**crea_gov_servicos**` (modelo Relatório Gerencial de Serviços)

- colunas de `relatorio_servicos_crea.xlsx`: Numero, Detalhe, analise, baixa, boleto, pagamento, cadastro, empresa, contratante, endereço, observação

`**crea_gov_art_bloco**` (modelo ART por Bloco)

- ~50 colunas de `arts_extraidas.xlsx`: Número da ART, Valor, Pago, Responsável técnico, Contratante, CPF/CNPJ, endereços de contrato e obra, datas, atividades, níveis, quantidades, etc.

`**crea_gov_relatorio_crea**` (modelo Relatórios CREA)

-  colunas de `relatorio_crea_ba_art.xlsx:`ART, Tipo, Participação Técnica, Forma de Registro, Pagamento, Taxa Paga, Cadastro, Observação, Contratante, CNPJ contratante, proprietário, CNPJ proprietário, numero, valor do contrato, data início, data fim, endereços, atividades, nível, atividade subordinada, atividade/serviço, quantidade, unidade de medida

Cada uma com `company_id`, RLS por `eng_can_edit`/multitenant, soft-delete via padrão padrão `eng_soft_delete`, auditoria.

Sub-abas novas em Governança ART (em ordem):

1. **Visão Executiva** (existente — recalcula com base nas 3 novas)
2. **Relatório Gerencial de Serviços** — tabela + DataActionsToolbar (importar/exportar/modelo) + bulk select
3. **ART por Bloco** — idem
4. **Relatórios CREA** — idem

## Leva 3 — Novos filtros + Visão Executiva cruzada

Substituir `GovArtFilterBar` pelos novos filtros (busca instantânea conforme digita):

- UF · ANO · MÊS · CIDADE · NOME DA OBRA · NOME DO RESPONSÁVEL TÉCNICO · Nº ART · DATA DE · DATA ATÉ

Refazer `VisaoExecutivaTab` cruzando dados das 3 tabelas, sub-abas novas para mostrar:

- Quantidade de ARTs por UF
- Quantidade de clientes (contratantes únicos)
- Quantidade de ARTs por RT
- Valor total gasto em ARTs
- Valor total por atividade técnica
- Valor total por ano
- Valor total por UF
- RTs por UF
- Total de contratantes
- Total de cidades
- Custo por contratante (top N)
- ARTs por RT (top N)  
  
Lembrando que o id ou numero da ART se for o mesmo as mesmas informações dele n deve ser repetido para Visão executiva mesmo que vindo de/em tabelas diferentes

## Leva 4 — Criar uma nova aba chamada Anuidades + mudança aba empresa  
  
Nessa aba chamada Anuidade terá coluna de CREA para eu colocar se é PJ ou PF, nome para eu colocar o nome de alguma empresa ou responsavel técnico com selelcionar ou clicar em outro para escrever e ai vira selecionador, status pago, nao pago, isento, desconto, se selecionar deconto tera que colocar a porcentagem do desconto. tem que ter a opção de selecionar varios ou editar.  
  
Mude o nome da aba empresa para Clientes  
  
Leva 5 - Dashboard CREA + Conversor PDF/Word→CSV no Assistente IA

**Dashboard CREA** (`CreaDashboard.tsx`) ganha cards consolidados puxando das seguintes abas do modulo CREA & ART:

- ARTs: total, gráfico de barras: status × quantidade, valor total, top escopos × valor
- CATs/Acervo: total, gráfico por status
- Certidões: gráfico de certidões emitidas × ano
- Baixas: quantas ART  baixados no total, quantos responsaveis tecnicos baixados por UF no total, quantos responsaveis tecnicos baixados.
- Responsaveis Tecnicos: quantidade de status ativos e nao ativos;quantidade de inclusão ativas, nao ativas, em andamento; anuidades pagas, nao paga, insenta e com desconto.
- Empresas que agora a aba se chamará clientes: quantidade total de clientes
- Documentos: quantidade de documentos criados. quantidade de documentos criados por uf
  &nbsp;
  Deve ter  filtro em Dashboard CREA:  
   por ano,   
  por mes,  
   por RT,   
  por cliente  
  por visão geral onde ao selecionarmos a opção visão geral mostra todos esses cards consolidados  puxando das abas do modulo CREA & ART   
  e tbm uma opção visão executiva onde mostra o mesmo que mostra em visão executiva da aba governança ART  
    
    


**Assistente IA** ganha sub-aba **"Conversor de Documentos"** com 3 modelos:

- **Modelo 1 — Relatório CREA**: gera CSV/XLSX com colunas do modelo `relatorio_crea_ba`
- **Modelo 2 — ART por Bloco**: gera CSV/XLSX com seções (Resp. técnico, Contrato, Obra, Atividades, Observações, Declarações, Entidade de classe, Assinaturas, Informações, Valor)
- **Modelo 3 — Relatório Gerencial de Serviços**: colunas Numero, Detalhe, analise, baixa, boleto, pagamento, cadastro, empresa, contratante, endereço, observação

Fluxo: usuário escolhe modelo → faz upload do PDF/Word → clica **Gerar** → edge function `crea-doc-to-csv` extrai com Lovable AI (Gemini 2.5 Flash) → download em CSV ou XLSX.

## Notas técnicas

- Tudo usa `DataActionsToolbar` + `ImportDataModal` + `useBulkSelection` + `DeleteWithPasswordModal` (padrão global).
- Catálogo ACL (`src/acl/catalog.ts`) atualizado com as novas sub-abas para aparecerem em ADM-Visibilidade.
- Filtros aplicam direto nas queries Supabase com `ilike` para busca por digitação.
- Edge function nova `crea-doc-to-csv` usa `LOVABLE_API_KEY` (já presente) — sem novo segredo.
- Migrations criam tabelas com `IF NOT EXISTS` — sem risco de derrubar dados em uso.

## Confirmação

 OK, começo pela **Leva 1** (correções + reorganização de abas) já nesta resposta de aprovação e vou seguindo até a Leva 5. Posso pausar entre levas se preferir revisar cada etapa.