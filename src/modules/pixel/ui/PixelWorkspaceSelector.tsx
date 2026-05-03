import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import type { WorkspaceLite } from "../data/usePixelWorkspaceData";

interface Props {
  workspaces: WorkspaceLite[];
  activeId: string | null;
  onChange: (id: string) => void;
}

export const PixelWorkspaceSelector = ({ workspaces, activeId, onChange }: Props) => {
  const { isAdmin } = useAuth();
  if (workspaces.length === 0) return null;

  // Usuário comum só vê seus workspaces (RLS já filtra). Se for só 1, mostra label estático.
  if (!isAdmin && workspaces.length === 1) {
    return (
      <div className="text-sm text-muted-foreground">
        Workspace: <span className="font-medium text-foreground">{workspaces[0].name}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Workspace:</span>
      <Select value={activeId ?? undefined} onValueChange={onChange}>
        <SelectTrigger className="w-[260px]">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {workspaces.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              {w.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
