import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow, Background, Controls, MiniMap, addEdge, useEdgesState, useNodesState,
  type Connection, type Edge, type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useComunicacaoAccess } from "../hooks/useComunicacaoAccess";
import { commFlowRun } from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { Play, Plus, Save, Trash2, Workflow, Zap, FileText as FileTextIcon, ImageIcon, Clock, Megaphone } from "lucide-react";
import { FreeAiToggle } from "./FreeAiToggle";

const NODE_TYPES = [
  { type: "trigger", label: "Gatilho (manual)", icon: Zap, color: "#10b981" },
  { type: "ai_text", label: "Gerar Texto (IA grátis)", icon: FileTextIcon, color: "#2BBDC0" },
  { type: "ai_image", label: "Gerar Imagem (IA grátis)", icon: ImageIcon, color: "#a78bfa" },
  { type: "save_gallery", label: "Salvar na Galeria", icon: Megaphone, color: "#f59e0b" },
  { type: "delay", label: "Aguardar (ms)", icon: Clock, color: "#94a3b8" },
  { type: "log", label: "Log / Anotação", icon: FileTextIcon, color: "#64748b" },
];

const TEMPLATES: Record<string, { nodes: Node[]; edges: Edge[] }> = {
  linkedin_semanal: {
    nodes: [
      { id: "t", type: "default", position: { x: 50, y: 50 }, data: { label: "Gatilho", nodeType: "trigger", config: {} } },
      { id: "ai", type: "default", position: { x: 280, y: 50 }, data: { label: "Post LinkedIn longo", nodeType: "ai_text", config: { kind: "linkedin_longo", inputs: { tema: "{{inputs.tema}}", cta: "Comente abaixo" } } } },
      { id: "img", type: "default", position: { x: 540, y: 50 }, data: { label: "Capa visual", nodeType: "ai_image", config: { prompt: "Capa profissional LinkedIn sobre {{inputs.tema}}, design moderno, paleta corporativa", format: "1200x627", preferred: "pollinations" } } },
      { id: "save", type: "default", position: { x: 800, y: 50 }, data: { label: "Salvar Galeria", nodeType: "save_gallery", config: {} } },
    ],
    edges: [
      { id: "e1", source: "t", target: "ai" },
      { id: "e2", source: "ai", target: "img" },
      { id: "e3", source: "img", target: "save" },
    ],
  },
  carrossel_ig: {
    nodes: [
      { id: "t", type: "default", position: { x: 50, y: 50 }, data: { label: "Gatilho", nodeType: "trigger", config: {} } },
      { id: "ai", type: "default", position: { x: 280, y: 50 }, data: { label: "Roteiro carrossel", nodeType: "ai_text", config: { kind: "carrossel", inputs: { tema: "{{inputs.tema}}", qtd_slides: 6 } } } },
      { id: "img", type: "default", position: { x: 540, y: 50 }, data: { label: "Capa do carrossel", nodeType: "ai_image", config: { prompt: "Capa Instagram carrossel sobre {{inputs.tema}}, minimalista", format: "1080x1350", preferred: "pollinations" } } },
    ],
    edges: [
      { id: "e1", source: "t", target: "ai" },
      { id: "e2", source: "ai", target: "img" },
    ],
  },
};

function nodeStyle(nodeType: string) {
  const def = NODE_TYPES.find((n) => n.type === nodeType);
  return {
    border: `2px solid ${def?.color || "#64748b"}`,
    borderRadius: 8,
    padding: 8,
    background: "hsl(var(--card))",
    color: "hsl(var(--card-foreground))",
    fontSize: 12,
    minWidth: 160,
  };
}

