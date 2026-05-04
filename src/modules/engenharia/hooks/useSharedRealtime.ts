import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSharedRealtime(kind: string, onChange: () => void) {
  useEffect(() => {
    const ch = supabase
      .channel(`rt_eng_shared_${kind}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "eng_shared_records", filter: `kind=eq.${kind}` },
        () => onChange(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);
}
