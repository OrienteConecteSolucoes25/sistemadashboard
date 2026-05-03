# Pixel Office — Assets

Coloque aqui os arquivos `.webp` (ou `.png`) dos sprites do módulo Pixel Office.

Estrutura esperada:

```
public/pixel/
├── avatars/      → avatar_admin_01.webp, avatar_engenharia_01.webp, ...
├── desks/        → desk_admin.webp, desk_engenharia.webp, meeting_table.webp, ...
├── rooms/        → meeting_room.webp, engineering_room.webp, legal_room.webp
└── backgrounds/  → workspace_admin.webp, workspace_engenharia.webp, ...
```

Os nomes devem bater com as `key`s definidas em
`src/modules/pixel/core/sprites.ts`.

Enquanto o arquivo real não existir, o componente `<PixelSprite />`
renderiza um placeholder em CSS automaticamente. Basta colocar o
arquivo aqui e a UI passa a usá-lo sem nenhum outro ajuste.

**Regras:**
- Use `.webp` (preferido) ou `.png`. Sem `.gif`, sem base64.
- Tamanho recomendado: 32×32, 64×64 ou 128×128 (múltiplos de 32).
- Para look pixel-perfect, salve sem antialias.
