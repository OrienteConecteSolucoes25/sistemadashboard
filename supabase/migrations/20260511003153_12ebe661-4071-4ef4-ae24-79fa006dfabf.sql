-- Adicionar campos de gamificação ao perfil do Pixel Office
ALTER TABLE public.pixel_profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- Tabela de conquistas
CREATE TABLE IF NOT EXISTS public.pixel_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_key TEXT,
  points INTEGER DEFAULT 10,
  requirements JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de conquistas do usuário
CREATE TABLE IF NOT EXISTS public.pixel_user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.pixel_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Habilitar RLS
ALTER TABLE public.pixel_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_user_achievements ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Achivements are viewable by everyone" 
ON public.pixel_achievements FOR SELECT USING (true);

CREATE POLICY "Users can view their own achievements" 
ON public.pixel_user_achievements FOR SELECT 
USING (auth.uid() = user_id);

-- Função para adicionar XP e gerenciar Level Up
CREATE OR REPLACE FUNCTION public.add_pixel_xp(_uid UUID, _amount INTEGER)
RETURNS VOID AS $$
DECLARE
  current_xp INTEGER;
  current_level INTEGER;
  next_level_xp INTEGER;
BEGIN
  -- Buscar status atual
  SELECT xp, level INTO current_xp, current_level 
  FROM public.pixel_profiles 
  WHERE user_id = _uid;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  current_xp := current_xp + _amount;
  next_level_xp := current_level * 1000;

  -- Checar level up
  WHILE current_xp >= next_level_xp LOOP
    current_xp := current_xp - next_level_xp;
    current_level := current_level + 1;
    next_level_xp := current_level * 1000;
  END LOOP;

  -- Atualizar perfil
  UPDATE public.pixel_profiles 
  SET xp = current_xp, level = current_level
  WHERE user_id = _uid;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir conquistas básicas
INSERT INTO public.pixel_achievements (name, description, icon_key, points) VALUES
('Primeiros Passos', 'Entrou no Pixel Office pela primeira vez.', 'footprints', 10),
('Socializador', 'Conversou com 5 colegas diferentes.', 'messages', 50),
('Focado', 'Permaneceu 1 hora em modo foco.', 'target', 100),
('Explorador', 'Visitou 3 salas diferentes.', 'map', 30);
