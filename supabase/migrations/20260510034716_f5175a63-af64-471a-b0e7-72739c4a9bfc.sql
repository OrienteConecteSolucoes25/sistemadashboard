CREATE OR REPLACE FUNCTION public.ensure_current_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  uemail text;
  uname text;
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  SELECT email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email)
    INTO uemail, uname
  FROM auth.users WHERE id = uid;
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (uid, uemail, uname)
  ON CONFLICT (id) DO UPDATE
    SET email = COALESCE(EXCLUDED.email, public.profiles.email),
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
END $$;