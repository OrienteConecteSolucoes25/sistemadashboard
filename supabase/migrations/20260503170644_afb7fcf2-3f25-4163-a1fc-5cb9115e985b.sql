ALTER TABLE public.pixel_profiles
  ADD COLUMN IF NOT EXISTS avatar_skin_tone text,
  ADD COLUMN IF NOT EXISTS avatar_hair_color text,
  ADD COLUMN IF NOT EXISTS avatar_outfit_key text,
  ADD COLUMN IF NOT EXISTS avatar_outfit_color text,
  ADD COLUMN IF NOT EXISTS avatar_bottom_key text,
  ADD COLUMN IF NOT EXISTS avatar_shoes_key text,
  ADD COLUMN IF NOT EXISTS avatar_lipstick_key text,
  ADD COLUMN IF NOT EXISTS avatar_earring_key text,
  ADD COLUMN IF NOT EXISTS avatar_glasses_key text,
  ADD COLUMN IF NOT EXISTS avatar_hat_key text,
  ADD COLUMN IF NOT EXISTS avatar_tool_key text;