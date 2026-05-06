import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImgIcon } from "lucide-react";
import { toast } from "sonner";

const sb: any = supabase;

export default function BrandingTab({ companyId }: { companyId: string }) {
  const [b, setB] = useState<any>({ company_id: companyId, primary_color: "#2BBDC0", rodape: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sb.from("company_branding").select("*").eq("company_id", companyId).maybeSingle().then(({ data }: any) => {
      if (data) setB(data);
    });
  }, [companyId]);

  async function upload(field: "logo_url" | "letterhead_url", file: File) {
    setBusy(true);
    const ext = file.name.split(".").pop();
    const path = `${companyId}/${field}-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from("company-branding").upload(path, file, { upsert: true });
    if (error) { setBusy(false); return toast.error(error.message); }
    const { data } = sb.storage.from("company-branding").getPublicUrl(path);
    setB((s: any) => ({ ...s, [field]: data.publicUrl }));
    setBusy(false);
  }

  async function save() {
    const payload = { ...b, company_id: companyId, updated_at: new Date().toISOString() };
    const { error } = await sb.from("company_branding").upsert(payload, { onConflict: "company_id" });
    if (error) return toast.error(error.message);
    toast.success("Branding salvo");
  }

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><ImgIcon className="w-4 h-4" /> Identidade visual</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Logotipo</Label>
            {b.logo_url && <img src={b.logo_url} alt="logo" className="h-20 object-contain border rounded p-2 bg-card" />}
            <Input type="file" accept="image/*" disabled={busy} onChange={(e) => e.target.files?.[0] && upload("logo_url", e.target.files[0])} />
          </div>
          <div className="space-y-2">
            <Label>Papel timbrado (cabeçalho)</Label>
            {b.letterhead_url && <img src={b.letterhead_url} alt="papel" className="h-20 object-contain border rounded p-2 bg-card" />}
            <Input type="file" accept="image/*" disabled={busy} onChange={(e) => e.target.files?.[0] && upload("letterhead_url", e.target.files[0])} />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Cor primária</Label>
            <Input type="color" value={b.primary_color || "#2BBDC0"} onChange={(e) => setB({ ...b, primary_color: e.target.value })} className="h-10 w-24" />
          </div>
          <div>
            <Label>Rodapé / assinatura</Label>
            <Input value={b.rodape || ""} onChange={(e) => setB({ ...b, rodape: e.target.value })} placeholder="Ex: Empresa X · CNPJ ..." />
          </div>
        </div>
        <Button onClick={save}><Upload className="w-4 h-4 mr-1" /> Salvar branding</Button>
        <p className="text-xs text-muted-foreground">Esses ativos serão usados nos relatórios exportados (Excel, Word e PowerPoint) da sua empresa.</p>
      </CardContent>
    </Card>
  );
}
