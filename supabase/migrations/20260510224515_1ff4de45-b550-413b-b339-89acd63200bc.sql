-- Create furniture table
CREATE TABLE IF NOT EXISTS public.pixel_furniture (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES public.pixel_workspaces(id) ON DELETE CASCADE NOT NULL,
    furniture_key TEXT NOT NULL,
    name TEXT,
    position_x INTEGER NOT NULL DEFAULT 0,
    position_y INTEGER NOT NULL DEFAULT 0,
    rotation INTEGER NOT NULL DEFAULT 0,
    z_index INTEGER NOT NULL DEFAULT 10,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pixel_furniture ENABLE ROW LEVEL SECURITY;

-- Policies for furniture
CREATE POLICY "Furniture is viewable by everyone" 
ON public.pixel_furniture FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage furniture" 
ON public.pixel_furniture FOR ALL
USING (auth.jwt()->>'role' = 'service_role' OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
));

-- Add z_index to desks and rooms if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pixel_desks' AND column_name = 'z_index') THEN
        ALTER TABLE public.pixel_desks ADD COLUMN z_index INTEGER NOT NULL DEFAULT 20;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pixel_rooms' AND column_name = 'z_index') THEN
        ALTER TABLE public.pixel_rooms ADD COLUMN z_index INTEGER NOT NULL DEFAULT 5;
    END IF;
END $$;

-- Update trigger for furniture
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pixel_furniture_updated_at ON public.pixel_furniture;
CREATE TRIGGER update_pixel_furniture_updated_at
BEFORE UPDATE ON public.pixel_furniture
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();