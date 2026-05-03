
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Visibility groups
CREATE TABLE public.visibility_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visibility_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_visibility_groups (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.visibility_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, group_id)
);
ALTER TABLE public.user_visibility_groups ENABLE ROW LEVEL SECURITY;

-- Module settings
CREATE TABLE public.module_visibility_settings (
  module_key TEXT PRIMARY KEY,
  module_label TEXT NOT NULL,
  restricted BOOLEAN NOT NULL DEFAULT false,
  default_assignment TEXT NOT NULL DEFAULT 'creator_groups',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.module_visibility_settings ENABLE ROW LEVEL SECURITY;

-- Record visibility tags
CREATE TABLE public.record_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_table TEXT NOT NULL,
  record_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES public.visibility_groups(id) ON DELETE CASCADE,
  UNIQUE (record_table, record_id, group_id)
);
CREATE INDEX idx_record_visibility_lookup ON public.record_visibility(record_table, record_id);
ALTER TABLE public.record_visibility ENABLE ROW LEVEL SECURITY;

-- Helper: user's group ids
CREATE OR REPLACE FUNCTION public.user_group_ids(_user_id UUID)
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT group_id FROM public.user_visibility_groups WHERE user_id = _user_id
$$;

-- Helper: can user see a record?
CREATE OR REPLACE FUNCTION public.has_visibility(_user_id UUID, _table TEXT, _record_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_restricted BOOLEAN;
BEGIN
  IF public.has_role(_user_id, 'admin') THEN RETURN true; END IF;
  SELECT restricted INTO is_restricted FROM public.module_visibility_settings WHERE module_key = _table;
  IF is_restricted IS NULL OR is_restricted = false THEN RETURN true; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.record_visibility rv
    WHERE rv.record_table = _table AND rv.record_id = _record_id
      AND rv.group_id IN (SELECT public.user_group_ids(_user_id))
  );
END $$;

-- Sample module: projetos
CREATE TABLE public.projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cliente TEXT,
  status TEXT NOT NULL DEFAULT 'em_andamento',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

-- Audit
CREATE TABLE public.visibility_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visibility_audit ENABLE ROW LEVEL SECURITY;

-- ===== Policies =====

-- profiles
CREATE POLICY "users see own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());
CREATE POLICY "admin manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- visibility_groups
CREATE POLICY "auth read groups" ON public.visibility_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage groups" ON public.visibility_groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_visibility_groups
CREATE POLICY "users see own group memberships" ON public.user_visibility_groups FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage memberships" ON public.user_visibility_groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- module settings
CREATE POLICY "auth read module settings" ON public.module_visibility_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage module settings" ON public.module_visibility_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- record visibility
CREATE POLICY "auth read record visibility" ON public.record_visibility FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage record visibility" ON public.record_visibility FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- projetos
CREATE POLICY "view projetos by visibility" ON public.projetos FOR SELECT TO authenticated
  USING (public.has_visibility(auth.uid(), 'projetos', id));
CREATE POLICY "admin manage projetos" ON public.projetos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- audit
CREATE POLICY "admin read audit" ON public.visibility_audit FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin write audit" ON public.visibility_audit FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== Trigger: auto-create profile on signup =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  -- default role: user
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== Seed module list (the 19 OCS modules) =====
INSERT INTO public.module_visibility_settings (module_key, module_label, restricted) VALUES
  ('dashboard', 'Dashboard', false),
  ('sites', 'Sites', false),
  ('projetos', 'Projetos', true),
  ('atividades', 'Atividades', false),
  ('equipes', 'Equipes', false),
  ('art', 'ART / CREA', false),
  ('rfi', 'RFI', false),
  ('suprimentos', 'Suprimentos', false),
  ('demandas', 'Demandas', false),
  ('emails', 'E-mails', false),
  ('mapa', 'Mapa', false),
  ('ligacoes_energia', 'Ligações de Energia', false),
  ('fibra', 'Fibra', false),
  ('integracoes', 'Integrações', false),
  ('auditoria', 'Auditoria', false),
  ('adm', 'ADM', false),
  ('roadmap_ia', 'Roadmap IA', false),
  ('governanca', 'Governança', false),
  ('relatorios', 'Relatórios', false);
