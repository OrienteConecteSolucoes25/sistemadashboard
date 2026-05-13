import { useEffect, useState, useCallback } from "react";

const LS_KEY = "ocs_eng_demo_mock_v1";

let listeners = new Set<(v: boolean) => void>();
function getInitial(): boolean {
  try { return localStorage.getItem(LS_KEY) === "1"; } catch { return false; }
}

/** Modo Demo/Mockup do módulo Engenharia.
 *  Quando ON, hooks/dashboards retornam dados fictícios para apresentações comerciais.
 *  Visível apenas para OCS staff (controle no componente de toggle).
 */
export function useEngDemoMode() {
  const [enabled, setEnabled] = useState<boolean>(getInitial);

  useEffect(() => {
    const fn = (v: boolean) => setEnabled(v);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const set = useCallback((v: boolean) => {
    try { localStorage.setItem(LS_KEY, v ? "1" : "0"); } catch {}
    listeners.forEach(l => l(v));
  }, []);

  const toggle = useCallback(() => set(!enabled), [enabled, set]);

  return { enabled, set, toggle };
}
