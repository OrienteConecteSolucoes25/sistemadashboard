import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";

const POSTS = [
  { cat: "ERP", t: "Como estruturar uma operação rastreável em 6 semanas" },
  { cat: "IA", t: "Onde a IA devolve tempo (e onde só queima dinheiro)" },
  { cat: "Liderança", t: "Decisões com dados, sem virar refém da planilha" },
  { cat: "Engenharia", t: "Do RFI ao indicador: rastreando obras de verdade" },
  { cat: "Comunicação", t: "A voz da marca quando a operação fala por você" },
  { cat: "ERP", t: "Permissões por grupo: visibilidade sem caos" },
];

export default function NewsletterPage() {
  const [sending, setSending] = useState(false);
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-16">
      <div className="text-xs uppercase tracking-[0.2em] text-[#234DBC]"><span className="text-[#E94B4B]">◆</span> Newsletter</div>
      <h1 className="font-display text-5xl md:text-6xl font-bold text-[#0A1F44] mt-4 max-w-3xl">
        Conteúdos sobre <span className="italic text-[#234DBC]">ERP, IA e liderança</span>.
      </h1>
      <p className="mt-5 text-lg text-neutral-700 max-w-2xl">
        Um e-mail por semana. Direto ao ponto. Sem fluff.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSending(true);
          setTimeout(() => { setSending(false); toast.success("Inscrição confirmada!"); (e.target as HTMLFormElement).reset(); }, 600);
        }}
        className="mt-8 flex flex-col sm:flex-row gap-2 max-w-xl"
      >
        <input
          type="email"
          name="email"
          required
          placeholder="seu@email.com"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#234DBC]/30"
        />
        <button
          disabled={sending}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-[#234DBC] text-white font-medium hover:bg-[#1d3fa0] disabled:opacity-60"
        >
          <Mail className="w-4 h-4" /> {sending ? "Inscrevendo..." : "Quero receber"}
        </button>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-14">
        {POSTS.map((p) => (
          <article key={p.t} className="rounded-xl border border-neutral-200 bg-white p-6 hover:border-[#234DBC]/40 transition">
            <div className="text-xs uppercase tracking-wider text-[#E94B4B] font-semibold">{p.cat}</div>
            <h3 className="font-display text-xl text-[#0A1F44] mt-2 leading-tight">{p.t}</h3>
            <div className="text-xs text-neutral-500 mt-4">Em breve</div>
          </article>
        ))}
      </div>
    </div>
  );
}
