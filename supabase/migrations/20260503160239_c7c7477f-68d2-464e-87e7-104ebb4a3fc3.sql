
-- ============================================================
-- PIXEL OFFICE — Initial schema
-- ============================================================

-- 1) pixel_profiles
CREATE TABLE public.pixel_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  visibility_group_id UUID REFERENCES public.visibility_groups(id) ON DELETE SET NULL,
  display_name TEXT,
  job_title TEXT,
  age INT,
  show_age BOOLEAN NOT NULL DEFAULT false,
  linkedin_url TEXT,
  department TEXT,
  sector_description TEXT,
  avatar_sprite_key TEXT,
  avatar_body_key TEXT,
  avatar_hair_key TEXT,
  avatar_clothes_key TEXT,
  avatar_accessory_key TEXT,
  status TEXT NOT NULL DEFAULT 'offline'
    CHECK (status IN ('online','offline','working','meeting','away','busy')),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) pixel_workspaces
CREATE TABLE public.pixel_workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visibility_group_id UUID NOT NULL UNIQUE REFERENCES public.visibility_groups(id) ON DELETE CASCADE,
  workspace_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  background_asset_key TEXT,
  layout_mode TEXT NOT NULL DEFAULT 'grid',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) pixel_desks
CREATE TABLE public.pixel_desks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.pixel_workspaces(id) ON DELETE CASCADE,
  user_id UUID,
  desk_name TEXT,
  desk_type TEXT NOT NULL DEFAULT 'standard',
  position_x INT NOT NULL DEFAULT 0,
  position_y INT NOT NULL DEFAULT 0,
  rotation INT NOT NULL DEFAULT 0,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) pixel_positions
CREATE TABLE public.pixel_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  workspace_id UUID REFERENCES public.pixel_workspaces(id) ON DELETE SET NULL,
  position_x INT NOT NULL DEFAULT 0,
  position_y INT NOT NULL DEFAULT 0,
  direction TEXT NOT NULL DEFAULT 'down',
  current_action TEXT NOT NULL DEFAULT 'idle'
    CHECK (current_action IN ('idle','walking','working','meeting','sitting','away','offline')),
  is_sitting BOOLEAN NOT NULL DEFAULT false,
  target_x INT,
  target_y INT,
  last_moved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) pixel_rooms
CREATE TABLE public.pixel_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.pixel_workspaces(id) ON DELETE CASCADE,
  room_key TEXT NOT NULL,
  name TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'meeting',
  position_x INT NOT NULL DEFAULT 0,
  position_y INT NOT NULL DEFAULT 0,
  capacity INT NOT NULL DEFAULT 8,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, room_key)
);

-- 6) pixel_meetings
CREATE TABLE public.pixel_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.pixel_workspaces(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.pixel_rooms(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','active','finished','cancelled')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7) pixel_meeting_participants
CREATE TABLE public.pixel_meeting_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.pixel_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  participant_status TEXT NOT NULL DEFAULT 'invited'
    CHECK (participant_status IN ('invited','accepted','joined','left','declined','removed')),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, user_id)
);

-- 8) pixel_messages
CREATE TABLE public.pixel_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.pixel_workspaces(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.pixel_rooms(id) ON DELETE SET NULL,
  sender_user_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'group'
    CHECK (message_type IN ('public','group','room','meeting','system')),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9) pixel_admin_actions
CREATE TABLE public.pixel_admin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  target_user_id UUID,
  action_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_pixel_profiles_group ON public.pixel_profiles(visibility_group_id);
