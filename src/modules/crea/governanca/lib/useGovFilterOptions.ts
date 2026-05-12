import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const sb: any = supabase;

export type GovFilterOptions = {
  ufs: string[];
  anos: number[];
  meses: number[];
  cidades: string[];
  obras: string[];
  rts: string[];
  numeros: string[];
};

const EMPTY: GovFilterOptions = {
  ufs: [], anos: [], meses: [], cidades: [], obras: [], rts: [], numeros: [],
};

const UFS_BR = new Set([
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
]);
function pushUF(set: Set<string>, ...vals: any[]) {
  const tryAdd = (cand: string) => {
    const u = cand.toUpperCase();
    if (UFS_BR.has(u)) set.add(u);
  };
  for (const v of vals) {
    const s = String(v ?? "").trim();
    if (!s) continue;
    if (/^[A-Za-z]{2}$/.test(s)) { tryAdd(s); continue; }
    // Prioriza padrão "Cidade/UF"
    const m2 = s.match(/\/\s*([A-Za-z]{2})\b/);
    if (m2) { tryAdd(m2[1]); continue; }
    // Procura qualquer ocorrência válida de UF brasileira como palavra isolada
    const matches = s.toUpperCase().match(/\b[A-Z]{2}\b/g) ?? [];
    for (const m of matches) tryAdd(m);
  }
}
function pushTxt(set: Set<string>, ...vals: any[]) {
  for (const v of vals) {
    const s = String(v ?? "").trim();
    if (s) set.add(s);
  }
}
function pushPessoa(set: Set<string>, ...vals: any[]) {
  for (const v of vals) {
    const s = String(v ?? "").trim();
    if (!s) continue;
    set.add(s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, " "));
  }
}
function pushDate(set: Set<string>, ...vals: any[]) {
  for (const v of vals) {
    if (!v) continue;
    const s = String(v);
    const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (iso) { set.add(`${iso[1]}-${iso[2]}-${iso[3]}`); continue; }
    const br = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (br) {
      let [, dd, mm, yy] = br;
      if (yy.length === 2) yy = (Number(yy) > 70 ? "19" : "20") + yy;
      set.add(`${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`);
    }
  }
}

/** Carrega opções distintas a partir das 4 sub-abas para alimentar selects. */
export function useGovFilterOptions(companyId: string | null, refreshKey: number = 0) {
  const [opts, setOpts] = useState<GovFilterOptions>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) { setOpts(EMPTY); return; }
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const base = (t: string, cols: string) => sb.from(t).select(cols)
          .eq("company_id", companyId).eq("is_deleted", false).limit(5000);
        const [s, b, r, t] = await Promise.all([
          base("crea_gov_servicos", "uf_obra,uf_contrato,cidade_obra,cidade_contrato,endereco,responsavel_tecnico,numero,art,cadastro,pagamento,data_inicio").then((x: any) => x.data ?? []),
          base("crea_gov_art_bloco", "uf_obra,uf_contrato,cidade_obra,cidade_contrato,endereco_obra,endereco_contrato,responsavel_tecnico,numero_art,data_inicio,celebrado_em,data_solicitacao").then((x: any) => x.data ?? []),
          base("crea_gov_relatorio_crea", "enderecos,art,numero,data_inicio,cadastro").then((x: any) => x.data ?? []),
          base("crea_gov_arts_todas", "endereco,numero,cadastro,pagamento").then((x: any) => x.data ?? []),
        ]);

        const ufs = new Set<string>();
        const cidades = new Set<string>();
        const obras = new Set<string>();
        const rts = new Set<string>();
        const numeros = new Set<string>();
        const datas = new Set<string>();

        s.forEach((r: any) => {
          pushUF(ufs, r.uf_obra, r.uf_contrato, r.endereco);
          pushTxt(cidades, r.cidade_obra, r.cidade_contrato);
          pushTxt(obras, r.endereco);
          pushPessoa(rts, r.responsavel_tecnico);
          pushTxt(numeros, r.art, r.numero);
          pushDate(datas, r.cadastro, r.pagamento, r.data_inicio);
        });
        b.forEach((r: any) => {
          pushUF(ufs, r.uf_obra, r.uf_contrato, r.endereco_obra, r.endereco_contrato);
          pushTxt(cidades, r.cidade_obra, r.cidade_contrato);
          pushTxt(obras, r.endereco_obra, r.endereco_contrato);
          pushPessoa(rts, r.responsavel_tecnico);
          pushTxt(numeros, r.numero_art);
          pushDate(datas, r.data_inicio, r.celebrado_em, r.data_solicitacao);
        });
        r.forEach((r: any) => {
          pushUF(ufs, r.enderecos);
          const cm = String(r.enderecos ?? "").match(/-\s*([A-Za-zÀ-ú\s]+)\s*\/\s*[A-Z]{2}/);
          if (cm) pushTxt(cidades, cm[1].trim());
          pushTxt(obras, r.enderecos);
          pushTxt(numeros, r.art, r.numero);
          pushDate(datas, r.data_inicio, r.cadastro);
        });
        t.forEach((r: any) => {
          pushUF(ufs, r.endereco);
          const cm = String(r.endereco ?? "").match(/-\s*([A-Za-zÀ-ú\s]+)\s*\/\s*[A-Z]{2}/);
          if (cm) pushTxt(cidades, cm[1].trim());
          pushTxt(obras, r.endereco);
          pushTxt(numeros, r.numero);
          pushDate(datas, r.cadastro, r.pagamento);
        });

        const anosSet = new Set<number>();
        const mesesSet = new Set<number>();
        datas.forEach((d) => {
          anosSet.add(Number(d.slice(0, 4)));
          mesesSet.add(Number(d.slice(5, 7)));
        });

        const sorted = (set: Set<string>) =>
          Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR"));

        if (cancel) return;
        setOpts({
          ufs: Array.from(ufs).sort(),
          anos: Array.from(anosSet).filter((n) => n > 1900 && n < 2100).sort((a, b) => b - a),
          meses: Array.from(mesesSet).filter((n) => n >= 1 && n <= 12).sort((a, b) => a - b),
          cidades: sorted(cidades),
          obras: sorted(obras),
          rts: sorted(rts),
          numeros: sorted(numeros),
        });
      } catch {
        if (!cancel) setOpts(EMPTY);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [companyId, refreshKey]);

  return { opts, loading };
}
