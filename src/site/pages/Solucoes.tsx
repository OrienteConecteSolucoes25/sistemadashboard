import { Link } from "react-router-dom";
import { Cpu, Gamepad2, HardHat, Scale, Workflow, BarChart3, Wrench, GraduationCap, MessageSquare, Sparkles, FileText, ArrowRight } from "lucide-react";

const items = [
  { i: Cpu, t: "ERP OCS", d: "Plataforma modular para todas as áreas." },
  { i: Gamepad2, t: "Pixel Office", d: "Gestão visual em ambiente gamificado." },
  { i: HardHat, t: "Gestão de Engenharia", d: "Obras, projetos, RFI e rastreabilidade." },
  { i: Scale, t: "Gestão Jurídica", d: "Processos, prazos e documentos centralizados." },
  { i: Workflow, t: "Automações", d: "Fluxos que executam tarefas repetitivas." },
  { i: BarChart3, t: "Dashboards", d: "Indicadores em tempo real para liderança." },
  { i: Wrench, t: "Sistemas sob medida", d: "Construímos do zero para sua operação." },
  { i: GraduationCap, t: "Treinamentos", d: "Capacitação técnica e de gestão." },
  { i: MessageSquare, t: "Comunicação estratégica", d: "Marca, conteúdo e voz alinhados." },
  { i: Sparkles, t: "IA aplicada", d: "Modelos que decidem, classificam e geram." },
  { i: FileText, t: "Processos e documentação", d: "Operação documentada e auditável." },
];

export default function SolucoesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-16">
      <div className="text-xs uppercase tracking-[0.2em] text-[#234DBC]"><span className="text-[#E94B4B]">◆</span> Soluções</div>
      <h1 className="font-display text-5xl md:text-6xl font-bold text-[#0A1F44] mt-4 max-w-3xl">
        Tudo o que a OCS entrega.
      </h1>
      <p className="mt-5 text-lg text-neutral-700 max-w-2xl">
        Tecnologia, processos e inteligência — combinados em soluções modulares que resolvem dores reais da operação.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
        {items.map((it) => (
          <div key={it.t} className="rounded-xl border border-neutral-200 bg-white p-6 hover:border-[#234DBC]/40 hover:shadow-sm transition">
            <div className="w-10 h-10 rounded-lg bg-[#EEF2F7] text-[#0A1F44] flex items-center justify-center mb-3">
              <it.i className="w-5 h-5" />
            </div>
            <div className="font-semibold text-[#0A1F44]">{it.t}</div>
            <div className="text-sm text-neutral-600 mt-1 leading-relaxed">{it.d}</div>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-2xl bg-[#0A1F44] text-white p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="font-display text-2xl md:text-3xl">Quer ver tudo isso aplicado ao seu negócio?</div>
          <div className="text-white/80 mt-1">Solicite um diagnóstico gratuito.</div>
        </div>
        <Link to="/contato" className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#E94B4B] hover:bg-[#d33e3e] font-medium">
          Falar com a OCS <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