CREATE INDEX idx_pixel_profiles_status ON public.pixel_profiles(status);
CREATE INDEX idx_pixel_desks_workspace ON public.pixel_desks(workspace_id);
CREATE INDEX idx_pixel_desks_user ON public.pixel_desks(user_id);
CREATE INDEX idx_pixel_positions_workspace ON public.pixel_positions(workspace_id);
CREATE INDEX idx_pixel_rooms_workspace ON public.pixel_rooms(workspace_id);
CREATE INDEX idx_pixel_meetings_workspace ON public.pixel_meetings(workspace_id);
CREATE INDEX idx_pixel_meetings_room ON public.pixel_meetings(room_id);
CREATE INDEX idx_pixel_meeting_participants_meeting ON public.pixel_meeting_participants(meeting_id);
CREATE INDEX idx_pixel_meeting_participants_user ON public.pixel_meeting_participants(user_id);
CREATE INDEX idx_pixel_messages_workspace_created ON public.pixel_messages(workspace_id, created_at DESC);
CREATE INDEX idx_pixel_messages_room ON public.pixel_messages(room_id);
CREATE INDEX idx_pixel_admin_actions_admin ON public.pixel_admin_actions(admin_user_id);
CREATE INDEX idx_pixel_admin_actions_target ON public.pixel_admin_actions(target_user_id);

-- ============================================================
-- updated_at trigger function (reuse pattern)
-- ============================================================
CREATE OR REPLACE FUNCTION public.pixel_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_pixel_profiles_updated BEFORE UPDATE ON public.pixel_profiles
  FOR EACH ROW EXECUTE FUNCTION public.pixel_set_updated_at();
CREATE TRIGGER trg_pixel_workspaces_updated BEFORE UPDATE ON public.pixel_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.pixel_set_updated_at();
CREATE TRIGGER trg_pixel_desks_updated BEFORE UPDATE ON public.pixel_desks
  FOR EACH ROW EXECUTE FUNCTION public.pixel_set_updated_at();
CREATE TRIGGER trg_pixel_positions_updated BEFORE UPDATE ON public.pixel_positions
  FOR EACH ROW EXECUTE FUNCTION public.pixel_set_updated_at();
CREATE TRIGGER trg_pixel_rooms_updated BEFORE UPDATE ON public.pixel_rooms
  FOR EACH ROW EXECUTE FUNCTION public.pixel_set_updated_at();
CREATE TRIGGER trg_pixel_meetings_updated BEFORE UPDATE ON public.pixel_meetings
  FOR EACH ROW EXECUTE FUNCTION public.pixel_set_updated_at();
CREATE TRIGGER trg_pixel_meeting_participants_updated BEFORE UPDATE ON public.pixel_meeting_participants
  FOR EACH ROW EXECUTE FUNCTION public.pixel_set_updated_at();
CREATE TRIGGER trg_pixel_messages_updated BEFORE UPDATE ON public.pixel_messages
  FOR EACH ROW EXECUTE FUNCTION public.pixel_set_updated_at();

-- ============================================================
-- Helper: user belongs to a visibility group
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_in_group(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_visibility_groups
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- ============================================================
-- Auto-create workspace when a visibility_group is created
-- ============================================================
CREATE OR REPLACE FUNCTION public.pixel_create_workspace_for_group()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.pixel_workspaces (visibility_group_id, workspace_key, name, description)
  VALUES (
    NEW.id,
    'ws_' || replace(NEW.id::text, '-', ''),
    'Escritório ' || NEW.name,
    'Workspace do grupo ' || NEW.name
  )
  ON CONFLICT (visibility_group_id) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_pixel_workspace_for_group
AFTER INSERT ON public.visibility_groups
FOR EACH ROW EXECUTE FUNCTION public.pixel_create_workspace_for_group();

-- Backfill: create workspace for already-existing groups
INSERT INTO public.pixel_workspaces (visibility_group_id, workspace_key, name, description)
SELECT g.id, 'ws_' || replace(g.id::text, '-', ''), 'Escritório ' || g.name, 'Workspace do grupo ' || g.name
FROM public.visibility_groups g
WHERE NOT EXISTS (SELECT 1 FROM public.pixel_workspaces w WHERE w.visibility_group_id = g.id);

-- ============================================================
-- Register modules in module_visibility_settings
-- ============================================================
INSERT INTO public.module_visibility_settings (module_key, module_label, restricted, default_assignment) VALUES
  ('pixel_profiles', 'Pixel — Personagens', true, 'creator_groups'),
  ('pixel_desks', 'Pixel — Mesas', true, 'creator_groups'),
  ('pixel_rooms', 'Pixel — Salas', true, 'creator_groups'),
  ('pixel_meetings', 'Pixel — Reuniões', true, 'creator_groups'),
  ('pixel_messages', 'Pixel — Mensagens', true, 'creator_groups')
ON CONFLICT (module_key) DO NOTHING;

-- ============================================================
-- Enable RLS
-- ============================================================
ALTER TABLE public.pixel_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_desks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_admin_actions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- pixel_profiles
CREATE POLICY "admin manage pixel_profiles" ON public.pixel_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "view pixel_profiles by group" ON public.pixel_profiles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR visibility_group_id IS NULL
    OR public.user_in_group(auth.uid(), visibility_group_id)
  );

