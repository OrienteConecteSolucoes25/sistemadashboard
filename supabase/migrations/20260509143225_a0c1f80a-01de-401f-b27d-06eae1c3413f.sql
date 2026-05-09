
-- 1) Calendário editorial: legenda, texto e brand_kit_id
ALTER TABLE public.comm_editorial_calendar
  ADD COLUMN IF NOT EXISTS legenda text,
  ADD COLUMN IF NOT EXISTS texto text,
  ADD COLUMN IF NOT EXISTS brand_kit_id uuid REFERENCES public.comm_brand_kits(id) ON DELETE SET NULL;

-- 2) Director conversations
CREATE TABLE IF NOT EXISTS public.comm_director_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  brand_kit_id uuid REFERENCES public.comm_brand_kits(id) ON DELETE SET NULL,
  scope text NOT NULL DEFAULT 'externa', -- externa | interna
  allowed_modules text[] DEFAULT '{}',
  title text,
  is_deleted boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_director_conv_user ON public.comm_director_conversations(user_id, created_at DESC);

ALTER TABLE public.comm_director_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "director_conv_owner" ON public.comm_director_conversations;
CREATE POLICY "director_conv_owner" ON public.comm_director_conversations
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'comunicacao_admin'::app_role))
  WITH CHECK (user_id = auth.uid());

-- 3) Director messages
CREATE TABLE IF NOT EXISTS public.comm_director_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.comm_director_conversations(id) ON DELETE CASCADE,
  role text NOT NULL, -- user | assistant | tool | system
  content text,
  tool_calls jsonb,
  tool_results jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_director_msg_conv ON public.comm_director_messages(conversation_id, created_at);

ALTER TABLE public.comm_director_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "director_msg_owner" ON public.comm_director_messages;
CREATE POLICY "director_msg_owner" ON public.comm_director_messages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.comm_director_conversations c
      WHERE c.id = conversation_id
        AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'comunicacao_admin'::app_role))
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.comm_director_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );
