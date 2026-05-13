# Pixel Office — Evolução Visual + Configuração Fácil

Trabalho dividido em **levas curtas** (você pediu trabalho em levas). Cada leva é entregável e testável sozinha. Tudo restrito ao módulo `src/modules/pixel/`. Nada de auth, RLS, permissões, tabelas ou Supabase será tocado.

## Princípios fixos

- Sem assets pagos / imagens externas. Apenas SVG/CSS/Pixi Graphics próprios.
- Tokens HSL do design Oriente. Nada de cores hard-coded.
- Mobile + desktop funcionando.
- Sem quebrar telas existentes (`PixelWorkspaceView`, AvatarBuilder, mesas, workspaces, NPCs).
- Me de uma descrição detalhada em word de cada avatar e agente e assistente que temos no modulo soluções OCS e nos outros modulos.
- Se eu não gostar e pedir pra desfazer oque foi feito depois da última leva desfaça e volte como era os pixelAvatar.

---

## Leva 1 — Limpar avatares (FASES 1 + 2)

**Arquivos:** `renderer/AvatarLayeredSprite.tsx`, `PixelAvatarSprite.tsx`, `PixelAvatar.tsx`, `engine/PixiCharacters` (se existir), `core/sprites.ts`, `core/avatarMapping.ts`.

- Remover qualquer `<rect>` de fundo, `bg-*`, `border`, `outline`, container com cor sólida atrás do avatar.
- Forçar `viewBox` centralizado e `background: transparent` em todo SVG.
- Em PixiJS: `Container` transparente, sem `Graphics.beginFill().drawRect()` atrás do sprite. Sombra só como elipse no chão.
- Reescalar avatares: altura mínima **64px desktop / 52px mobile**, proporção cabeça 38% / tronco 35% / pernas 27%.
- Garantir que cabelos / acessórios escalem com o corpo (mesmo `transform: scale`).

**Aceite:** nenhum quadrado ou caixa ao redor de qualquer avatar; bonecos maiores e proporcionais.

---

## Leva 2 — Pixel art corporativo (FASE 3)

**Arquivos:** `core/avatarOptions.ts`, `core/avatarMapping.ts`, novos SVG layers em `renderer/`.

- Refinar layers: rosto, cabelo, roupa, sapato, óculos, brinco, batom, capacete, ferramenta.
- Criar **8 presets de uniforme** prontos: Engenharia, Jurídico, RH, TI, Diretoria, Campo, Atendimento, Marketing — escolhíveis no AvatarBuilder com 1 clique.

**Aceite:** trocar preset muda visual completo do avatar coerentemente.

---

## Leva 3 — Mapa mais escritório (FASE 8)

**Arquivos:** `renderer/PixelOfficeMap.tsx`, `PixelOfficeDecorations.tsx`, `core/pixelOfficeTheme.ts`.

- Zonas nomeadas: Recepção, Reunião, Mesas, Diretoria, Técnica, Jurídica, Engenharia, Café, Sala dos Agentes.
- Decoração: paredes, piso com tapetes, plantas, quadros, monitores, divisórias, placas de setor.
- Iluminação suave (gradient Pixi/CSS) por zona.

**Aceite:** mapa parece escritório, não grid técnico.

---

## Leva 4 — Configuração rápida estilo OpenClaw (FASE 4)

**Novo:** `ui/PixelQuickSetupWizard.tsx` + rota `/app/pixel/configurar`.

5 etapas (Workspace → Personagem → Mesa → Recursos → Resumo) com `Stepper` + `Card` shadcn. Salva no estado já existente (sem migrar tabela). Final mostra resumo e botão “abrir Pixel Office”.

**Aceite:** admin configura em < 3 min sem ver código.

---

## Leva 5 — Painel Operação IA 24h (FASE 5)

**Novo:** `ui/PixelOps24hPanel.tsx` + entrada no menu Pixel.

Grid de cards (Jarbas, Engenharia Bot, Jurídico Bot, RH Bot, TI Bot, Marketing Bot, CRM Bot, RFI Bot, EHS Bot, Pendência Bot) com: nome, função, status, canais, última atividade, tarefas pendentes, botão **Abrir chat** + **Configurar**. Mock funcional onde a IA real não está conectada (sem API paga).

**Aceite:** painel lista 10 agentes, cards clicáveis, sem chamada externa paga.

---

## Leva 6 — Editor de NPC/Agente (FASE 6) + Equipe Digital (FASE 7)

**Novo:** `ui/PixelNpcEditor.tsx` (drawer/sheet) e `ui/PixelDigitalTeamView.tsx`.

- Editor: nome, módulo vinculado, função, descrição, canais, permissões (somente exibe — não altera RLS), status, prompt interno, ações (abrir módulo, listar pendências, criar tarefa, etc.).
- Equipe Digital: cena pixel + clique no personagem abre painel lateral com logs/tarefas/ações.

**Aceite:** admin cria/edita NPC sem código; clicar em personagem abre detalhes.

---

## Leva 7 — QA e não-regressão (FASE 9)

- Verificar `/app/pixel/*` ainda renderiza, AvatarBuilder + mesas + workspaces + chat seguem ok.
- Checklist mobile (375px) e desktop.
- Print de antes/depois dos avatares para confirmar fim dos quadrados.

---

## Detalhes técnicos

- Nada novo no Supabase. Configurações novas (presets, NPCs mockados) ficam em estado local + `localStorage` por enquanto, com TODO marcado para futura persistência.
- Roteamento: adicionar entradas em `modules/pixel/ui/` e registrar onde o módulo Pixel já é montado.
- Tokens: usar `--primary` (teal Oriente), `--sidebar-background`, `--muted`, etc. — sempre HSL.
- Performance: reaproveitar `PIXI.Application` existente, sem recriar a cada render.

---

## O que **NÃO** será feito

- Não mexer em auth, RLS, grupos de visibilidade, tabelas, Supabase, Edge Functions.
- Não copiar arte de Habbo/OpenClaw — apenas inspiração conceitual.
- Não integrar APIs pagas de IA agora.

---

Posso começar pela **Leva 1 (limpar quadrados + proporção)** assim que você aprovar. Se quiser priorizar outra leva primeiro (ex.: Configuração Rápida ou Painel 24h), só dizer a ordem.