CREATE POLICY "user insert own pixel_profile" ON public.pixel_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user update own pixel_profile" ON public.pixel_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND is_blocked = false)
  WITH CHECK (user_id = auth.uid());

-- pixel_workspaces
CREATE POLICY "admin manage pixel_workspaces" ON public.pixel_workspaces
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "view pixel_workspaces by membership" ON public.pixel_workspaces
  FOR SELECT TO authenticated
  USING (public.user_in_group(auth.uid(), visibility_group_id));

-- pixel_desks
CREATE POLICY "admin manage pixel_desks" ON public.pixel_desks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "view pixel_desks by workspace membership" ON public.pixel_desks
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pixel_workspaces w
    WHERE w.id = workspace_id AND public.user_in_group(auth.uid(), w.visibility_group_id)
  ));

-- pixel_positions
CREATE POLICY "admin manage pixel_positions" ON public.pixel_positions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "view pixel_positions by workspace membership" ON public.pixel_positions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR workspace_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.pixel_workspaces w
      WHERE w.id = workspace_id AND public.user_in_group(auth.uid(), w.visibility_group_id)
    )
  );

CREATE POLICY "user upsert own position" ON public.pixel_positions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user update own position" ON public.pixel_positions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- pixel_rooms
CREATE POLICY "admin manage pixel_rooms" ON public.pixel_rooms
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "view pixel_rooms by workspace membership" ON public.pixel_rooms
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pixel_workspaces w
    WHERE w.id = workspace_id AND public.user_in_group(auth.uid(), w.visibility_group_id)
  ));

-- pixel_meetings
CREATE POLICY "admin manage pixel_meetings" ON public.pixel_meetings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "view pixel_meetings by workspace membership" ON public.pixel_meetings
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pixel_workspaces w
    WHERE w.id = workspace_id AND public.user_in_group(auth.uid(), w.visibility_group_id)
  ));

-- pixel_meeting_participants
CREATE POLICY "admin manage pixel_meeting_participants" ON public.pixel_meeting_participants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "view participants of accessible meetings" ON public.pixel_meeting_participants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.pixel_meetings m
      JOIN public.pixel_workspaces w ON w.id = m.workspace_id
      WHERE m.id = meeting_id AND public.user_in_group(auth.uid(), w.visibility_group_id)
    )
  );

CREATE POLICY "user manage own participation" ON public.pixel_meeting_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- pixel_messages
CREATE POLICY "admin manage pixel_messages" ON public.pixel_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "view pixel_messages by workspace membership" ON public.pixel_messages
  FOR SELECT TO authenticated
  USING (
    is_deleted = false
    AND EXISTS (
      SELECT 1 FROM public.pixel_workspaces w
      WHERE w.id = workspace_id AND public.user_in_group(auth.uid(), w.visibility_group_id)
    )
  );

CREATE POLICY "user send messages in own workspace" ON public.pixel_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.pixel_workspaces w
      WHERE w.id = workspace_id AND public.user_in_group(auth.uid(), w.visibility_group_id)
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.pixel_profiles p
      WHERE p.user_id = auth.uid() AND p.is_blocked = true
    )
  );

-- pixel_admin_actions
CREATE POLICY "admin read pixel_admin_actions" ON public.pixel_admin_actions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "admin write pixel_admin_actions" ON public.pixel_admin_actions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND admin_user_id = auth.uid());
