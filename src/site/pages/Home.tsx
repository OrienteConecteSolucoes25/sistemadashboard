import { Link } from "react-router-dom";
import { ArrowRight, Rocket, Sparkles, Layers, HardHat, Scale, Mail, BarChart3, Wrench, GraduationCap, Gamepad2, Eye, FileText, Settings, MessageSquare, Cpu } from "lucide-react";
import founderHero from "@/assets/site/founder-hero.png";

const Section = ({ id, children, className = "" }: any) => (
  <section id={id} className={`mx-auto max-w-7xl px-4 md:px-6 ${className}`}>{children}</section>
);

const Marker = ({ children }: any) => (
  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#234DBC]">
    <span className="text-[#E94B4B]">◆</span> {children}
  </div>
);

const Card = ({ icon: Icon, title, desc }: any) => (
  <div className="group rounded-xl border border-neutral-200 bg-white p-5 hover:border-[#234DBC]/40 hover:shadow-sm transition">
    <div className="w-10 h-10 rounded-lg bg-[#EEF2F7] text-[#0A1F44] flex items-center justify-center mb-3">
      <Icon className="w-5 h-5" />
    </div>
    <div className="font-semibold text-[#0A1F44] mb-1">{title}</div>
    <div className="text-sm text-neutral-600 leading-relaxed">{desc}</div>
  </div>
);

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <Section className="pt-12 md:pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <Marker>Tecnologia · Comunicação · IA</Marker>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight mt-5 text-[#0A1F44]">
              Comunicação & <br /> sistemas que <span className="text-[#234DBC] italic">conversam.</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-700 max-w-xl leading-relaxed">
              A Oriente Conecte Soluções desenvolve sistemas, automações e plataformas digitais para transformar processos
              operacionais em <strong className="text-[#234DBC]">gestão visual, rastreável e escalável.</strong>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/erp-ocs" className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#234DBC] text-white font-medium hover:bg-[#1d3fa0]">
                Conhecer o ERP OCS <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/lancamento" className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50">
                Entrar na lista de espera <Rocket className="w-4 h-4 text-[#E94B4B]" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10">
              {[
                { i: Layers, t: "Engenharia", d: "Processos que sustentam operações" },
                { i: MessageSquare, t: "Comunicação", d: "Clareza que conecta equipes" },
                { i: Sparkles, t: "IA aplicada", d: "Inteligência que gera tempo" },
              ].map((x) => (
                <div key={x.t} className="rounded-lg border border-neutral-200 bg-white/70 p-3">
                  <x.i className="w-4 h-4 text-[#234DBC] mb-1" />
                  <div className="text-sm font-semibold text-[#0A1F44]">{x.t}</div>
                  <div className="text-xs text-neutral-600">{x.d}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-br from-[#234DBC]/10 to-[#0A1F44]/20 rounded-3xl blur-2xl" />
            <div className="relative rounded-3xl overflow-hidden border border-[#0A1F44]/10 shadow-xl bg-[#0A1F44]">
              <img
                src={founderHero}
                alt="Jezsica Reis — Fundadora OCS"
                loading="eager"
                className="w-full h-auto object-cover mix-blend-luminosity opacity-90"
                style={{ filter: "hue-rotate(195deg) saturate(0.85) brightness(0.95)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F44] via-[#0A1F44]/30 to-transparent pointer-events-none" />
              <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur rounded-xl p-4 border border-white/40">
                <div className="flex items-center gap-2 text-xs text-[#234DBC] font-semibold">
                  <Sparkles className="w-4 h-4" /> Engenharia + comunicação + IA
                </div>
                <div className="text-sm text-neutral-700 mt-1">
                  Estratégia, tecnologia e processos para que equipes, dados e decisões deixem de trabalhar separados.
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* MARQUEE */}
      <div className="bg-[#0A1F44] text-white overflow-hidden border-y border-[#234DBC]/30">
        <div className="py-4 whitespace-nowrap animate-[marquee_30s_linear_infinite] font-display text-sm tracking-widest uppercase">
          {Array(3).fill(0).map((_, i) => (
            <span key={i} className="mx-8">
              Estratégia · Desenvolvimento · Branding · Produto · UX/UI · Sistemas · Conteúdo · Automação <span className="text-[#E94B4B]">✦</span>
            </span>
          ))}
        </div>
        <style>{`@keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-33.333%)} }`}</style>
      </div>

      {/* PROBLEMA */}
      <Section className="py-20">
        <Marker>O problema</Marker>
        <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 text-[#0A1F44] max-w-3xl">
          A operação improvisada custa caro.
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {[
            "Dados espalhados em planilhas",
            "Cobranças por WhatsApp",
            "E-mails sem resposta",
            "Retrabalho entre setores",
            "Indicadores pouco confiáveis",
            "Ausência de rastreabilidade",
            "Relatórios consolidados manualmente",
          ].map((d) => (
            <div key={d} className="border-l-2 border-[#E94B4B] pl-4 py-2 text-neutral-700">
              {d}
            </div>
          ))}
        </div>
      </Section>

      {/* SOLUÇÃO */}
      <Section className="py-20 border-t border-neutral-200">
        <Marker>Solução OCS</Marker>
        <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 text-[#0A1F44]">
          Engenharia + comunicação + IA.
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {[
            { i: Cpu, t: "ERP OCS", d: "Ecossistema modular completo." },
            { i: Gamepad2, t: "Pixel Office", d: "Gestão visual gamificada." },
            { i: HardHat, t: "Gestão de Engenharia", d: "Obras, projetos e rastreabilidade." },
            { i: Scale, t: "Gestão Jurídica", d: "Processos, prazos e documentos." },
            { i: Mail, t: "Automações de e-mail", d: "Comunicação que responde sozinha." },
            { i: BarChart3, t: "Dashboards & Relatórios", d: "Indicadores em tempo real." },
            { i: Wrench, t: "Sistemas sob medida", d: "Construímos do zero para você." },
            { i: GraduationCap, t: "Treinamento & documentação", d: "Equipe pronta para operar." },
          ].map((c) => <Card key={c.t} icon={c.i} title={c.t} desc={c.d} />)}
        </div>
        <div className="mt-8">
          <Link to="/solucoes" className="inline-flex items-center gap-2 text-[#234DBC] font-semibold hover:gap-3 transition-all">
            Ver todas as soluções <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Section>

      {/* PRODUTO EM CONSTRUÇÃO */}
      <Section className="py-20 border-t border-neutral-200">
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <Marker>Produto em construção</Marker>
            <h2 className="font-display text-5xl md:text-6xl font-bold mt-4 text-[#0A1F44]">ERP OCS</h2>
            <p className="text-lg text-neutral-700 mt-4 max-w-lg">
              Um ecossistema modular para operações que precisam sair do improviso.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link to="/erp-ocs" className="px-5 py-3 rounded-md bg-[#234DBC] text-white font-medium hover:bg-[#1d3fa0]">
                Conhecer o ERP OCS
              </Link>
              <Link to="/lancamento" className="px-5 py-3 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50">
                Entrar na lista de espera
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { i: Gamepad2, t: "Pixel Office" },
              { i: Eye, t: "Visibilidade por grupos" },
              { i: HardHat, t: "Engenharia" },
              { i: Scale, t: "Jurídico" },
              { i: BarChart3, t: "Relatórios" },
              { i: Settings, t: "Administração" },
            ].map((m) => (
              <div key={m.t} className="rounded-xl bg-[#0A1F44] text-white p-5 hover:bg-[#102a5c] transition">
                <m.i className="w-5 h-5 text-[#7FA6D6] mb-2" />
                <div className="font-semibold">{m.t}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* MANIFESTO */}
      <Section className="py-24 border-t border-neutral-200">
        <div className="max-w-4xl">
          <Marker>Manifesto</Marker>
          <p className="font-display text-3xl md:text-5xl leading-tight mt-6 text-[#0A1F44]">
            Acreditamos que tecnologia só faz sentido quando devolve{" "}
            <span className="italic text-[#234DBC]">tempo, calma e clareza</span> para quem trabalha.
          </p>
          <p className="text-neutral-700 mt-6 text-lg max-w-2xl leading-relaxed">
            A OCS conecta comunicação, tecnologia e engenharia em um único fio condutor — para que pessoas, dados e
            processos finalmente trabalhem juntos.
          </p>
        </div>
      </Section>

      {/* DIFERENCIAIS */}
      <Section className="py-20 border-t border-neutral-200">
        <Marker>O que fazemos diferente</Marker>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-10">
          {[
            { t: "Comunicação Estratégica", d: "Marca, conteúdo e voz alinhados." },
            { t: "Tecnologia & ERP", d: "Plataforma modular sob medida." },
            { t: "Engenharia de Processos", d: "Da prancheta ao indicador." },
            { t: "IA Aplicada", d: "Automação que decide e executa." },
            { t: "Integração de Equipes", d: "Quebramos silos com clareza." },
          ].map((p, i) => (
            <div key={p.t} className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="text-3xl font-display text-[#234DBC]">0{i + 1}</div>
              <div className="font-semibold text-[#0A1F44] mt-2">{p.t}</div>
              <div className="text-sm text-neutral-600 mt-1">{p.d}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* COMO FUNCIONA */}
      <Section className="py-20 border-t border-neutral-200">
        <Marker>Como funciona</Marker>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {[
            { n: "01", t: "Diagnóstico", d: "Entendemos a operação e os gargalos." },
            { n: "02", t: "Lista de espera", d: "Reserva de vaga no lançamento." },
            { n: "03", t: "Pré-lançamento", d: "Configuração e treinamento." },
            { n: "04", t: "Lançamento", d: "Operação rastreável e escalável." },
          ].map((s) => (
            <div key={s.n} className="relative rounded-xl bg-gradient-to-br from-[#0A1F44] to-[#234DBC] text-white p-6">
              <div className="text-5xl font-display font-bold opacity-30">{s.n}</div>
              <div className="font-semibold mt-2">{s.t}</div>
              <div className="text-sm text-white/80 mt-1">{s.d}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* FUNDADORA */}
      <Section className="py-20 border-t border-neutral-200">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <Marker>Quem está por trás da OCS</Marker>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 text-[#0A1F44]">
              Jezsica Reis conecta engenharia, marketing, IA e processos.
            </h2>
            <p className="mt-5 text-neutral-700 text-lg leading-relaxed max-w-lg">
              Transformando complexidade em clareza — para que sua operação pare de depender de improviso.
            </p>
            <Link to="/sobre" className="inline-flex items-center gap-2 mt-7 text-[#234DBC] font-semibold hover:gap-3 transition-all">
              Conhecer a fundadora <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="rounded-3xl overflow-hidden border border-neutral-200 bg-[#0A1F44]">
            <img
              src={founderHero}
              alt="Jezsica Reis"
              className="w-full h-auto"
              style={{ filter: "hue-rotate(195deg) saturate(0.7) brightness(0.95)" }}
            />
          </div>
        </div>
      </Section>

      {/* NEWSLETTER */}
      <Section className="py-20 border-t border-neutral-200">
        <Marker>Conteúdo & Newsletter</Marker>
        <div className="grid md:grid-cols-3 gap-4 mt-10">
          {[
            { t: "ERP", d: "Como estruturar uma operação rastreável." },
            { t: "IA", d: "Onde a IA realmente devolve tempo." },
            { t: "Liderança", d: "Decisões com dados, não com achismos." },
          ].map((c) => (
            <div key={c.t} className="rounded-xl bg-white border border-neutral-200 p-6 hover:border-[#234DBC]/40 transition">
              <div className="text-xs uppercase tracking-wider text-[#234DBC] font-semibold">{c.t}</div>
              <div className="mt-2 text-lg font-display text-[#0A1F44]">{c.d}</div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link to="/newsletter" className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#0A1F44] text-white font-medium hover:bg-[#102a5c]">
            Quero receber <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Section>

      {/* CTA FINAL */}
      <Section className="py-24">
        <div className="rounded-3xl bg-gradient-to-br from-[#0A1F44] via-[#102a5c] to-[#234DBC] text-white p-10 md:p-16 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold">
            Quer acompanhar o lançamento do ERP OCS?
          </h2>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to="/lancamento" className="px-6 py-3 rounded-md bg-[#E94B4B] text-white font-semibold hover:bg-[#d33e3e]">
              Entrar na lista de espera
            </Link>
            <Link to="/contato" className="px-6 py-3 rounded-md bg-white text-[#0A1F44] font-semibold hover:bg-neutral-100">
              Falar com a OCS
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
