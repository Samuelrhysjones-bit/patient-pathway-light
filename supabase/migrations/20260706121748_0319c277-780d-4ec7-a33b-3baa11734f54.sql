
CREATE OR REPLACE FUNCTION public.get_patient_by_code(_code text)
RETURNS public.patients
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$ SELECT * FROM public.patients WHERE access_code = _code LIMIT 1; $$;
GRANT EXECUTE ON FUNCTION public.get_patient_by_code(text) TO anon, authenticated;
