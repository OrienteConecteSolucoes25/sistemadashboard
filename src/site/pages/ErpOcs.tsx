import { Link } from "react-router-dom";
import { Check, ArrowRight, Rocket } from "lucide-react";

export default function ErpOcsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-16">
      <div className="text-xs uppercase tracking-[0.2em] text-[#234DBC]"><span className="text-[#E94B4B]">◆</span> ERP OCS</div>
      <h1 className="font-display text-5xl md:text-7xl font-bold text-[#0A1F44] mt-4 leading-[1.05]">
        Um ERP que <span className="italic text-[#234DBC]">conversa</span> com sua operação.
      </h1>
      <p className="mt-6 text-lg text-neutral-700 max-w-2xl">
        Engenharia, jurídico, RH, comunicação e IA — em um único ecossistema modular, visual e rastreável.
      </p>

      <div className="grid md:grid-cols-3 gap-4 mt-12">
        {["Engenharia", "Jurídico", "RH/DP", "CREA & ART", "Comunicação", "Pixel Office", "Marketplace", "Visão Geral", "Aparência & Marca"].map((m) => (
          <div key={m} className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="text-xs uppercase tracking-wider text-[#234DBC]">Módulo</div>
            <div className="font-semibold text-[#0A1F44] mt-1">{m}</div>
          </div>
        ))}
      </div>

      <section className="mt-16 grid lg:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-3xl text-[#0A1F44]">Benefícios</h2>
          <ul className="mt-6 space-y-3">
            {[
              "Operação rastreável de ponta a ponta",
              "Indicadores em tempo real",
              "IA aplicada sem custos extras para o cliente",
              "Permissões granulares por grupo",
              "Comunicação interna integrada",
              "Pronto para o seu setor",
            ].map((b) => (
              <li key={b} className="flex gap-3 text-neutral-700"><Check className="w-5 h-5 text-[#234DBC] shrink-0 mt-0.5" /> {b}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-3xl text-[#0A1F44]">Para quem é</h2>
          <div className="mt-6 space-y-3">
            {[
              "Empresas de engenharia e telecom",
              "Operações jurídicas com volume",
              "Times de RH/DP que precisam de visibilidade",
              "Lideranças cansadas de planilha solta",
            ].map((p) => (
              <div key={p} className="rounded-lg border border-neutral-200 bg-white p-4 text-neutral-700">{p}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl text-[#0A1F44]">Como funciona</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[
            { n: "01", t: "Diagnóstico" },
            { n: "02", t: "Lista de espera" },
            { n: "03", t: "Pré-lançamento" },
            { n: "04", t: "Lançamento" },
          ].map((s) => (
            <div key={s.n} className="rounded-xl bg-gradient-to-br from-[#0A1F44] to-[#234DBC] text-white p-6">
              <div className="text-4xl font-display opacity-40">{s.n}</div>
              <div className="font-semibold mt-2">{s.t}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-16 rounded-2xl bg-[#0A1F44] text-white p-10 text-center">
        <div className="font-display text-3xl md:text-4xl">Garanta sua vaga no lançamento</div>
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <Link to="/lancamento" className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#E94B4B] font-medium hover:bg-[#d33e3e]">
            <Rocket className="w-4 h-4" /> Entrar na lista de espera
          </Link>
          <Link to="/entrar" className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-white text-[#0A1F44] font-medium hover:bg-neutral-100">
            Já tenho conta <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
