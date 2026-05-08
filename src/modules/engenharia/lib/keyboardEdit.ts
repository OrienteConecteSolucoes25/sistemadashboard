import type React from "react";

/**
 * Handler de teclado padronizado para diálogos/forms de edição do módulo Engenharia.
 * - Enter (sem Shift) em <input>/<select> → dispara save
 * - Esc → dispara cancel (se fornecido)
 * - Ignora Enter em <textarea> e quando target está dentro de combobox/popover
 */
export function makeEditKeyHandler(save: () => void, cancel?: () => void) {
  return (e: React.KeyboardEvent<HTMLElement>) => {
    const tgt = e.target as HTMLElement | null;
    const tag = (tgt?.tagName || "").toLowerCase();
    if (e.key === "Enter" && !e.shiftKey && tag !== "textarea" && tag !== "button") {
      // evita conflito com botões/popovers internos
      if (tgt?.closest("[data-no-enter-save]")) return;
      e.preventDefault();
      save();
    } else if (e.key === "Escape" && cancel) {
      e.preventDefault();
      cancel();
    }
  };
}
