/**
 * Util para os hooks `use*Access` legados consultarem a ACL central.
 * Marcado como deprecated — Leva 3 vai substituir os hooks por `useCan` direto.
 */
import { useAcl } from "@/acl/AclProvider";

/** @deprecated Use useCan(`<modulo>.acessar`) diretamente em novos códigos. */
export function useAclModuleOverride(moduleKey: string): { allow: boolean; ready: boolean } {
  const { loading, can, isInternalOcs } = useAcl();
  return {
    allow: isInternalOcs || can(`${moduleKey}.acessar`),
    ready: !loading,
  };
}
