import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { hslStrToHex, hexToHslStr, isValidHex } from "../lib/colorUtils";
import { toast } from "sonner";

interface Props {
  label: string;
  hslValue: string;       // "h s% l%"
  defaultHsl: string;     // do preset
  onChange: (newHsl: string) => void;
}

export function ColorField({ label, hslValue, defaultHsl, onChange }: Props) {
  const [showHsl, setShowHsl] = useState(false);
  const [hexInput, setHexInput] = useState(hslStrToHex(hslValue));

  // Sincroniza hex quando hslValue muda externamente
  const currentHex = hslStrToHex(hslValue);
  if (hexInput.toLowerCase() !== currentHex.toLowerCase() && isValidHex(hexInput) && hexToHslStr(hexInput) !== hslValue) {
    // não força — só atualiza se o user não está editando
  }

  const handleHexChange = (v: string) => {
    setHexInput(v);
    if (isValidHex(v)) onChange(hexToHslStr(v.startsWith("#") ? v : "#" + v));
  };

  const handlePicker = (v: string) => {
    setHexInput(v);
    onChange(hexToHslStr(v));
  };

  const copyHex = () => {
    navigator.clipboard.writeText(currentHex);
    toast.success(`${currentHex} copiado`);
  };

  const reset = () => {
    setHexInput(hslStrToHex(defaultHsl));
    onChange(defaultHsl);
  };

  return (
    <div className="space-y-1.5 p-3 rounded-md border bg-card">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copyHex} title="Copiar HEX">
            <Copy className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={reset} title="Restaurar">
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={currentHex}
          onChange={(e) => handlePicker(e.target.value)}
          className="w-10 h-10 rounded border cursor-pointer shrink-0"
        />
        <Input
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#000000"
          className="font-mono text-xs h-9"
        />
      </div>
      <button
        type="button"
        onClick={() => setShowHsl((s) => !s)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
      >
        {showHsl ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        HSL avançado
      </button>
      {showHsl && (
        <Input
          value={hslValue}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-[11px] h-7"
          placeholder="217 91% 55%"
        />
      )}
    </div>
  );
}
