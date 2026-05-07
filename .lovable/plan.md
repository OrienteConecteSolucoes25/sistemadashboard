# CREA & ART — Fechamento completo (F2→F7 + correções)

Objetivo: corrigir os bugs do CRUD atual, completar todas as fases que faltam (F2 a F7) e deixar o módulo CREA com paridade total ao padrão Engenharia/Jurídico (toolbar global, anexos, sheet lateral de detalhes, IA com conhecimento do próprio módulo, seed-pack de normas/links).

---

## 1. Correções críticas (bloqueiam uso hoje)

1.1. **Botão "Salvar" do formulário Novo não funciona** — auditar `CreaCrudPage` (insert/update via `creaCrud.ts`): garantir `await sb.from(table).insert(record)`, tratar erro com toast e fechar Sheet só em sucesso. Hoje o submit silencia.

1.2. **Botão "Importar" some / não funciona** — depois do parse, o estado fecha o `DataActionsToolbar`. Manter toolbar sempre montada e não desmontar durante o ImportDataModal. Fazer o insert em lote (chunks de 200) chamando `mapAdaptive` + `sb.from(table).insert(rows)`.

1.3. **Seleção de colunas ao importar** — estender `ImportDataModal` (ou criar `ImportColumnPickerModal` no CREA) com 3 passos: arquivo → preview com checkboxes por coluna (mapear para campo conhecido OU manter em `data` JSONB OU ignorar) → confirmar.

1.4. **Status ART faltando "não iniciada"** — adicionar `nao_iniciada` em `STATUS_ART` (`creaCrudConfigs.ts`) e como default ao criar.

1.5. **ART: ID visível + datas em sheet lateral** — replicar padrão do módulo Engenharia (Obras): formulário "Novo" só pede campos essenciais (numero, UF, contratante, contratado, escopo, status); clicar no número/ID abre `ArtDetailSheet` com abas (Dados, Datas, Anexos, Histórico) onde se preenchem `data_emissao/pagamento/baixa/rascunho/validacao` etc.

---

## 2. Anexos em todo o módulo (F2 complemento)

- Criar bucket Storage `crea-attachments` (privado) + RLS por `company_id`.
- Tabela `crea_attachments (id, table_name, record_id, file_path, file_name, mime, size, uploaded_by, company_id, created_at, is_deleted)`.
- Componente `CreaAttachmentsField.tsx` reutilizável (upload múltiplo, lista, download assinado, delete soft).
- Plugar em **todos** os formulários: ARTs, Protocolos, **Certidões** (faltava), CATs, Baixas, Tratativas, RTs, Empresas, Documentações, Normas.
- `CreaCrudPage` ganha aba "Anexos" no Sheet de edição.

---

## 3. Credenciais — Exportar/Importar + UI completa (F4)

- Adicionar `DataActionsToolbar` na `CredenciaisPage` (Exportar xlsx/csv com **senhas mascaradas** sempre — nunca exporta texto claro; Importar aceita CSV com senhas em claro e cifra no insert via `crea_save_credential`).
- Auditar export: registrar em `crea_audit_logs` quem exportou e quantas linhas.
- Manter "Revelar senha" exigindo motivo + auto-hide 30s (já existe).

---

## 4. Dashboard avançado + filtros (F3)

- `CreaDashboard` com KPIs reais (queries agregadas): ARTs por status/UF/escopo/setor/empresa/RT, protocolos abertos/vencendo, CATs solic/emit, certidões vencendo/vencidas, baixas pendentes, prazos críticos.
- Barra de filtros global (empresa, UF, CREA, RT, engenheiro, escopo, setor, status, período, tipo doc, tipo protocolo) com persistência em URL.
- Gráficos via `recharts` respeitando preferências de `ChartPreferencesPanel` (Aparência).

---

## 5. Assistente IA — conhecimento do próprio módulo (F5+)

Hoje o `crea-ai-assist` só usa `crea_ai_sources`. Ampliar para **explicar o módulo**:

- Adicionar fonte sintética `MODULE_DOCS` no system prompt: descrição de cada sub-aba, campos, status, fluxos (gerada de constantes em `creaModuleDocs.ts`).
- Permitir perguntas operacionais: "como funciona a aba CATs?", "quais status uma ART pode ter?", "o que faz a aba Tratativas?".
- Continuar respondendo perguntas de norma só com base em `crea_ai_sources` (sem inventar DN/PL).
- UI: chip de modo ("Sobre o módulo" vs "Sobre normas") opcional.

---

## 6. Seed-pack Normas + Links Oficiais (F6)

