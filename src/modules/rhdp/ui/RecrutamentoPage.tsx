import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserSearch, Plus, Briefcase, MessageSquareText, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHrdpCompany } from "../hooks/useHrdpCompany";

const sb: any = supabase;

const PIPELINE = [
  { v: "novo", l: "Novo" },
  { v: "triagem", l: "Triagem" },
  { v: "entrevista_rh", l: "Entrevista RH" },
  { v: "entrevista_tecnica", l: "Entrevista Técnica" },
  { v: "proposta", l: "Proposta" },
  { v: "contratado", l: "Contratado" },
  { v: "reprovado", l: "Reprovado" },
];
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  novo: "secondary", triagem: "secondary",
  entrevista_rh: "default", entrevista_tecnica: "default",
  proposta: "default", contratado: "outline", reprovado: "destructive",
};

type Candidate = {
  id: string; nome: string; email?: string|null; telefone?: string|null;
  vaga?: string|null; area?: string|null; origem?: string|null;
  status: string; etapa?: string|null; score: number|null;
  pretensao_salarial?: number|null; observacoes?: string|null;
  consentimento_lgpd?: boolean; tags?: string[]|null;
};
type Question = { id: string; pergunta: string; categoria?: string|null; peso: number; ordem: number; ativo: boolean; vaga?: string|null; area?: string|null; };
type Interview = {
  id: string; candidate_id: string; entrevistador_nome?: string|null;
  etapa?: string|null; data_agendada?: string|null; status: string;
  parecer?: string|null; recomendacao?: string|null; score_final: number|null;
  respostas: any[];
};

