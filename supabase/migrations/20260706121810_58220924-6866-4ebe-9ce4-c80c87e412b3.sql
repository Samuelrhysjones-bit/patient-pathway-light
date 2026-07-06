
REVOKE EXECUTE ON FUNCTION public.get_patient_by_code(text) FROM anon, authenticated, public;
DROP FUNCTION public.get_patient_by_code(text);
