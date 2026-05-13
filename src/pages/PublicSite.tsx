import { Link } from "react-router-dom";

/**
 * Site institucional público (rota `/`).
 *
 * Este é um placeholder mínimo. Os componentes do site institucional
 * serão importados manualmente para dentro deste arquivo (ou divididos
 * em `src/site/...`) sem afetar o ERP em `/app`.
 *
 * Regras:
 * - Não acopla ao AppLayout (que exige sessão).
 * - Não consulta banco nem autenticação.
 * - Login fica em `/entrar`. ERP fica em `/app`.
 */
export default function PublicSite() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="font-display text-xl font-semibold">Oriente Conecte Soluções</span>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/entrar" className="px-4 py-2 rounded-md hover:bg-muted transition">
            Entrar
          </Link>
          <Link
            to="/entrar"
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            Acessar ERP
          </Link>
        </nav>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
          Site institucional
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Esta é a rota pública (<code>/</code>). O conteúdo institucional será
          importado manualmente aqui. O ERP continua disponível em{" "}
          <Link to="/app" className="underline">/app</Link> e o login em{" "}
          <Link to="/entrar" className="underline">/entrar</Link>.
        </p>
      </section>
    </main>
  );
}
