import { useState } from "react";
import { useImpersonation } from "@/modules/planos/hooks/useImpersonation";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, X, ShieldAlert } from "lucide-react";
import { MasterPasswordDialog } from "@/modules/planos/ui/MasterPasswordDialog";

export function ImpersonationBanner() {
  const imp = useImpersonation();
  const [askPwd, setAskPwd] = useState(false);
  if (!imp.active) return null;

  function onToggle() {
    if (imp.dataAccess) {
      imp.setDataAccess(false);
    } else {
      setAskPwd(true);
    }
  }

  return (
    <>
      <div className="sticky top-0 z-40 bg-amber-500/95 text-amber-950 border-b border-amber-700 px-4 py-2 flex items-center gap-3 text-sm shadow">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold">Modo cliente:</span> visualizando como <b>{imp.companyName}</b>
          {!imp.dataAccess && <span className="ml-2 opacity-80">(dados mascarados — somente UI)</span>}
          {imp.dataAccess && <span className="ml-2 opacity-80">(acesso liberado pelo cliente)</span>}
        </div>
        <Button size="sm" variant="ghost" className="h-7 text-amber-950 hover:bg-amber-600" onClick={onToggle}>
          {imp.dataAccess ? <><EyeOff className="w-3 h-3 mr-1" /> Mascarar</> : <><Eye className="w-3 h-3 mr-1" /> Mostrar dados</>}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-amber-950 hover:bg-amber-600" onClick={() => imp.end()}>
          <X className="w-3 h-3 mr-1" /> Sair
        </Button>
      </div>
      {imp.companyId && (
        <MasterPasswordDialog
          open={askPwd}
          companyId={imp.companyId}
          companyName={imp.companyName || ""}
          onClose={() => setAskPwd(false)}
          onSuccess={() => { imp.setDataAccess(true); setAskPwd(false); }}
        />
      )}
    </>
  );
}
