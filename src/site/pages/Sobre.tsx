import { Link } from "react-router-dom";
import founderHero from "@/assets/site/founder-hero.png";

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-16">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#234DBC]"><span className="text-[#E94B4B]">◆</span> Sobre</div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-[#0A1F44] mt-4 leading-[1.05]">
            Jezsica Reis
          </h1>
          <p className="text-lg text-neutral-700 mt-5 max-w-lg">
            Fundadora da Oriente Conecte Soluções. Conecta engenharia, marketing, IA e processos para transformar
            complexidade em clareza.
          </p>
        </div>
        <div className="rounded-3xl overflow-hidden border border-neutral-200 bg-[#0A1F44]">
          <img src={founderHero} alt="Jezsica Reis" className="w-full" style={{ filter: "hue-rotate(195deg) saturate(0.75) brightness(0.95)" }} />
        </div>
      </div>

      <section className="mt-20 grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-3xl text-[#0A1F44]">Trajetória</h2>
          <p className="mt-4 text-neutral-700 leading-relaxed">
            Anos atuando entre engenharia de processos, marketing estratégico e tecnologia. A vivência em campo
            mostrou que a maior parte das operações brasileiras sofre não por falta de ferramentas — mas pelo
            improviso entre elas.
          </p>
        </div>
        <div>
          <h2 className="font-display text-3xl text-[#0A1F44]">Visão da OCS</h2>
          <p className="mt-4 text-neutral-700 leading-relaxed">
            Construir o ERP que conecta o que sempre foi separado: pessoas, sistemas, dados e decisões. Com IA
            aplicada de verdade — sem custo extra para o cliente final.
          </p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl text-[#0A1F44]">Diferenciais</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {["Engenharia + Marketing", "IA aplicada", "Processos de verdade", "Visão de produto"].map((d) => (
            <div key={d} className="rounded-xl bg-white border border-neutral-200 p-5">
              <div className="font-semibold text-[#0A1F44]">{d}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-16 text-center">
        <Link to="/contato" className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#234DBC] text-white font-medium hover:bg-[#1d3fa0]">
          Falar com a Jezsica
        </Link>
      </div>
    </div>
  );
}
