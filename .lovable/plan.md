# Plano: Modo Offline (PWA + cache de dados)

Objetivo: tornar o sistema instalável e utilizável sem internet, com cache do shell e das últimas listas críticas (ARTs, Obras, Empresas, Governança CREA, Engenharia, Jurídico). Escritas offline ficam na fila e sincronizam quando voltar a conexão.

## ⚠️ Avisos importantes
- **Não funciona no preview do Lovable** (iframe bloqueia Service Worker). Só na URL publicada (`sistemadashboard.lovable.app` / domínio próprio).
- **Primeira visita online é obrigatória** para baixar o app e os dados.
- **Login** exige internet na primeira vez; depois a sessão Supabase fica em `localStorage` e o app abre offline em modo leitura.
- Após cada deploy, usuários precisam abrir online uma vez para baixar a nova versão (auto-update via SW).

## Escopo

### 1. Infra PWA
- Instalar `vite-plugin-pwa` + `workbox-window`.
- Configurar em `vite.config.ts`:
  - `registerType: "autoUpdate"`, `devOptions.enabled: false`.
  - Manifest: nome "OCS — Oriente", tema teal `#2BBDC0`, `display: standalone`, ícones 192/512.
  - `navigateFallbackDenylist: [/^\/~oauth/, /^\/api/]`.
  - `runtimeCaching`:
    - Navegações HTML → `NetworkFirst` (3s timeout).
    - Assets JS/CSS/fontes → `StaleWhileRevalidate`.
    - Imagens → `CacheFirst` (30 dias).
    - Supabase REST `*/rest/v1/*` GET → `NetworkFirst` (cache nomeado `sb-data`, 7 dias) — só GET.
- Guard em `src/main.tsx`: não registrar SW em iframe nem em `id-preview--*` / `lovableproject.com`.

### 2. Ícones e manifest
- Gerar 2 ícones (192, 512) com a marca Oriente (teal sobre dark) em `public/icons/`.
- `apple-touch-icon` + meta tags mobile no `index.html`.

### 3. Cache de dados-chave (camada leve)
Criar `src/lib/offlineCache.ts`:
- Wrapper `cachedQuery(key, fetcher)` que:
  - Tenta rede; em sucesso grava JSON em IndexedDB (`idb-keyval`) com timestamp.
  - Em falha (offline), lê do IndexedDB e marca o resultado como `stale: true`.
- Aplicar nos hooks de leitura mais usados (sem mudar UI):
  - `crea_arts`, `crea_obras`, `crea_empresas`
  - `crea_gov_*` (Visão Executiva)
  - `eng_*` listas principais
  - `jur_*` listas
- Componente `OfflineBanner` no `AppLayout` mostrando "Você está offline — exibindo dados em cache de {data}".

### 4. Fila de escrita offline (mínima)
- `src/lib/offlineQueue.ts`: enfileira mutações em IndexedDB quando `!navigator.onLine`.
- Listener `online` reprocessa a fila chamando o supabase client.
- Aplicar inicialmente só em criar/editar ARTs e Obras (resto continua exigindo internet com toast claro).

### 5. UX
- Hook `useOnlineStatus()` global.
- Toast quando perde/recupera conexão.
- Badge "Offline" no header.

## Arquivos a criar/editar
- `vite.config.ts` (editar)
- `src/main.tsx` (registro SW com guard)
- `index.html` (meta tags PWA)
- `public/icons/icon-192.png`, `public/icons/icon-512.png` (gerar)
- `src/lib/offlineCache.ts` (novo)
- `src/lib/offlineQueue.ts` (novo)
- `src/hooks/useOnlineStatus.ts` (novo)
- `src/components/OfflineBanner.tsx` (novo)
- `src/components/AppLayout.tsx` (montar banner)
- Hooks de dados existentes (CREA/Eng/Jur) — envolver `select` com `cachedQuery`

## Detalhes técnicos
- `idb-keyval` (~600 bytes) para persistência simples.
- TTL padrão de cache de dados: 7 dias.
- Service Worker exclui rotas auth/oauth para não quebrar login.
- Auto-update: prompt sutil "Nova versão disponível — recarregar".

## Fora de escopo
- Sincronização bidirecional complexa (CRDT).
- Conflitos de edição offline simultânea (resolução last-write-wins).
- Funcionalidades que dependem de IA/edge functions (continuam exigindo internet).
