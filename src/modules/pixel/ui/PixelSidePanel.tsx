import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { STATUS_COLOR, STATUS_LABEL, type PixelStatus } from "../core/constants";
import { PixelSprite } from "../renderer/PixelSprite";
import type { PixelCharacter, DeskLite } from "../data/usePixelWorkspaceData";

type Selected =
  | { kind: "character"; data: PixelCharacter }
  | { kind: "desk"; data: DeskLite }
  | null;

interface Props {
  selected: Selected;
  onClose: () => void;
}

/**
 * Painel lateral leve usado pela PixelOfficePage para personagem ou mesa.
 * Versão completa do painel de personagem (com botões "Chamar reunião"/"Mensagem"/"Ver mesa")
 * será implementada no Prompt 6.
 */
export const PixelSidePanel = ({ selected, onClose }: Props) => {
  const open = selected !== null;
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[360px] sm:w-[400px]">
        {selected?.kind === "character" && <CharacterView c={selected.data} />}
        {selected?.kind === "desk" && <DeskView d={selected.data} />}
      </SheetContent>
    </Sheet>
  );
};

const CharacterView = ({ c }: { c: PixelCharacter }) => {
  const status = (c.status as PixelStatus) ?? "offline";
  return (
    <>
      <SheetHeader>
        <SheetTitle>{c.display_name ?? "Sem nome"}</SheetTitle>
        <SheetDescription>{c.job_title ?? "—"}</SheetDescription>
      </SheetHeader>
      <div className="mt-6 flex flex-col items-center gap-3">
        <PixelSprite spriteKey={c.avatar_sprite_key} size={128} />
        <div className="flex items-center gap-2 text-sm">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: STATUS_COLOR[status] }}
          />
          {STATUS_LABEL[status]}
        </div>
      </div>
      <div className="mt-6 text-sm space-y-1">
        <div>
          <span className="text-muted-foreground">Posição:</span> {c.position_x}, {c.position_y}
        </div>
        <div>
          <span className="text-muted-foreground">Ação:</span> {c.current_action}
        </div>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Painel completo (LinkedIn, setor, descrição, ações) virá no próximo prompt.
      </p>
    </>
  );
};

const DeskView = ({ d }: { d: DeskLite }) => (
  <>
    <SheetHeader>
      <SheetTitle>{d.desk_name ?? "Mesa"}</SheetTitle>
      <SheetDescription>Tipo: {d.desk_type}</SheetDescription>
    </SheetHeader>
    <div className="mt-6 text-sm space-y-1">
      <div>
        <span className="text-muted-foreground">Posição:</span> {d.position_x}, {d.position_y}
      </div>
      <div>
        <span className="text-muted-foreground">Dono:</span>{" "}
        {d.user_id ? <span className="font-mono text-xs">{d.user_id.slice(0, 8)}…</span> : "—"}
      </div>
    </div>
  </>
);
