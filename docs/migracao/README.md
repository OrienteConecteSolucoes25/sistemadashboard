# 📦 Pacote de Migração — Método Alma Brasileira

Documentação completa para **replicar o produto em outro lugar** com uma IA (Lovable, Cursor,
v0, etc.). Entregue estes arquivos (na ordem) para a IA construtora:

1. **`00-CONTEXTO.md`** — visão, objetivo, histórico dos artefatos/painéis, decisões e princípios.
2. **`01-PRD.md`** — requisitos do produto: **objetivo + estrutura (telas)** + requisitos
   funcionais + arquitetura + design (incl. glassmorphism) + critérios de aceite.
3. **`02-ESTRUTURA.md`** — estrutura técnica: arquivos do motor, API, **modelo de dados (SQL)**,
   lógica do roteador multi-IA e do gerador, estrutura dos dados de marca.
4. **`03-BUGS-E-IDEIAS.md`** — **bugs/limitações conhecidos** e **ideias futuras** não aplicadas.

## Código de referência (já funciona)
- `motor-multi-ia/` — roteador multi-IA (BYOK + failover + memória, multi-tenant) em Node puro.
  Rode `node demo.js` para ver o failover e a memória na prática.

## Artefatos de referência visual (claude.ai)
- **Método Alma Brasileira** (decodificador + gerador): demo do produto.
- **Painel Alma Brasileira (prévia)**: maquete das telas do sistema multi-IA.

## Resumo em 1 frase
SaaS que decodifica marcas e gera Brand Kits a partir de referências reais (nunca inventando),
com motor **multi-IA agnóstico (BYOK + failover + memória)** para não ficar refém de nenhuma IA
nem gastar os créditos da operação.
