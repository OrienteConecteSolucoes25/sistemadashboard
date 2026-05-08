import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Send, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { useMateriais } from "../hooks/useMateriais";
import { useFieldOptions } from "../hooks/useFieldOptions";

interface Item {
  material_id?: string;
  descricao: string;
  categoria?: string;
  unidade: string;
  quantidade: string;
  custom?: boolean;
}

const UNIDADES = ["UN", "PC", "M", "M²", "M³", "KG", "L", "CX", "PCT", "PAR", "RL", "BR"];

export function SolicitanteTab({ rows, onCreated }: { rows: any[]; onCreated: () => void }) {
  const { items: catalogo } = useMateriais();
  const tipos = useFieldOptions("tipo");
  const coords = useFieldOptions("coordenador");
  const clientes = useFieldOptions("cliente");
  const ccCadastro = useFieldOptions("centro_custo"); // cliente -> { centro_custo }
  const categorias = useFieldOptions("categoria");
  const compradores = useFieldOptions("comprador");
  const escopos = useFieldOptions("escopo");

  const [tipo, setTipo] = useState("");
  const [coord, setCoord] = useState("");
  const [cliente, setCliente] = useState("");
  const [cc, setCc] = useState("");
  const [categoria, setCategoria] = useState("");
  const [contaFin, setContaFin] = useState("");
  const [comprador, setComprador] = useState("");
  const [escopo, setEscopo] = useState("");
  const [site, setSite] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [auxiliar, setAuxiliar] = useState("");
  const [dataSol, setDataSol] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [equipe, setEquipe] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [endereco, setEndereco] = useState("");
  const [obs, setObs] = useState("");
  const [anexo, setAnexo] = useState<File | null>(null);

  const [itens, setItens] = useState<Item[]>([]);
  const [novoItem, setNovoItem] = useState<Item>({ descricao: "", unidade: "UN", quantidade: "1" });

  const [sites, setSites] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { (async () => {
    const { data } = await supabase.from("eng_sites").select("id,nome,codigo,cidade,uf").order("nome");
    setSites(data || []);
    try {
      const { data: cs } = await (supabase as any).from("companies").select("id,nome").eq("ativo", true).order("nome");
      setEmpresas(cs || []);
    } catch { /* opcional */ }
  })(); }, []);

  // Equipes vinculadas à empresa selecionada (busca por gestor/equipe em hrdp_employees, fallback livre)
  useEffect(() => {
    (async () => {
      if (!empresa) { setEquipes([]); return; }
      try {
        const { data } = await (supabase as any)
          .from("hrdp_employees")
          .select("id,nome,cargo,equipe,company_id")
          .eq("company_id", empresa)
          .limit(300);
        setEquipes(data || []);
      } catch { setEquipes([]); }
    })();
  }, [empresa]);

  // Auto-preencher CC quando cliente muda (prioriza cadastro centro_custo)
  useEffect(() => {
    if (!cliente) return;
    const ccMeta = ccCadastro.findMeta(cliente);
    const cliMeta = clientes.findMeta(cliente);
    const v = ccMeta?.centro_custo || cliMeta?.cc || "";
    if (v) setCc(String(v));
  }, [cliente, clientes, ccCadastro]);

  // Auto-preencher Comprador, Conta Financeira e SLA quando categoria muda
  useEffect(() => {
    if (!categoria) return;
    const meta = categorias.findMeta(categoria);
    if (meta?.comprador) setComprador(String(meta.comprador));
    let conta = meta?.conta_financeira ? String(meta.conta_financeira) : "";
    if (!conta) {
      // fallback: tenta do catálogo de materiais (primeiro material com essa categoria)
      const mat = catalogo.find((m) => m.categoria === categoria && m.conta_financeira);
      if (mat) conta = mat.conta_financeira;
    }
    if (conta) setContaFin(conta);
    if (meta?.sla_dias && dataSol) {
      const base = new Date(dataSol);
      base.setDate(base.getDate() + Number(meta.sla_dias));
      setDataLimite(base.toISOString().slice(0, 10));
    }
  }, [categoria, dataSol, categorias, catalogo]);

  // Auto cidade/UF do site
  useEffect(() => {
    const s = sites.find((x) => x.nome === site || x.codigo === site);
    if (s) {
      if (s.cidade) setCidade(s.cidade);
      if (s.uf) setUf(s.uf);
    }
  }, [site, sites]);

  const addItemAtual = () => {
    if (!novoItem.descricao.trim()) return toast.error("Selecione/descreva o material");
    setItens([...itens, novoItem]);
    setNovoItem({ descricao: "", unidade: "UN", quantidade: "1" });
  };
  const removeItem = (i: number) => setItens(itens.filter((_, idx) => idx !== i));

  const escolherDoCatalogo = (descricao: string) => {
    const mat = catalogo.find((c) => c.descricao === descricao);
    if (mat) {
      setNovoItem({
        material_id: mat.id,
        descricao: mat.descricao,
        categoria: mat.categoria,
        unidade: mat.unidade || "UN",
        quantidade: novoItem.quantidade || "1",
      });
      // Auto-define categoria e conta financeira a partir do material escolhido
      if (mat.categoria) setCategoria(mat.categoria);
      if (mat.conta_financeira) {
        setContaFin(mat.conta_financeira);
      } else if (mat.categoria) {
        // fallback: pega conta da categoria cadastrada ou de outro material da mesma categoria
        const metaCat = categorias.findMeta(mat.categoria);
        if (metaCat?.conta_financeira) setContaFin(String(metaCat.conta_financeira));
        else {
          const outro = catalogo.find((m) => m.categoria === mat.categoria && m.conta_financeira);
          if (outro) setContaFin(outro.conta_financeira);
        }
      }
    } else {
      setNovoItem({ ...novoItem, descricao });
    }
  };

  const adicionarOutroMaterial = () => {
    const desc = prompt("Descrição do novo material (será adicionado ao catálogo)");
    if (!desc) return;
    setItens([...itens, { descricao: desc.trim(), unidade: "UN", quantidade: "1", custom: true }]);
  };

  const enviar = async () => {
    if (!tipo) return toast.error("Selecione o tipo de solicitação");
    if (!coord) return toast.error("Selecione o coordenador/analista");
    if (!cliente) return toast.error("Selecione o cliente");
    if (!categoria) return toast.error("Selecione a categoria");
    if (!escopo) return toast.error("Selecione o escopo de engenharia");
    if (!site.trim()) return toast.error("Informe o site/obra");
    if (!cidade.trim()) return toast.error("Informe a cidade");
    if (!dataSol) return toast.error("Informe a data de solicitação");
    if (!dataLimite) return toast.error("Informe a data limite");
    if (!endereco.trim()) return toast.error("Informe o endereço de entrega");
    if (itens.length === 0) return toast.error("Adicione ao menos 1 item");

    setEnviando(true);
    try {
      // 1. Garante site
      let siteId: string | null = null;
      const exist = sites.find((s) => (s.nome || "").toLowerCase() === site.trim().toLowerCase()
        || (s.codigo || "").toLowerCase() === site.trim().toLowerCase());
      if (exist) {
        siteId = exist.id;
      } else {
        const { data: novoSite } = await supabase.from("eng_sites").insert({
          nome: site.trim(), cidade, uf,
        } as any).select("id").single();
        siteId = novoSite?.id ?? null;
      }

      // 2. Upload do anexo (se houver)
      let anexoUrl: string | null = null;
      if (anexo) {
        const path = `${Date.now()}_${anexo.name.replace(/[^\w.\-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("eng-suprimentos").upload(path, anexo);
        if (upErr) toast.warning("Anexo não enviado: " + upErr.message);
        else anexoUrl = path;
      }

      // 3. Adiciona materiais "outros" ao catálogo
      const customs = itens.filter((i) => i.custom && !i.material_id);
      if (customs.length > 0) {
        for (const c of customs) {
          await supabase.from("eng_shared_records").insert({
            kind: "cad_materiais",
            data: {
              CODIGO: "",
              "CONTA FINANCEIRA": "",
              CATEGORIA: categoria,
              "DESCRIÇÃO": c.descricao,
              UNIDADE: c.unidade,
            },
          } as any);
        }
      }

      // 4. Cria solicitação
      const numero = `SOL-${Date.now().toString().slice(-6)}`;
      const descricao = itens.map((i) => `• ${i.quantidade} ${i.unidade} - ${i.descricao}`).join("\n");
      const { error } = await supabase.from("eng_suprimentos").insert({
        numero,
        descricao,
        solicitante: auxiliar || coord,
        responsavel: comprador,
        status: "pendente_sc",
        prazo: dataLimite,
        itens: itens as any,
        data: {
          tipo, coord, cliente, cc, categoria, conta_financeira: contaFin, comprador, escopo,
          site, site_id: siteId, cidade, uf,
          auxiliar, data_sol: dataSol, data_limite: dataLimite,
          equipe, empresa, endereco, obs, anexo: anexoUrl,
        } as any,
      });
      if (error) throw error;
      toast.success(`Solicitação ${numero} criada (pendente de SC/RC)`);

      // reset
      setTipo(""); setCoord(""); setCliente(""); setCc(""); setCategoria(""); setContaFin(""); setComprador("");
      setEscopo(""); setSite(""); setCidade(""); setUf(""); setAuxiliar("");
      setDataSol(""); setDataLimite(""); setEquipe(""); setEmpresa(""); setEndereco(""); setObs("");
      setAnexo(null); setItens([]);
      onCreated();
    } catch (e: any) {
      toast.error("Erro: " + (e?.message ?? e));
    } finally {
      setEnviando(false);
    }
  };

  const catalogoFiltrado = useMemo(() => catalogo.slice(0, 800), [catalogo]);

  return (
    <Card className="card-elegant">
      <CardContent className="pt-4 space-y-4">
        <h3 className="font-display font-semibold text-base">Nova solicitação — Dados gerais</h3>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Tipo de solicitação *">
            <SelectBox value={tipo} onChange={setTipo} options={tipos.options} />
          </Field>
          <Field label="Coordenador / analista *">
            <SelectBox value={coord} onChange={setCoord} options={coords.options} />
          </Field>

          <Field label="Cliente *">
            <SelectBox value={cliente} onChange={setCliente} options={clientes.options} />
          </Field>
          <Field label="Centro de custo (auto)">
            <Input value={cc} onChange={(e) => setCc(e.target.value)} />
          </Field>

          <Field label="Comprador (editável)">
            <SelectBox value={comprador} onChange={setComprador} options={compradores.options} />
          </Field>
          <Field label="Escopo de engenharia *">
            <SelectBox value={escopo} onChange={setEscopo} options={escopos.options} />
          </Field>
          <Field label="Site / obra *" hint="Se já existe, cidade/UF preenchem automaticamente. Caso contrário, será criado em 'Obras'.">
            <Input list="sites-list" value={site} onChange={(e) => setSite(e.target.value)} placeholder="Digite ou selecione…" />
            <datalist id="sites-list">
              {sites.map((s) => <option key={s.id} value={s.nome || s.codigo} />)}
            </datalist>
          </Field>

          <Field label="Cidade *">
            <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
          </Field>
          <Field label="UF">
            <Input value={uf} onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))} maxLength={2} />
          </Field>

          <Field label="Auxiliar (requisitante)">
            <Input value={auxiliar} onChange={(e) => setAuxiliar(e.target.value)} placeholder="Nome do auxiliar / requisitante" />
          </Field>
          <Field label="Data solicitação coordenador *">
            <Input type="date" value={dataSol} onChange={(e) => setDataSol(e.target.value)} />
          </Field>

          <Field label="Data limite entrega coordenador *">
            <Input type="date" value={dataLimite} onChange={(e) => setDataLimite(e.target.value)} />
          </Field>
          <Field label="Empresa">
            <Select value={empresa} onValueChange={setEmpresa}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {empresas.length === 0 && <SelectItem value="__none" disabled>Nenhuma empresa</SelectItem>}
                {empresas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Equipe">
            {equipes.length > 0 ? (
              <Select value={equipe} onValueChange={setEquipe}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  {equipes.map((t) => <SelectItem key={t.id} value={t.equipe || t.nome}>{t.equipe || t.nome}{t.cargo ? ` — ${t.cargo}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={equipe} onChange={(e) => setEquipe(e.target.value)} placeholder={empresa ? "Sem equipes vinculadas" : "Selecione a empresa primeiro (opcional)"} />
            )}
          </Field>
        </div>

        <Field label="Endereço de entrega do material *">
          <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        </Field>

        <Field label="Observações">
          <Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
        </Field>

        <Field label="Anexo">
          <div className="flex items-center gap-2">
            <Input type="file" onChange={(e) => setAnexo(e.target.files?.[0] || null)} />
            {anexo && <Badge variant="secondary"><Paperclip className="w-3 h-3 mr-1" />{anexo.name}</Badge>}
          </div>
        </Field>

        {/* Itens / Materiais */}
        <div className="border rounded-md p-3 bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Itens / Materiais ({itens.length})</h4>
            <Button size="sm" variant="outline" onClick={adicionarOutroMaterial}>
              Outros (novo material)
            </Button>
          </div>

          {/* Categoria + Conta financeira atrelados aos itens */}
          <div className="grid gap-2 md:grid-cols-12">
            <div className="md:col-span-6">
              <Label className="text-[10px]">Categoria *</Label>
              <SelectBox value={categoria} onChange={setCategoria} options={categorias.options} />
            </div>
            <div className="md:col-span-6">
              <Label className="text-[10px]">Conta financeira (auto)</Label>
              <Input value={contaFin} onChange={(e) => setContaFin(e.target.value)} placeholder="Preenchido automaticamente pela categoria/material" />
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-12 items-end">
            <div className="md:col-span-7">
              <Label className="text-[10px]">Descrição do material</Label>
              <Input
                list="cat-mat-list"
                value={novoItem.descricao}
                onChange={(e) => escolherDoCatalogo(e.target.value)}
                placeholder="Digite para buscar…"
              />
              <datalist id="cat-mat-list">
                {catalogoFiltrado.map((m) => (
                  <option key={m.id} value={m.descricao}>{m.codigo} — {m.categoria}</option>
                ))}
              </datalist>
            </div>
            <div className="md:col-span-2">
              <Label className="text-[10px]">Unidade</Label>
              <Select value={novoItem.unidade} onValueChange={(v) => setNovoItem({ ...novoItem, unidade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
              <Label className="text-[10px]">Qtd</Label>
              <Input value={novoItem.quantidade} onChange={(e) => setNovoItem({ ...novoItem, quantidade: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Button size="sm" onClick={addItemAtual} className="w-full">
                <Plus className="w-4 h-4 mr-1" />Adicionar
              </Button>
            </div>
          </div>

          {itens.length > 0 && (
            <div className="border rounded-md overflow-hidden bg-background">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="text-left px-2 py-1.5">Descrição</th>
                    <th className="text-left px-2 py-1.5 w-20">Unid.</th>
                    <th className="text-left px-2 py-1.5 w-16">Qtd</th>
                    <th className="text-right px-2 py-1.5 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((it, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1">
                        {it.descricao} {it.custom && <Badge variant="outline" className="ml-1 text-[9px]">novo</Badge>}
                      </td>
                      <td className="px-2 py-1">{it.unidade}</td>
                      <td className="px-2 py-1">{it.quantidade}</td>
                      <td className="px-2 py-1 text-right">
                        <Button size="icon" variant="ghost" onClick={() => removeItem(i)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button onClick={enviar} disabled={enviando}>
            <Send className="w-4 h-4 mr-1" />{enviando ? "Enviando…" : "Enviar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SelectBox({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
      <SelectContent>
        {options.length === 0 && <SelectItem value="__empty" disabled>Nenhum cadastro</SelectItem>}
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
