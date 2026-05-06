
-- 1) Coluna master_password_hash
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS master_password_hash text;

-- Default: senha "12345678" (bcrypt) para todas as empresas existentes
UPDATE public.companies
SET master_password_hash = crypt('12345678', gen_salt('bf', 10))
WHERE master_password_hash IS NULL;

-- Trigger para empresas novas: se nenhum hash for informado, usa "12345678"
CREATE OR REPLACE FUNCTION public.companies_set_default_master_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.master_password_hash IS NULL OR NEW.master_password_hash = '' THEN
    NEW.master_password_hash := crypt('12345678', gen_salt('bf', 10));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_companies_default_master_pw ON public.companies;
CREATE TRIGGER trg_companies_default_master_pw
BEFORE INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.companies_set_default_master_password();

-- 2) Verificar a senha mestre
CREATE OR REPLACE FUNCTION public.verify_company_master_password(_company_id uuid, _password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, extensions
AS $$
DECLARE
  h text;
BEGIN
  SELECT master_password_hash INTO h FROM public.companies WHERE id = _company_id;
  IF h IS NULL THEN RETURN false; END IF;
  RETURN h = crypt(_password, h);
END;
$$;

REVOKE ALL ON FUNCTION public.verify_company_master_password(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_company_master_password(uuid, text) TO authenticated;

-- 3) Definir/alterar a senha mestre (apenas financeiro OCS ou admin da empresa)
CREATE OR REPLACE FUNCTION public.set_company_master_password(
  _company_id uuid,
  _new_password text,
  _current_password text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  uid uuid := auth.uid();
  is_ocs boolean := false;
  is_company_admin boolean := false;
  current_hash text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF _new_password IS NULL OR length(_new_password) < 6 THEN
    RAISE EXCEPTION 'senha mestre deve ter ao menos 6 caracteres';
  END IF;

  SELECT public.is_financeiro_ocs(uid) INTO is_ocs;

  SELECT EXISTS(
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = _company_id AND cu.user_id = uid AND cu.role = 'admin'
  ) INTO is_company_admin;

  IF NOT (is_ocs OR is_company_admin) THEN
    RAISE EXCEPTION 'sem permissao';
  END IF;

  -- Admin da empresa precisa confirmar a senha atual
  IF is_company_admin AND NOT is_ocs THEN
    SELECT master_password_hash INTO current_hash FROM public.companies WHERE id = _company_id;
    IF current_hash IS NULL OR current_hash <> crypt(COALESCE(_current_password, ''), current_hash) THEN
      RAISE EXCEPTION 'senha atual incorreta';
    END IF;
  END IF;

  UPDATE public.companies
    SET master_password_hash = crypt(_new_password, gen_salt('bf', 10))
    WHERE id = _company_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.set_company_master_password(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_company_master_password(uuid, text, text) TO authenticated;
