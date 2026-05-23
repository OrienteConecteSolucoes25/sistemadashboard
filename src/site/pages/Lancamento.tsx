import { useState } from "react";
import { toast } from "sonner";
import { Rocket, Check } from "lucide-react";

export default function LancamentoPage() {
  const [sending, setSending] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-16">
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#234DBC]"><span className="text-[#E94B4B]">◆</span> Lista de espera</div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-[#0A1F44] mt-4 leading-[1.05]">
            Seja um dos primeiros a usar o <span className="italic text-[#234DBC]">ERP OCS</span>.
          </h1>
          <p className="mt-5 text-lg text-neutral-700">
            O lançamento será por convite. Garanta sua vaga e prioridade no onboarding.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Acesso antecipado aos módulos",
              "Onboarding guiado com a fundadora",
              "Preço fundador exclusivo",
              "Influência direta no roadmap",
            ].map((b) => (
              <li key={b} className="flex gap-3 text-neutral-700"><Check className="w-5 h-5 text-[#234DBC] mt-0.5 shrink-0" /> {b}</li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSending(true);
            setTimeout(() => {
              setSending(false);
              toast.success("Pronto! Você está na lista. Vamos avisar antes do lançamento.");
              (e.target as HTMLFormElement).reset();
            }, 700);
          }}
          className="rounded-2xl bg-white border border-neutral-200 p-6 md:p-8 space-y-4 shadow-sm"
        >
          <Field label="Nome" name="nome" required />
          <Field label="Empresa" name="empresa" />
          <Field label="E-mail" name="email" type="email" required />
          <Field label="Telefone / WhatsApp" name="telefone" />
          <button
            type="submit"
            disabled={sending}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-[#E94B4B] text-white font-semibold hover:bg-[#d33e3e] disabled:opacity-60"
          >
            <Rocket className="w-4 h-4" /> {sending ? "Reservando..." : "Entrar na lista de espera"}
          </button>
          <p className="text-xs text-neutral-500 text-center">Sem spam. Você só recebe novidades do lançamento.</p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", required = false }: any) {
  return (
    <div>
      <label className="text-sm font-medium text-[#0A1F44]">{label}{required && " *"}</label>
      <input
        type={type}
        name={name}
        required={required}
        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#234DBC]/30"
      />
    </div>
  );
}
