ALTER TABLE public.comm_brand_kits ADD COLUMN IF NOT EXISTS anexos jsonb DEFAULT '[]'::jsonb;

INSERT INTO storage.buckets (id, name, public)
VALUES ('comm-brand-assets', 'comm-brand-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "comm_brand_assets_read" ON storage.objects;
CREATE POLICY "comm_brand_assets_read" ON storage.objects FOR SELECT USING (bucket_id = 'comm-brand-assets');

DROP POLICY IF EXISTS "comm_brand_assets_insert" ON storage.objects;
CREATE POLICY "comm_brand_assets_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'comm-brand-assets');

DROP POLICY IF EXISTS "comm_brand_assets_update" ON storage.objects;
CREATE POLICY "comm_brand_assets_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'comm-brand-assets');

DROP POLICY IF EXISTS "comm_brand_assets_delete" ON storage.objects;
CREATE POLICY "comm_brand_assets_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'comm-brand-assets');