export default function FluxosPage() {
  const { companyId } = useComunicacaoAccess();
  const { toast } = useToast();
  const [flows, setFlows] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState("Novo fluxo");
  const [desc, setDesc] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [selected, setSelected] = useState<Node | null>(null);
  const [running, setRunning] = useState(false);
  const [runLog, setRunLog] = useState<any[]>([]);
  const [inputs, setInputs] = useState<string>('{"tema":"lançamento do módulo CREA do ERP OCS"}');

  async function loadList() {
    if (!companyId) return;
    const { data } = await supabase.from("comm_flows").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false });
    setFlows(data ?? []);
  }
  useEffect(() => { loadList(); }, [companyId]);

  function newFlow(templateKey?: keyof typeof TEMPLATES) {
    setCurrentId(null);
    setName(templateKey ? (templateKey === "linkedin_semanal" ? "Post LinkedIn semanal" : "Carrossel Instagram") : "Novo fluxo");
    setDesc("");
    if (templateKey && TEMPLATES[templateKey]) {
      setNodes(TEMPLATES[templateKey].nodes.map((n) => ({ ...n, style: nodeStyle(n.data?.nodeType) })));
      setEdges(TEMPLATES[templateKey].edges);
    } else {
      setNodes([{ id: "t", type: "default", position: { x: 100, y: 100 }, data: { label: "Gatilho", nodeType: "trigger", config: {} }, style: nodeStyle("trigger") }]);
      setEdges([]);
    }
  }

  function loadFlow(f: any) {
    setCurrentId(f.id);
    setName(f.nome);
    setDesc(f.descricao || "");
    setNodes((f.nodes || []).map((n: any) => ({ ...n, style: nodeStyle(n.data?.nodeType as string) })));
    setEdges(f.edges || []);
    setRunLog([]);
  }

  async function saveFlow() {
    if (!companyId) return toast({ title: "Sem empresa", variant: "destructive" });
    const payload = {
      company_id: companyId, nome: name, descricao: desc,
      nodes: nodes.map(({ style, ...n }) => n), edges,
    };
    const res = currentId
      ? await supabase.from("comm_flows").update(payload).eq("id", currentId)
      : await supabase.from("comm_flows").insert(payload).select().single();
    if ((res as any).error) return toast({ title: "Erro", description: (res as any).error.message, variant: "destructive" });
    if (!currentId && (res as any).data) setCurrentId((res as any).data.id);
    toast({ title: "Fluxo salvo" });
    loadList();
  }

  async function deleteFlow() {
    if (!currentId) return;
    if (!confirm("Excluir este fluxo?")) return;
    await supabase.from("comm_flows").update({ is_deleted: true }).eq("id", currentId);
    setCurrentId(null); setNodes([]); setEdges([]); loadList();
  }

  async function run() {
    if (!currentId) { await saveFlow(); }
    if (!currentId) return;
    setRunning(true); setRunLog([]);
    try {
      let parsedInputs: any = {};
      try { parsedInputs = JSON.parse(inputs); } catch { parsedInputs = { tema: inputs }; }
      const r = await commFlowRun(currentId, parsedInputs);
      setRunLog(r.log || []);
      toast({ title: r.ok ? "Fluxo executado" : "Fluxo terminou com erro", variant: r.ok ? undefined : "destructive" });
    } catch (e: any) {
      toast({ title: "Erro ao executar", description: e.message, variant: "destructive" });
    } finally { setRunning(false); }
  }

  function addNode(type: string) {
    const def = NODE_TYPES.find((n) => n.type === type)!;
    const id = `${type}_${Date.now().toString(36)}`;
    const n: Node = {
      id, type: "default",
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: { label: def.label, nodeType: type, config: {} },
      style: nodeStyle(type),
    };
    setNodes((arr) => [...arr, n]);
  }

  function updateSelectedConfig(patch: Record<string, any>) {
    if (!selected) return;
    setNodes((arr) => arr.map((n) => n.id === selected.id ? { ...n, data: { ...n.data, config: { ...(n.data as any).config, ...patch } } } : n));
    setSelected((s) => s ? { ...s, data: { ...s.data, config: { ...((s.data as any).config || {}), ...patch } } } as Node : s);
  }

  const onConnect = useCallback((c: Connection) => setEdges((eds) => addEdge(c, eds)), [setEdges]);

  const selectedType = (selected?.data as any)?.nodeType;
  const selectedCfg = (selected?.data as any)?.config ?? {};

  const inspector = useMemo(() => {
    if (!selected) return null;
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold">Nó: {(selected.data as any).label}</div>
        {selectedType === "ai_text" && (
          <>
            <Label className="text-xs">Tipo de conteúdo</Label>
            <Select value={selectedCfg.kind || "post"} onValueChange={(v) => updateSelectedConfig({ kind: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["post","legenda","legenda_longa","linkedin_longo","linkedin_artigo","carrossel","newsletter","texto","comunicado_interno","ideia","thread_x","campanha"].map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label className="text-xs">Tema (usa {"{{inputs.tema}}"})</Label>
            <Input className="h-8 text-xs" value={selectedCfg.inputs?.tema || "{{inputs.tema}}"} onChange={(e) => updateSelectedConfig({ inputs: { ...(selectedCfg.inputs || {}), tema: e.target.value } })} />
            <Label className="text-xs">Provedor</Label>
            <Select value={selectedCfg.preferred || "auto"} onValueChange={(v) => updateSelectedConfig({ preferred: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (Gemini → Groq → GitHub)</SelectItem>
                <SelectItem value="groq">Groq Llama 3.3</SelectItem>
                <SelectItem value="github">GitHub Models GPT-4o-mini</SelectItem>
                <SelectItem value="openrouter">OpenRouter free</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
        {selectedType === "ai_image" && (
          <>
            <Label className="text-xs">Prompt</Label>
            <Textarea className="text-xs" rows={3} value={selectedCfg.prompt || ""} onChange={(e) => updateSelectedConfig({ prompt: e.target.value })} />
            <Label className="text-xs">Formato</Label>
            <Select value={selectedCfg.format || "1080x1080"} onValueChange={(v) => updateSelectedConfig({ format: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["1080x1080","1080x1920","1200x627","1600x900","1080x1350"].map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
            <Label className="text-xs">Provedor de imagem</Label>
            <Select value={selectedCfg.preferred || "pollinations"} onValueChange={(v) => updateSelectedConfig({ preferred: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pollinations">Pollinations (zero setup)</SelectItem>
                <SelectItem value="gemini">Gemini Image (chave grátis)</SelectItem>
                <SelectItem value="cloudflare">Cloudflare Flux</SelectItem>
                <SelectItem value="huggingface">Hugging Face FLUX-schnell</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
        {selectedType === "delay" && (
          <>
            <Label className="text-xs">Esperar (ms, máx 15000)</Label>
            <Input className="h-8 text-xs" type="number" value={selectedCfg.ms || 1000} onChange={(e) => updateSelectedConfig({ ms: parseInt(e.target.value, 10) || 1000 })} />
          </>
        )}
        {selectedType === "log" && (
          <>
            <Label className="text-xs">Mensagem (suporta {"{{nodes.X.data.titulo}}"})</Label>
            <Textarea className="text-xs" rows={3} value={selectedCfg.message || ""} onChange={(e) => updateSelectedConfig({ message: e.target.value })} />
          </>
        )}
        {selected.id !== "t" && (
          <Button variant="destructive" size="sm" className="w-full mt-2" onClick={() => {
            setNodes((arr) => arr.filter((n) => n.id !== selected.id));
            setEdges((arr) => arr.filter((e) => e.source !== selected.id && e.target !== selected.id));
            setSelected(null);
          }}>
            <Trash2 className="w-3 h-3 mr-1" /> Remover nó
          </Button>
        )}
      </div>
    );
  }, [selected, selectedCfg, selectedType, setNodes, setEdges]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2"><Workflow className="w-5 h-5 text-primary" /> Fluxos (estilo n8n / Make)</h1>
          <p className="text-xs text-muted-foreground">Orquestre IA grátis, imagens e ações. Cada execução usa provedores zero-crédito.</p>
        </div>
        <FreeAiToggle compact />
      </div>

      <div className="grid lg:grid-cols-[260px_1fr_300px] gap-3">
        {/* Sidebar fluxos + paleta */}
        <Card className="p-3 space-y-3 max-h-[80vh] overflow-auto">
          <div>
            <div className="text-xs font-semibold mb-1">Templates</div>
            <Button size="sm" variant="outline" className="w-full mb-1 justify-start text-xs" onClick={() => newFlow("linkedin_semanal")}>+ Post LinkedIn semanal</Button>
            <Button size="sm" variant="outline" className="w-full mb-1 justify-start text-xs" onClick={() => newFlow("carrossel_ig")}>+ Carrossel Instagram</Button>
            <Button size="sm" variant="ghost" className="w-full justify-start text-xs" onClick={() => newFlow()}>+ Fluxo em branco</Button>
          </div>
          <div className="border-t pt-2">
            <div className="text-xs font-semibold mb-1">Meus fluxos</div>
            {flows.length === 0 && <div className="text-[11px] text-muted-foreground">Nenhum fluxo salvo.</div>}
            {flows.map((f) => (
              <button key={f.id} onClick={() => loadFlow(f)} className={`w-full text-left px-2 py-1 rounded text-xs hover:bg-muted ${currentId === f.id ? "bg-muted" : ""}`}>
                <div className="font-medium truncate">{f.nome}</div>
                <div className="text-[10px] text-muted-foreground">{(f.nodes?.length || 0)} nós</div>
              </button>
            ))}
          </div>
          <div className="border-t pt-2">
            <div className="text-xs font-semibold mb-1">Adicionar nó</div>
            {NODE_TYPES.filter((n) => n.type !== "trigger").map((n) => (
              <Button key={n.type} size="sm" variant="outline" className="w-full mb-1 justify-start text-xs" onClick={() => addNode(n.type)}>
                <n.icon className="w-3 h-3 mr-1" style={{ color: n.color }} /> {n.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Canvas + controles */}
        <Card className="p-0 overflow-hidden">
          <div className="p-2 border-b flex items-center gap-2 flex-wrap">
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm max-w-[260px]" placeholder="Nome do fluxo" />
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="h-8 text-xs flex-1 min-w-[180px]" placeholder="Descrição" />
            <Button size="sm" onClick={saveFlow}><Save className="w-3 h-3 mr-1" />Salvar</Button>
            <Button size="sm" variant="default" onClick={run} disabled={running}><Play className="w-3 h-3 mr-1" />{running ? "Executando..." : "Executar"}</Button>
            {currentId && <Button size="sm" variant="ghost" onClick={deleteFlow}><Trash2 className="w-3 h-3" /></Button>}
          </div>
          <div style={{ height: 520 }}>
            <ReactFlow
              nodes={nodes} edges={edges}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, n) => setSelected(n)}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap pannable zoomable />
            </ReactFlow>
          </div>
          {runLog.length > 0 && (
            <div className="border-t p-2 max-h-[160px] overflow-auto text-[11px] font-mono space-y-1">
              {runLog.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Badge variant={l.ok ? "secondary" : "destructive"} className="text-[9px]">{l.ok ? "OK" : "ERR"}</Badge>
                  <span className="text-muted-foreground">{l.type}</span>
                  <span className="truncate">{l.error || ""}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Inspector + run inputs */}
        <Card className="p-3 space-y-3 max-h-[80vh] overflow-auto">
          <div>
            <Label className="text-xs">Inputs JSON (passa para {"{{inputs.X}}"})</Label>
            <Textarea rows={3} value={inputs} onChange={(e) => setInputs(e.target.value)} className="text-xs font-mono" />
          </div>
          <div className="border-t pt-2">
            <div className="text-xs font-semibold mb-1">Inspetor</div>
            {selected ? inspector : <div className="text-[11px] text-muted-foreground">Clique em um nó para configurar.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
