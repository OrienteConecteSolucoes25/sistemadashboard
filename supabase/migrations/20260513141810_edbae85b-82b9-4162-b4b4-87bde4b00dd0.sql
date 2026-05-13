
-- Quota por usuário
CREATE TABLE public.verso_agent_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  mensagens_usadas_mes INT NOT NULL DEFAULT 0,
  limite_mensal INT NOT NULL DEFAULT 200,
  data_reset TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()) + interval '1 month',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.verso_agent_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user reads own quota"
  ON public.verso_agent_quota FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin manages quota"
  ON public.verso_agent_quota FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Cache compartilhado
CREATE TABLE public.verso_agent_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT NOT NULL,
  question_hash TEXT NOT NULL,
  answer TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module_key, question_hash)
);

ALTER TABLE public.verso_agent_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth reads cache"
  ON public.verso_agent_cache FOR SELECT
  TO authenticated USING (true);

-- Auditoria
CREATE TABLE public.verso_agent_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_key TEXT NOT NULL,
  prompt TEXT NOT NULL,
  tools_used JSONB DEFAULT '[]'::jsonb,
  tokens_in INT DEFAULT 0,
  tokens_out INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.verso_agent_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user reads own audit"
  ON public.verso_agent_audit FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_verso_audit_user ON public.verso_agent_audit(user_id, created_at DESC);
CREATE INDEX idx_verso_cache_lookup ON public.verso_agent_cache(module_key, question_hash, expires_at);
