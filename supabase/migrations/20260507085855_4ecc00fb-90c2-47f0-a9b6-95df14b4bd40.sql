
-- 1. Coluna anexo_url em todas as tabelas crea_* operacionais que ainda não têm
ALTER TABLE public.crea_protocols ADD COLUMN IF NOT EXISTS anexo_url text;
ALTER TABLE public.crea_certificates ADD COLUMN IF NOT EXISTS anexo_url text;
ALTER TABLE public.crea_cats ADD COLUMN IF NOT EXISTS anexo_url text;
ALTER TABLE public.crea_deregistrations ADD COLUMN IF NOT EXISTS anexo_url text;
ALTER TABLE public.crea_treatments ADD COLUMN IF NOT EXISTS anexo_url text;
ALTER TABLE public.crea_responsible_technicians ADD COLUMN IF NOT EXISTS anexo_url text;
ALTER TABLE public.crea_engineers ADD COLUMN IF NOT EXISTS anexo_url text;
ALTER TABLE public.crea_companies_crea ADD COLUMN IF NOT EXISTS anexo_url text;
ALTER TABLE public.crea_norms ADD COLUMN IF NOT EXISTS anexo_url text;
ALTER TABLE public.crea_deadlines ADD COLUMN IF NOT EXISTS anexo_url text;

-- 2. Datas finas em ART
ALTER TABLE public.crea_arts ADD COLUMN IF NOT EXISTS data_rascunho date;
ALTER TABLE public.crea_arts ADD COLUMN IF NOT EXISTS data_envio_validacao date;
ALTER TABLE public.crea_arts ADD COLUMN IF NOT EXISTS data_validada date;

-- 3. Feature flags em crea_module_settings (todas off por segurança)
ALTER TABLE public.crea_module_settings
  ADD COLUMN IF NOT EXISTS feature_flags jsonb NOT NULL DEFAULT '{
    "scraping": false,
    "rpa_portais": false,
    "assinatura_digital": false,
    "confea_api_oficial": false,
    "ia_externa_paga": false,
    "revelar_senha_sem_motivo": false
  }'::jsonb;

-- 4. Bucket storage para anexos CREA (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('crea-attachments', 'crea-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Policies do bucket: usuários autenticados com permissão do CREA
DROP POLICY IF EXISTS "crea_attach_select" ON storage.objects;
CREATE POLICY "crea_attach_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'crea-attachments' AND public.crea_can(auth.uid(), NULL, 'view'));

DROP POLICY IF EXISTS "crea_attach_insert" ON storage.objects;
CREATE POLICY "crea_attach_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'crea-attachments' AND public.crea_can(auth.uid(), NULL, 'create'));

DROP POLICY IF EXISTS "crea_attach_delete" ON storage.objects;
CREATE POLICY "crea_attach_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'crea-attachments' AND public.crea_can(auth.uid(), NULL, 'delete'));