- Migration com seed de:
  - `crea_links_oficiais`: 27 UFs + Confea (portal, serviços, consulta ART/CAT, certidões, protocolo, atendimento, normas).
  - `crea_norms`: pacote inicial Confea (Resolução 1.025/2009 ART, 1.121/2023 atualizações, DN básicas) marcadas como "vigente, requer confirmação no portal".
  - `crea_ai_sources`: as mesmas normas como conteúdo indexável.
- Banner na UI: "Conteúdo de partida — confirme sempre no portal oficial do CREA da UF."

---

## 7. Integrações & limites explícitos (F7)

Documentar e bloquear no código com flags `crea_module_settings.feature_flags`:
- `scraping`: **off** (nunca habilitado por padrão).
- `rpa_portais`: **off** (placeholder visual "Solicitar habilitação").
- `assinatura_digital`: **off** (placeholder).
- `confea_api_oficial`: **off** até existir convênio.
- `ia_externa_paga`: **off** — Lovable AI Gateway interno apenas.
- `revelar_senha_sem_motivo`: **proibido por RPC** (já é, manter).

Página em `/app/crea/admin` aba "Integrações" mostrando cada flag e estado, sem permitir ligar via UI (só via migration manual + auditoria).

---

## 8. Detalhes técnicos

### Arquivos novos
- `src/modules/crea/ui/crud/ArtDetailSheet.tsx` — sheet lateral (abas Dados/Datas/Anexos/Histórico).
- `src/modules/crea/ui/crud/ImportColumnPickerModal.tsx` — import com seleção de colunas.
- `src/modules/crea/ui/CreaAttachmentsField.tsx` — upload reutilizável.
- `src/modules/crea/lib/creaModuleDocs.ts` — descrição estruturada do módulo (alimenta IA).
- `src/modules/crea/ui/IntegracoesPage.tsx` (sub-aba do admin).

### Arquivos editados
- `src/modules/crea/lib/creaCrud.ts` — `insertRecord`, `updateRecord`, `bulkInsert(table, rows)` com tratamento de erro.
- `src/modules/crea/ui/crud/CreaCrudPage.tsx` — fix submit, toolbar persistente, integração com novo importer e `ArtDetailSheet` quando `table === 'crea_arts'`.
- `src/modules/crea/ui/crud/creaCrudConfigs.ts` — status `nao_iniciada`, novos campos data ART, certidões com anexo.
- `src/modules/crea/ui/CredenciaisPage.tsx` — DataActionsToolbar export/import mascarado.
- `src/modules/crea/ui/CreaDashboard.tsx` — KPIs reais + filtros.
- `supabase/functions/crea-ai-assist/index.ts` — injetar `MODULE_DOCS` no system prompt.

### Backend (uma migration)
- `crea_attachments` (+ RLS por empresa, soft delete).
- Storage bucket `crea-attachments` privado + policies.
- ALTER `crea_arts`: adicionar `data_rascunho`, `data_envio_validacao`, `data_validada` (datas finas).
- Seed `crea_links_oficiais` (27 UFs) e `crea_norms`/`crea_ai_sources` (pacote Confea inicial).
- ALTER `crea_module_settings`: coluna `feature_flags jsonb default '{...todas off...}'`.

### Padrões reutilizados
- `DataActionsToolbar`, `ImportDataModal` (estendido), `DeleteWithPasswordModal`, `EngPageHeader`/`KpiGrid`, `lib/dataIO`, Lovable AI Gateway, tokens HSL.

---

## 9. Critérios de aceite

- [ ] "Novo" salva e fecha Sheet em todas as 13 telas.
- [ ] "Importar" funciona em todas as abas, com seletor de colunas.
- [ ] Anexos funcionam em todos os formulários (incluindo Certidões).
- [ ] ART tem status `nao_iniciada` e abre Sheet lateral com datas/anexos pelo ID.
- [ ] Credenciais têm Exportar (mascarado) e Importar.
- [ ] Dashboard mostra KPIs reais com filtros persistidos.
- [ ] IA explica o que cada aba faz e responde sobre normas citando fontes.
- [ ] 27 UFs com links oficiais e pacote inicial de normas carregados.
- [ ] Flags de integrações off por padrão e visíveis no Admin.
- [ ] Nenhuma cor hard-coded; tudo via tokens HSL; soft delete em todas as crea_*.

---

## 10. Fora de escopo (mantido off por segurança)

Scraping, RPA de portais, assinatura digital, integração Confea oficial, IA externa paga, revelação de senha sem motivo. Tudo documentado em `/app/crea/admin → Integrações` como "não disponível".
