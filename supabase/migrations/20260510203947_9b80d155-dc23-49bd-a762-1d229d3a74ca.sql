INSERT INTO public.acl_user_permissions (user_id, company_id, permission_key, granted_by, reason)
SELECT DISTINCT cmp.user_id, cmp.company_id,
  CASE
    WHEN cmp.module_key LIKE 'eng.%'  THEN 'engenharia.acessar'
    WHEN cmp.module_key LIKE 'crea.%' THEN 'crea.acessar'
    WHEN cmp.module_key LIKE 'jur.%'  THEN 'juridico.acessar'
    WHEN cmp.module_key LIKE 'rhdp.%' THEN 'rhdp.acessar'
  END,
  NULL::uuid,
  'migrado de company_module_permissions (can_view) — Leva 6'
FROM public.company_module_permissions cmp
WHERE cmp.can_view
  AND (cmp.module_key LIKE 'eng.%' OR cmp.module_key LIKE 'crea.%'
       OR cmp.module_key LIKE 'jur.%' OR cmp.module_key LIKE 'rhdp.%')
ON CONFLICT DO NOTHING;

INSERT INTO public.acl_user_permissions (user_id, company_id, permission_key, granted_by, reason)
SELECT DISTINCT cmp.user_id, cmp.company_id,
  CASE
    WHEN cmp.module_key LIKE 'eng.%'  THEN 'engenharia.sites.editar'
    WHEN cmp.module_key LIKE 'crea.%' THEN 'crea.art.editar'
    WHEN cmp.module_key LIKE 'jur.%'  THEN 'juridico.processos.editar'
    WHEN cmp.module_key LIKE 'rhdp.%' THEN 'rhdp.colaboradores.editar'
  END,
  NULL::uuid,
  'migrado de company_module_permissions (can_edit) — Leva 6'
FROM public.company_module_permissions cmp
WHERE cmp.can_edit
  AND (cmp.module_key LIKE 'eng.%' OR cmp.module_key LIKE 'crea.%'
       OR cmp.module_key LIKE 'jur.%' OR cmp.module_key LIKE 'rhdp.%')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.company_module_permissions IS
  'DEPRECATED (Leva 6) — Modelo antigo V/E/D por módulo. Use acl_user_permissions + acl_permissions_catalog. Mantido como fallback em *_can().';
COMMENT ON TABLE public.crea_module_permissions IS
  'DEPRECATED (Leva 6) — Use acl_user_permissions (chaves crea.*).';
COMMENT ON TABLE public.comm_module_permissions IS
  'DEPRECATED (Leva 6) — Use acl_user_permissions (chaves comunicacao.*).';
COMMENT ON TABLE public.hrdp_module_permissions IS
  'DEPRECATED (Leva 6) — Use acl_user_permissions (chaves rhdp.*).';
COMMENT ON TABLE public.theme_permissions IS
  'DEPRECATED (Leva 6) — Use acl_user_permissions (chaves aparencia.*).';
