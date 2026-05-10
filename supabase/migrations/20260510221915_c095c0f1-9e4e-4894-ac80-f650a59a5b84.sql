-- Adicionar last_heartbeat à tabela pixel_profiles para monitoramento de presença
ALTER TABLE public.pixel_profiles ADD COLUMN last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Função para atualizar heartbeat
CREATE OR REPLACE FUNCTION public.update_pixel_heartbeat(_uid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.pixel_profiles
  SET last_heartbeat = now()
  WHERE user_id = _uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
