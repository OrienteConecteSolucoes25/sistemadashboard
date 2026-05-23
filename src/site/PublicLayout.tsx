import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, Rocket, User } from "lucide-react";

const NAV = [
  { to: "/solucoes", label: "Soluções" },
  { to: "/erp-ocs", label: "ERP OCS" },
  { to: "/sobre", label: "Sobre" },
  { to: "/newsletter", label: "Newsletter" },
  { to: "/contato", label: "Contato" },
];

function OcsLogo() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <span className="font-display font-bold text-2xl tracking-tight">
        <span className="text-[#0A1F44]">O</span>
        <span className="text-[#234DBC]">C</span>
        <span className="text-[#E94B4B]">S</span>
      </span>
      <span className="hidden sm:inline text-xs text-neutral-500 group-hover:text-neutral-700 transition-colors">
        Oriente Conecte Soluções
      </span>
    </Link>
  );
}

function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-[#FAF8F2]/85 border-b border-neutral-200/60">
      <div className="mx-auto max-w-7xl px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <OcsLogo />
        <nav className="hidden lg:flex items-center gap-6 text-sm text-neutral-700">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `hover:text-[#0A1F44] transition-colors ${isActive ? "text-[#0A1F44] font-semibold" : ""}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/entrar"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-neutral-300 text-sm text-neutral-800 hover:bg-white"
          >
            <User className="w-4 h-4" /> Entrar
          </Link>
          <Link
            to="/lancamento"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#E94B4B] text-white text-sm font-medium hover:bg-[#d33e3e]"
          >
            <Rocket className="w-4 h-4" /> Lista de espera
          </Link>
        </div>
        <button
          className="lg:hidden p-2 rounded-md hover:bg-white/70"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-neutral-200/60 bg-[#FAF8F2]">
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="px-2 py-2 rounded hover:bg-white text-sm">
                {n.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Link to="/entrar" className="flex-1 text-center px-3 py-2 rounded border border-neutral-300 text-sm">
                Entrar
              </Link>
              <Link to="/lancamento" className="flex-1 text-center px-3 py-2 rounded bg-[#E94B4B] text-white text-sm">
                Lista de espera
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="bg-[#0A1F44] text-neutral-200 mt-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display font-bold text-2xl mb-3">
            <span>O</span><span className="text-[#7FA6D6]">C</span><span className="text-[#E94B4B]">S</span>
          </div>
          <p className="text-sm text-neutral-300 max-w-md leading-relaxed">
            Oriente Conecte Soluções — Tecnologia, gestão e inteligência para operações que precisam sair do improviso.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-400 mb-3">Produto</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/erp-ocs" className="hover:text-white">ERP OCS</Link></li>
            <li><Link to="/solucoes" className="hover:text-white">Soluções</Link></li>
            <li><Link to="/lancamento" className="hover:text-white">Lançamento</Link></li>
            <li><Link to="/newsletter" className="hover:text-white">Newsletter</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-400 mb-3">Empresa</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/sobre" className="hover:text-white">Sobre</Link></li>
            <li><Link to="/contato" className="hover:text-white">Contato</Link></li>
            <li><Link to="/entrar" className="hover:text-white">Entrar no ERP</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} Oriente Conecte Soluções. Todos os direitos reservados.
      </div>
    </footer>
  );
}

export default function PublicLayout() {
  return (
    <div className="ocs-public min-h-screen flex flex-col bg-[#FAF8F2] text-neutral-900">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