export default function RecrutamentoPage() {
  const { user } = useAuth();
  const { companyId, ready } = useHrdpCompany();
  const [cands, setCands] = useState<Candidate[]>([]);
  const [qs, setQs] = useState<Question[]>([]);
  const [ivs, setIvs] = useState<Interview[]>([]);
  const [editC, setEditC] = useState<Partial<Candidate> | null>(null);
  const [editQ, setEditQ] = useState<Partial<Question> | null>(null);
  const [editI, setEditI] = useState<(Partial<Interview> & { _candidato?: Candidate }) | null>(null);

  async function load() {
    if (!companyId) return;
    const [c, q, i] = await Promise.all([
      sb.from("hrdp_candidates").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false }),
      sb.from("hrdp_interview_questions").select("*").eq("company_id", companyId).order("ordem"),
      sb.from("hrdp_interviews").select("*").eq("company_id", companyId).order("data_agendada", { ascending: false }),
    ]);
    setCands(c.data ?? []); setQs(q.data ?? []); setIvs(i.data ?? []);
  }
  useEffect(() => { if (ready) load(); }, [ready, companyId]);

  const candById = useMemo(() => Object.fromEntries(cands.map(c => [c.id, c])), [cands]);

  const kpis = useMemo(() => {
    const k = { total: cands.length, ativos: 0, contratados: 0, reprovados: 0, entrevistas: ivs.length };
    for (const c of cands) {
      if (c.status === "contratado") k.contratados++;
      else if (c.status === "reprovado") k.reprovados++;
      else k.ativos++;
    }
    return k;
  }, [cands, ivs]);

  async function saveCand() {
    if (!editC || !companyId) return;
    if (!editC.nome) return toast.error("Nome é obrigatório");
    const payload: any = { ...editC, company_id: companyId };
    delete payload.id;
    const q = editC.id
      ? sb.from("hrdp_candidates").update(payload).eq("id", editC.id)
      : sb.from("hrdp_candidates").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success("Candidato salvo"); setEditC(null); load();
  }

  async function saveQuestion() {
    if (!editQ || !companyId) return;
    if (!editQ.pergunta) return toast.error("Pergunta é obrigatória");
    const payload: any = {
      company_id: companyId,
      pergunta: editQ.pergunta,
      categoria: editQ.categoria ?? null,
      vaga: editQ.vaga ?? null,
      area: editQ.area ?? null,
      peso: editQ.peso ?? 1,
      ordem: editQ.ordem ?? 0,
      ativo: editQ.ativo ?? true,
    };
    const q = editQ.id
      ? sb.from("hrdp_interview_questions").update(payload).eq("id", editQ.id)
      : sb.from("hrdp_interview_questions").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success("Pergunta salva"); setEditQ(null); load();
  }

  function startInterview(cand: Candidate) {
    const respostas = qs.filter(q => q.ativo).map(q => ({ question_id: q.id, pergunta: q.pergunta, peso: q.peso, nota: 0, comentario: "" }));
    setEditI({ candidate_id: cand.id, status: "agendada", score_final: 0, respostas, _candidato: cand });
  }

  async function saveInterview() {
    if (!editI || !companyId) return;
    const respostas = editI.respostas ?? [];
    const totalPeso = respostas.reduce((s: number, r: any) => s + (r.peso || 1), 0) || 1;
    const score = respostas.reduce((s: number, r: any) => s + (Number(r.nota || 0) * (r.peso || 1)), 0) / totalPeso;
    const payload: any = {
      company_id: companyId,
      candidate_id: editI.candidate_id,
      entrevistador_id: user?.id,
      entrevistador_nome: editI.entrevistador_nome ?? null,
      etapa: editI.etapa ?? null,
      data_agendada: editI.data_agendada ?? new Date().toISOString(),
      status: editI.status ?? "realizada",
      parecer: editI.parecer ?? null,
      recomendacao: editI.recomendacao ?? null,
      score_final: Math.round(score * 100) / 100,
      respostas,
    };
    const q = editI.id
      ? sb.from("hrdp_interviews").update(payload).eq("id", editI.id)
      : sb.from("hrdp_interviews").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    if (editI.candidate_id) {
      await sb.from("hrdp_candidates").update({ score: payload.score_final }).eq("id", editI.candidate_id);
    }
    toast.success("Entrevista salva"); setEditI(null); load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserSearch className="w-6 h-6 text-primary" /> Recrutamento
          </h1>
          <p className="text-sm text-muted-foreground">
            Banco de currículos, pipeline de seleção e entrevistas com perguntas padronizadas.
          </p>
        </div>
        <Button onClick={() => setEditC({ status: "novo", consentimento_lgpd: true })}>
          <Plus className="w-4 h-4 mr-1" /> Novo candidato
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi title="Candidatos" value={kpis.total} />
        <Kpi title="Ativos" value={kpis.ativos} />
        <Kpi title="Contratados" value={kpis.contratados} />
        <Kpi title="Reprovados" value={kpis.reprovados} />
        <Kpi title="Entrevistas" value={kpis.entrevistas} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">LGPD</CardTitle></CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Currículos de candidatos não contratados devem ser removidos em até 24 meses. Mantenha a base atualizada.
        </CardContent>
      </Card>

      <Tabs defaultValue="candidatos">
        <TabsList>
          <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="entrevistas">Entrevistas</TabsTrigger>
          <TabsTrigger value="perguntas">Perguntas padrão</TabsTrigger>
        </TabsList>

        <TabsContent value="candidatos">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead><TableHead>Vaga</TableHead><TableHead>Área</TableHead>
                <TableHead>Origem</TableHead><TableHead>Score</TableHead><TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {cands.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum candidato cadastrado</TableCell></TableRow>}
                {cands.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}<div className="text-xs text-muted-foreground">{c.email}</div></TableCell>
                    <TableCell>{c.vaga ?? "—"}</TableCell>
                    <TableCell>{c.area ?? "—"}</TableCell>
                    <TableCell className="text-xs">{c.origem ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{Number(c.score ?? 0).toFixed(1)}</Badge></TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{PIPELINE.find(p => p.v === c.status)?.l ?? c.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="outline" onClick={() => startInterview(c)}>
                        <MessageSquareText className="w-3 h-3 mr-1" /> Entrevistar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditC(c)}>Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="pipeline">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3">
            {PIPELINE.map(col => {
              const items = cands.filter(c => c.status === col.v);
              return (
                <Card key={col.v}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center justify-between">
                      <span>{col.l}</span>
                      <Badge variant="outline">{items.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {items.map(c => (
                      <div key={c.id} className="rounded border p-2 text-xs cursor-pointer hover:bg-accent" onClick={() => setEditC(c)}>
                        <div className="font-medium truncate">{c.nome}</div>
                        <div className="text-muted-foreground truncate">{c.vaga ?? "—"}</div>
                        <div className="flex items-center gap-1 mt-1"><Star className="w-3 h-3" /> {Number(c.score ?? 0).toFixed(1)}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="entrevistas">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Candidato</TableHead><TableHead>Etapa</TableHead><TableHead>Data</TableHead>
                <TableHead>Entrevistador</TableHead><TableHead>Score</TableHead><TableHead>Recomendação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {ivs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma entrevista registrada</TableCell></TableRow>}
                {ivs.map(iv => (
                  <TableRow key={iv.id}>
                    <TableCell>{candById[iv.candidate_id]?.nome ?? "—"}</TableCell>
                    <TableCell className="text-xs">{iv.etapa ?? "—"}</TableCell>
                    <TableCell className="text-xs">{iv.data_agendada ? new Date(iv.data_agendada).toLocaleString("pt-BR") : "—"}</TableCell>
                    <TableCell className="text-xs">{iv.entrevistador_nome ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{Number(iv.score_final ?? 0).toFixed(2)}</Badge></TableCell>
                    <TableCell className="text-xs">{iv.recomendacao ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditI({ ...iv, _candidato: candById[iv.candidate_id] })}>Abrir</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="perguntas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Briefcase className="w-4 h-4" /> Perguntas padrão</CardTitle>
              <Button size="sm" onClick={() => setEditQ({ peso: 1, ordem: qs.length, ativo: true })}>
                <Plus className="w-4 h-4 mr-1" /> Nova pergunta
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Pergunta</TableHead><TableHead>Categoria</TableHead>
                  <TableHead>Vaga/Área</TableHead><TableHead>Peso</TableHead>
                  <TableHead>Ativo</TableHead><TableHead className="text-right">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {qs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma pergunta cadastrada</TableCell></TableRow>}
                  {qs.map(q => (
                    <TableRow key={q.id}>
                      <TableCell className="max-w-[420px]">{q.pergunta}</TableCell>
                      <TableCell className="text-xs">{q.categoria ?? "—"}</TableCell>
                      <TableCell className="text-xs">{[q.vaga, q.area].filter(Boolean).join(" / ") || "Geral"}</TableCell>
                      <TableCell>{q.peso}</TableCell>
                      <TableCell>{q.ativo ? "Sim" : "Não"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setEditQ(q)}>Editar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Editor candidato */}
      <Sheet open={!!editC} onOpenChange={(o) => !o && setEditC(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>{editC?.id ? "Editar candidato" : "Novo candidato"}</SheetTitle></SheetHeader>
          {editC && (
            <div className="space-y-3 mt-4">
              <div><Label>Nome</Label><Input value={editC.nome ?? ""} onChange={e => setEditC({ ...editC, nome: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input value={editC.email ?? ""} onChange={e => setEditC({ ...editC, email: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={editC.telefone ?? ""} onChange={e => setEditC({ ...editC, telefone: e.target.value })} /></div>
                <div><Label>Vaga</Label><Input value={editC.vaga ?? ""} onChange={e => setEditC({ ...editC, vaga: e.target.value })} /></div>
                <div><Label>Área</Label><Input value={editC.area ?? ""} onChange={e => setEditC({ ...editC, area: e.target.value })} /></div>
                <div><Label>Origem</Label><Input placeholder="LinkedIn, indicação..." value={editC.origem ?? ""} onChange={e => setEditC({ ...editC, origem: e.target.value })} /></div>
                <div><Label>Pretensão (R$)</Label><Input type="number" value={editC.pretensao_salarial ?? ""} onChange={e => setEditC({ ...editC, pretensao_salarial: Number(e.target.value) })} /></div>
                <div className="col-span-2">
                  <Label>Status pipeline</Label>
                  <Select value={editC.status ?? "novo"} onValueChange={(v) => setEditC({ ...editC, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PIPELINE.map(p => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Observações</Label><Textarea rows={3} value={editC.observacoes ?? ""} onChange={e => setEditC({ ...editC, observacoes: e.target.value })} /></div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" onClick={() => setEditC(null)}>Cancelar</Button>
                <Button onClick={saveCand}>Salvar</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Editor pergunta */}
      <Sheet open={!!editQ} onOpenChange={(o) => !o && setEditQ(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>{editQ?.id ? "Editar pergunta" : "Nova pergunta"}</SheetTitle></SheetHeader>
          {editQ && (
            <div className="space-y-3 mt-4">
              <div><Label>Pergunta</Label><Textarea rows={3} value={editQ.pergunta ?? ""} onChange={e => setEditQ({ ...editQ, pergunta: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Categoria</Label><Input placeholder="Comportamental..." value={editQ.categoria ?? ""} onChange={e => setEditQ({ ...editQ, categoria: e.target.value })} /></div>
                <div><Label>Peso</Label><Input type="number" min={1} max={5} value={editQ.peso ?? 1} onChange={e => setEditQ({ ...editQ, peso: Number(e.target.value) })} /></div>
                <div><Label>Vaga (opcional)</Label><Input value={editQ.vaga ?? ""} onChange={e => setEditQ({ ...editQ, vaga: e.target.value })} /></div>
                <div><Label>Área (opcional)</Label><Input value={editQ.area ?? ""} onChange={e => setEditQ({ ...editQ, area: e.target.value })} /></div>
                <div><Label>Ordem</Label><Input type="number" value={editQ.ordem ?? 0} onChange={e => setEditQ({ ...editQ, ordem: Number(e.target.value) })} /></div>
                <div>
                  <Label>Ativo</Label>
                  <Select value={String(editQ.ativo ?? true)} onValueChange={(v) => setEditQ({ ...editQ, ativo: v === "true" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="true">Sim</SelectItem><SelectItem value="false">Não</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" onClick={() => setEditQ(null)}>Cancelar</Button>
                <Button onClick={saveQuestion}>Salvar</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Editor entrevista */}
      <Sheet open={!!editI} onOpenChange={(o) => !o && setEditI(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader><SheetTitle>Entrevista — {editI?._candidato?.nome ?? candById[editI?.candidate_id ?? ""]?.nome ?? ""}</SheetTitle></SheetHeader>
          {editI && (
            <div className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Etapa</Label><Input value={editI.etapa ?? ""} onChange={e => setEditI({ ...editI, etapa: e.target.value })} /></div>
                <div><Label>Data agendada</Label><Input type="datetime-local" value={editI.data_agendada?.slice(0,16) ?? ""} onChange={e => setEditI({ ...editI, data_agendada: e.target.value })} /></div>
                <div><Label>Entrevistador</Label><Input value={editI.entrevistador_nome ?? ""} onChange={e => setEditI({ ...editI, entrevistador_nome: e.target.value })} /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={editI.status ?? "agendada"} onValueChange={(v) => setEditI({ ...editI, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agendada">Agendada</SelectItem>
                      <SelectItem value="realizada">Realizada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-sm">Perguntas e notas (0-10)</div>
                {(editI.respostas ?? []).length === 0 && <div className="text-xs text-muted-foreground">Cadastre perguntas padrão na aba "Perguntas padrão" antes de iniciar.</div>}
                {(editI.respostas ?? []).map((r: any, idx: number) => (
                  <div key={idx} className="border rounded p-2 space-y-2">
                    <div className="text-sm">{r.pergunta} <span className="text-xs text-muted-foreground">(peso {r.peso})</span></div>
                    <div className="flex gap-2 items-center">
                      <Input type="number" min={0} max={10} step={0.5} className="w-24" value={r.nota} onChange={e => {
                        const arr = [...(editI.respostas ?? [])]; arr[idx] = { ...r, nota: Number(e.target.value) }; setEditI({ ...editI, respostas: arr });
                      }} />
                      <Input placeholder="Comentário" value={r.comentario} onChange={e => {
                        const arr = [...(editI.respostas ?? [])]; arr[idx] = { ...r, comentario: e.target.value }; setEditI({ ...editI, respostas: arr });
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <Label>Recomendação</Label>
                <Select value={editI.recomendacao ?? ""} onValueChange={(v) => setEditI({ ...editI, recomendacao: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contratar">Contratar</SelectItem>
                    <SelectItem value="proxima_etapa">Próxima etapa</SelectItem>
                    <SelectItem value="banco_talentos">Banco de talentos</SelectItem>
                    <SelectItem value="reprovar">Reprovar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Parecer</Label><Textarea rows={3} value={editI.parecer ?? ""} onChange={e => setEditI({ ...editI, parecer: e.target.value })} /></div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" onClick={() => setEditI(null)}>Cancelar</Button>
                <Button onClick={saveInterview}>Salvar entrevista</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent></Card>
  );
}
