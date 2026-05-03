import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarLayeredSprite } from "../renderer/AvatarLayeredSprite";
import {
  bodyOptions,
  skinToneOptions,
  hairOptions,
  hairColorOptions,
  outfitOptions,
  outfitColorOptions,
  bottomOptions,
  shoesOptions,
  lipstickOptions,
  earringOptions,
  glassesOptions,
  hatOptions,
  toolOptions,
  type AvatarCustomization,
  type AvatarOption,
  type AvatarColorOption,
} from "../core/avatarOptions";

interface Props {
  value: AvatarCustomization;
  onChange: (next: AvatarCustomization) => void;
  /** Tamanho do preview principal. */
  previewSize?: number;
}

export const AvatarBuilder = ({ value, onChange, previewSize = 180 }: Props) => {
  const set = <K extends keyof AvatarCustomization>(k: K, v: AvatarCustomization[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
      {/* Preview */}
      <div className="flex flex-col items-center gap-3 p-4 rounded-xl border bg-muted/30">
        <div className="p-3 rounded-lg bg-background border shadow-inner">
          <AvatarLayeredSprite customization={value} size={previewSize} />
        </div>
        <div className="text-xs text-muted-foreground text-center">
          Pré-visualização em tempo real
        </div>
      </div>

      {/* Categorias */}
      <Tabs defaultValue="corpo" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="corpo">Corpo</TabsTrigger>
          <TabsTrigger value="cabelo">Cabelo</TabsTrigger>
          <TabsTrigger value="roupa">Roupa</TabsTrigger>
          <TabsTrigger value="acessorios">Acessórios</TabsTrigger>
          <TabsTrigger value="maquiagem">Maquiagem</TabsTrigger>
          <TabsTrigger value="trabalho">Trabalho</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[320px] mt-3 pr-3">
          <TabsContent value="corpo" className="space-y-4 m-0">
            <Selector
              label="Base"
              options={bodyOptions}
              value={value.avatar_body_key}
              onChange={(k) => set("avatar_body_key", k)}
            />
            <ColorSelector
              label="Tom de pele"
              options={skinToneOptions}
              value={value.avatar_skin_tone}
              onChange={(k) => set("avatar_skin_tone", k)}
            />
          </TabsContent>

          <TabsContent value="cabelo" className="space-y-4 m-0">
            <Selector
              label="Estilo"
              options={hairOptions}
              value={value.avatar_hair_key}
              onChange={(k) => set("avatar_hair_key", k)}
            />
            <ColorSelector
              label="Cor"
              options={hairColorOptions}
              value={value.avatar_hair_color}
              onChange={(k) => set("avatar_hair_color", k)}
            />
          </TabsContent>

          <TabsContent value="roupa" className="space-y-4 m-0">
            <Selector
              label="Roupa (parte superior)"
              options={outfitOptions}
              value={value.avatar_outfit_key}
              onChange={(k) => set("avatar_outfit_key", k)}
            />
            <ColorSelector
              label="Cor da roupa"
              options={outfitColorOptions}
              value={value.avatar_outfit_color}
              onChange={(k) => set("avatar_outfit_color", k)}
            />
            <ColorSelector
              label="Parte inferior"
              options={bottomOptions}
              value={value.avatar_bottom_key}
              onChange={(k) => set("avatar_bottom_key", k)}
            />
            <ColorSelector
              label="Sapato"
              options={shoesOptions}
              value={value.avatar_shoes_key}
              onChange={(k) => set("avatar_shoes_key", k)}
            />
          </TabsContent>

          <TabsContent value="acessorios" className="space-y-4 m-0">
            <ColorSelector
              label="Brinco"
              options={earringOptions}
              value={value.avatar_earring_key}
              onChange={(k) => set("avatar_earring_key", k)}
            />
            <Selector
              label="Óculos"
              options={glassesOptions}
              value={value.avatar_glasses_key}
              onChange={(k) => set("avatar_glasses_key", k)}
            />
            <Selector
              label="Chapéu / capacete"
              options={hatOptions}
              value={value.avatar_hat_key}
              onChange={(k) => set("avatar_hat_key", k)}
            />
          </TabsContent>

          <TabsContent value="maquiagem" className="space-y-4 m-0">
            <ColorSelector
              label="Batom"
              options={lipstickOptions}
              value={value.avatar_lipstick_key}
              onChange={(k) => set("avatar_lipstick_key", k)}
            />
          </TabsContent>

          <TabsContent value="trabalho" className="space-y-4 m-0">
            <Selector
              label="Acessório de setor"
              options={toolOptions}
              value={value.avatar_tool_key}
              onChange={(k) => set("avatar_tool_key", k)}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

// -------- selectors --------
const Selector = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: AvatarOption[];
  value: string | null | undefined;
  onChange: (k: string) => void;
}) => (
  <div>
    <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={`text-xs px-2.5 py-1.5 rounded-md border transition ${
              active
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background hover:bg-accent text-muted-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  </div>
);

const ColorSelector = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: AvatarColorOption[];
  value: string | null | undefined;
  onChange: (k: string) => void;
}) => (
  <div>
    <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
    <div className="mt-1.5 flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.key === value;
        const isEmpty = !o.value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            title={o.label}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition ${
              active
                ? "border-primary ring-2 ring-primary/30"
                : "border-border hover:bg-accent"
            }`}
          >
            <span
              className="w-4 h-4 rounded-sm border"
              style={{
                background: isEmpty
                  ? "repeating-linear-gradient(45deg,#ccc,#ccc 2px,#fff 2px,#fff 4px)"
                  : o.value,
              }}
            />
            <span className="text-muted-foreground">{o.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);
