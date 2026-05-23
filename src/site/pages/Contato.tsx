import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";

export default function ContatoPage() {
  const [sending, setSending] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-16">
      <div className="text-xs uppercase tracking-[0.2em] text-[#234DBC]"><span className="text-[#E94B4B]">◆</span> Contato</div>
      <h1 className="font-display text-5xl md:text-6xl font-bold text-[#0A1F44] mt-4">
        Vamos conversar.
      </h1>
      <p className="mt-5 text-lg text-neutral-700">
        Conte sobre sua operação. Em até 1 dia útil retornamos com um diagnóstico inicial.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSending(true);
          setTimeout(() => {
            setSending(false);
            toast.success("Mensagem enviada! Em breve retornaremos.");
            (e.target as HTMLFormElement).reset();
          }, 700);
        }}
        className="mt-10 rounded-2xl bg-white border border-neutral-200 p-6 md:p-8 space-y-4"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome" name="nome" required />
          <Field label="Empresa" name="empresa" />
          <Field label="E-mail" name="email" type="email" required />
          <Field label="Telefone" name="telefone" />
        </div>
        <div>
          <label className="text-sm font-medium text-[#0A1F44]">Mensagem</label>
          <textarea
            name="mensagem"
            rows={5}
            required
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#234DBC]/30"
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#234DBC] text-white font-medium hover:bg-[#1d3fa0] disabled:opacity-60"
        >
          <Send className="w-4 h-4" /> {sending ? "Enviando..." : "Enviar mensagem"}
        </button>
      </form>
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
