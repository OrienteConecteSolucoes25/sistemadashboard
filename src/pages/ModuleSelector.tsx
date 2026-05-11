import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAcl, useCan } from "@/acl/AclProvider";
import { usePlanosAccess } from "@/modules/planos/hooks/usePlanosAccess";
import { Card, CardContent } from "@/components/ui/card";
import {
  LayoutDashboard, Gamepad2, Cpu, Monitor, ShieldCheck, HardHat, Scale,
  HeartHandshake, FileSignature, MessageSquare, CreditCard, Building2,
  Palette, Settings, Store, ArrowRight,
} from "lucide-react";
import { useBrand } from "@/hooks/useBrand";

type ModEntry = { key: string; label: string; to: string; icon: any; allowed: boolean; description: string };

/**
 * Tela inicial pós-login: mostra apenas os módulos que o usuário pode acessar.
 * - Se houver 1 único módulo, redireciona automaticamente.
 * - Caso contrário, mostra cards para seleção.
 */
export default function ModuleSelector() {
  const navigate = useNavigate();
  const { loading: aclLoading } = useAcl();
  const { isFinanceiro, isOcsStaff, canSeeMinhaEmpresa, checking } = usePlanosAccess();
  const brand = useBrand();

  const mods: ModEntry[] = [
    { key: "visao_geral", label: "Visão Geral", to: "/app/visao-geral", icon: LayoutDashboard, description: "Indicadores consolidados", allowed: useCan("visao_geral.acessar") },
    { key: "pixel_office", label: "Soluções-Verso", to: "/app/pixel-office", icon: Gamepad2, description: "Ambiente interativo", allowed: useCan("pixel_office.acessar") },
    { key: "jarbas", label: "Jarbas", to: "/app/jarbas", icon: Cpu, description: "Assistente IA", allowed: useCan("jarbas.acessar") },
    { key: "ti", label: "TI & Suporte", to: "/app/ti", icon: Monitor, description: "Chamados e infra", allowed: useCan("ti.acessar") },
    { key: "compliance", label: "Compliance", to: "/app/compliance", icon: ShieldCheck, description: "Auditoria e conformidade", allowed: useCan("compliance.acessar") },
    { key: "engenharia", label: "Engenharia", to: "/app/engenharia", icon: HardHat, description: "Projetos e obras", allowed: useCan("engenharia.acessar") },
    { key: "juridico", label: "Jurídico", to: "/app/juridico", icon: Scale, description: "Contratos e processos", allowed: useCan("juridico.acessar") },
    { key: "rhdp", label: "RH/DP", to: "/app/rh-dp", icon: HeartHandshake, description: "Pessoas e folha", allowed: useCan("rhdp.acessar") },
    { key: "crea", label: "CREA & ART", to: "/app/crea", icon: FileSignature, description: "Anotações técnicas", allowed: useCan("crea.acessar") },
    { key: "comunicacao", label: "Comunicação", to: "/app/comunicacao", icon: MessageSquare, description: "Canais e campanhas", allowed: useCan("comunicacao.acessar") },
    { key: "planos", label: "Planos", to: "/app/planos", icon: CreditCard, description: "Empresas e cobrança", allowed: isFinanceiro || useCan("planos.acessar") },
    { key: "minha_empresa", label: "Minha Empresa", to: "/app/minha-empresa", icon: Building2, description: "Dados da empresa", allowed: !!canSeeMinhaEmpresa },
    { key: "aparencia", label: "Aparência & Marca", to: "/app/aparencia", icon: Palette, description: "Personalização visual", allowed: useCan("aparencia.acessar") },
    { key: "adm", label: "ADM — Visibilidade", to: "/app/adm", icon: Settings, description: "Permissões e acessos", allowed: isOcsStaff || useCan("adm.visibilidade.visualizar") },
    { key: "marketplace", label: "Marketplace", to: "/app/marketplace", icon: Store, description: "Soluções OCS", allowed: useCan("marketplace.dashboard.visualizar") },
  ];

  const allowed = useMemo(() => mods.filter(m => m.allowed), [mods.map(m => `${m.key}:${m.allowed}`).join("|")]);

  useEffect(() => {
    if (aclLoading || checking || brand.loading) return;
    if (allowed.length === 1) navigate(allowed[0].to, { replace: true });
  }, [aclLoading, checking, brand.loading, allowed, navigate]);

  if (aclLoading || checking || brand.loading) return null;

  if (allowed.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center space-y-3">
        <h1 className="font-display text-2xl">{brand.title}</h1>
        <p className="text-muted-foreground">
          Você ainda não tem acesso a nenhum módulo. Solicite ao administrador que libere as permissões em <strong>ADM — Visibilidade</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold">{brand.title}</h1>
        {brand.subtitle && <p className="text-muted-foreground">{brand.subtitle}</p>}
        <p className="mt-3 text-sm text-muted-foreground">
          Selecione um módulo para continuar.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allowed.map((m) => (
          <Link key={m.key} to={m.to} className="group">
            <Card className="card-elegant transition-all group-hover:border-primary group-hover:shadow-md">
              <CardContent className="p-5 flex items-start gap-3">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <m.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold flex items-center justify-between gap-2">
                    <span className="truncate">{m.label}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{m.description}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
