import { useCallback, useMemo, useState } from "react";

/**
 * Hook reutilizável para seleção múltipla em listas/tabelas.
 * Mantém um Set de IDs selecionados e oferece helpers de toggle e select-all.
 */
export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allIds = useMemo(() => items.map((i) => i.id), [items]);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);

  const setMany = useCallback((ids: string[], on: boolean) => {
    setSelected((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => { if (on) n.add(id); else n.delete(id); });
      return n;
    });
  }, []);

  const selectAllVisible = useCallback(() => setMany(allIds, true), [allIds, setMany]);
  const clear = useCallback(() => setSelected(new Set()), []);

  const allChecked = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someChecked = !allChecked && allIds.some((id) => selected.has(id));

  const toggleAll = useCallback(() => {
    if (allChecked) clear(); else selectAllVisible();
  }, [allChecked, clear, selectAllVisible]);

  const selectedItems = useMemo(() => items.filter((i) => selected.has(i.id)), [items, selected]);

  return {
    selected, selectedItems, count: selected.size,
    isSelected, toggle, toggleAll, allChecked, someChecked,
    selectAllVisible, clear, setMany,
  };
}
