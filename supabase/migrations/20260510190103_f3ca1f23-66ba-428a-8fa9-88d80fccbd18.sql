
-- Permitir múltiplas empresas por usuário
ALTER TABLE public.company_users DROP CONSTRAINT IF EXISTS company_users_user_id_key;
ALTER TABLE public.company_users
  ADD CONSTRAINT company_users_company_user_unique UNIQUE (company_id, user_id);

CREATE OR REPLACE FUNCTION public.is_platform_owner(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT _uid = '3510fb25-714e-4906-b6bb-a2a9cef7c8c6'::uuid
$$;

CREATE OR REPLACE FUNCTION public.protect_platform_owner_membership()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  owner_id uuid := '3510fb25-714e-4906-b6bb-a2a9cef7c8c6'::uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.user_id = owner_id AND COALESCE(auth.uid(),'00000000-0000-0000-0000-000000000000'::uuid) <> owner_id THEN
      RAISE EXCEPTION 'Apenas o owner da plataforma pode remover-se de uma empresa';
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.user_id = owner_id AND COALESCE(auth.uid(),'00000000-0000-0000-0000-000000000000'::uuid) <> owner_id THEN
      IF (NEW.is_company_admin IS DISTINCT FROM OLD.is_company_admin)
         OR (NEW.user_id IS DISTINCT FROM OLD.user_id)
         OR (NEW.company_id IS DISTINCT FROM OLD.company_id) THEN
        RAISE EXCEPTION 'Apenas o owner da plataforma pode alterar seu próprio vínculo';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_protect_platform_owner ON public.company_users;
CREATE TRIGGER trg_protect_platform_owner
BEFORE UPDATE OR DELETE ON public.company_users
FOR EACH ROW EXECUTE FUNCTION public.protect_platform_owner_membership();

CREATE OR REPLACE FUNCTION public.add_platform_owner_to_new_company()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  owner_id uuid := '3510fb25-714e-4906-b6bb-a2a9cef7c8c6'::uuid;
BEGIN
  INSERT INTO public.company_users (company_id, user_id, is_company_admin)
  VALUES (NEW.id, owner_id, true)
  ON CONFLICT (company_id, user_id) DO UPDATE SET is_company_admin = true;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_add_platform_owner ON public.companies;
CREATE TRIGGER trg_add_platform_owner
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.add_platform_owner_to_new_company();

INSERT INTO public.company_users (company_id, user_id, is_company_admin)
SELECT c.id, '3510fb25-714e-4906-b6bb-a2a9cef7c8c6'::uuid, true
FROM public.companies c
ON CONFLICT (company_id, user_id) DO UPDATE SET is_company_admin = true;
