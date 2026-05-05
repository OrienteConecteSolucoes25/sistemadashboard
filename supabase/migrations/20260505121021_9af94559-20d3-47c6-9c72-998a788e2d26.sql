
CREATE TABLE public.eng_internal_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  origem text NOT NULL,
  origem_id text NULL,
  modulo text NULL,
  titulo text NOT NULL,
  detalhe text NULL,
  tipo text NOT NULL DEFAULT 'info',
  route text NULL,
  lida boolean NOT NULL DEFAULT false,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_eng_notif_user ON public.eng_internal_notifications(user_id, lida, created_at DESC);
CREATE INDEX idx_eng_notif_origem ON public.eng_internal_notifications(origem, origem_id);

ALTER TABLE public.eng_internal_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read own or broadcast notifs"
  ON public.eng_internal_notifications FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "auth update own notifs"
  ON public.eng_internal_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.eng_can_edit(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.eng_can_edit(auth.uid()));

CREATE POLICY "edit eng_internal_notifications"
  ON public.eng_internal_notifications FOR INSERT TO authenticated
  WITH CHECK (public.eng_can_edit(auth.uid()));

CREATE POLICY "delete eng_internal_notifications"
  ON public.eng_internal_notifications FOR DELETE TO authenticated
  USING (public.eng_can_edit(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.eng_internal_notifications;
ALTER TABLE public.eng_internal_notifications REPLICA IDENTITY FULL;
