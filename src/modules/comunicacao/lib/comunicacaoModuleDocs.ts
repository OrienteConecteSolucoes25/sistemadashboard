/** Documentação estruturada do módulo Comunicação OCS — alimenta o Diretor IA e exportações. */
export const COMUNICACAO_MODULE_DOCS = `
MÓDULO COMUNICAÇÃO OCS — VISÃO GERAL

O módulo Comunicação OCS centraliza toda a operação de marketing, conteúdo e comunicação interna/externa da empresa, com IA integrada (Diretor de Comunicação) e suporte a múltiplos clientes/marcas via Brand Kits.

ESTRUTURA DE NAVEGAÇÃO (sidebar lateral, agrupada):

GRUPO "VISÃO"
1. Dashboard (/app/comunicacao) — KPIs gerais: posts no mês, aprovações pendentes, próximas publicações, engajamento agregado, status das integrações sociais.
2. Calendário Editorial (/app/comunicacao/calendario) — Visão mensal/semanal de tudo que será publicado. Filtros por canal, marca, status (planejado, em produção, aprovado, publicado). Clique em um item para abrir o agendamento.

GRUPO "MARCA"
3. Clientes & Marcas (/app/comunicacao/marca) — CRUD de Brand Kits. Cada cliente tem: nome, slogan, descrição, persona, público-alvo, tom de voz, proposta de valor, diferenciais, CTA padrão, estilo visual, cores principais, palavras permitidas/proibidas. Botão SALVAR persiste no Lovable Cloud.
4. Design Studio (/app/comunicacao/design-studio) — Editor visual integrado para criar artes (grade Instagram, banners). Usa as cores e fontes do Brand Kit ativo.
5. Galeria IA (/app/comunicacao/imagens-ia) — Galeria de imagens geradas via IA (Gemini Image). Cada imagem fica vinculada à marca e pode ser reutilizada em posts/carrosséis.
6. Canva Pro (/app/comunicacao/canva) — Atalho para abrir o Canva Pro em nova aba (integração externa).

GRUPO "CONTEÚDO IA"
7. Gerador de Posts (/app/comunicacao/posts) — Cria rascunhos de posts (legenda + hashtags + CTA + prompt visual) usando IA, sempre respeitando o Brand Kit ativo. Status: rascunho_ia → em_revisao → aprovado → publicado.
8. Gerador de Legendas (/app/comunicacao/legendas) — Gera variações de legenda para uma imagem/tema, com tons distintos (informativo, persuasivo, divertido).
9. Gerador de Textos (/app/comunicacao/textos) — Textos longos: artigos de blog, descrições de produto, scripts de Reels.
10. Gerador de Carrossel (/app/comunicacao/carrosseis) — Cria carrossel multi-slide com título, texto e ordem por slide; pronto para o Design Studio aplicar arte.
11. Newsletter Builder (/app/comunicacao/newsletters) — Monta e-mails (assunto, pre-header, público, conteúdo, CTA). Pronto para envio via integração de e-mail.
12. Comunicação Interna (/app/comunicacao/interna) — Comunicados para equipe (tipo, título, mensagem curta, mensagem completa, público-alvo, prioridade). Aparece como notificação para os colaboradores escolhidos.

GRUPO "ESTRATÉGIA"
13. Campanhas (/app/comunicacao/campanhas) — Cadastro de campanhas (nome, tipo, objetivo, descrição, público, datas início/fim). Liga várias peças (posts, carrosséis, newsletters) a uma mesma iniciativa.
14. Product Mgmt (/app/comunicacao/produto) — Roadmap de produtos/serviços do cliente, descontos, lançamentos.
15. Banco de Ideias (/app/comunicacao/ideias) — Lista de ideias soltas (categoria, prioridade, origem). Vira post/carrossel quando aprovada.
16. Banco de Prompts (/app/comunicacao/prompts) — Biblioteca de prompts de IA salvos para reuso (texto/imagem).

GRUPO "OPERAÇÃO"
17. Aprovações (/app/comunicacao/aprovacoes) — Fila de tudo que está em "em_revisao". Cliente/gestor aprova ou pede ajuste antes de publicar.
18. Publicações (/app/comunicacao/publicacoes) — Tudo que já foi publicado, com link externo, data e métricas atuais.
19. Integrações Sociais (/app/comunicacao/integracoes) — Conecta contas (Instagram, Facebook, LinkedIn, TikTok). Status da conexão e tokens.
20. Métricas & Insights IA (/app/comunicacao/metricas) — Coleta métricas dos posts publicados (impressões, alcance, engajamento, cliques) e gera insights automáticos (pontos fortes, fracos, recomendações).
21. Auditoria (/app/comunicacao/auditoria) — Log de todas as ações: criação, edição, exclusão, aprovação, publicação, revelação de credenciais.

PADRÕES OPERACIONAIS:

- Brand Kit ativo: o seletor no topo direito define a marca. Toda IA, post, carrossel etc. usa esse contexto.
- Fluxo de conteúdo: ideia → rascunho IA → revisão humana → aprovação → agendamento → publicação → métricas → insight IA.
- Toda exclusão é SOFT DELETE com motivo, registrada na Auditoria (DeleteWithPasswordModal).
- Importação/exportação: cada lista tem DataActionsToolbar (XLSX/CSV/DOCX + Modelo + Importar).
- Seleção múltipla: todas as listas suportam exclusão em lote via BulkActionsBar.

DIRETOR DE COMUNICAÇÃO OCS (chat flutuante):
- Botão flutuante no canto inferior direito (ícone Sparkles).
- "Nova conversa": pode escolher entre Comunicação Externa (posts/legendas/calendário) ou Interna (comunicados).
- Sem brand kit selecionado: o Diretor responde dúvidas sobre o módulo, explica abas e ensina a usar.
- Com brand kit: o Diretor cria registros (post, carrossel, newsletter, calendário, ideia, campanha, comunicado interno) via tool calling. Tudo nasce como rascunho.
- Histórico: conversas anteriores ficam listadas (lista esquerda) e podem ser retomadas.
`;
