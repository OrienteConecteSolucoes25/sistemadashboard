
-- Adiciona coluna para imagem de fundo personalizada por empresa
ALTER TABLE public.company_theme_settings
  ADD COLUMN IF NOT EXISTS background_image_url text,
  ADD COLUMN IF NOT EXISTS background_overlay_alpha numeric DEFAULT 0.35;

-- Bucket público para wallpapers de empresa
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-wallpapers', 'company-wallpapers', true)
ON CONFLICT (id) DO NOTHING;

-- Policies do bucket
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallpapers_public_read' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "wallpapers_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'company-wallpapers');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallpapers_auth_insert' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "wallpapers_auth_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'company-wallpapers');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallpapers_auth_update' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "wallpapers_auth_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'company-wallpapers');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallpapers_auth_delete' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "wallpapers_auth_delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'company-wallpapers');
  END IF;
END $$;
