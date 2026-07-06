
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  provider_ref text NOT NULL,
  pathway text NOT NULL DEFAULT 'adhd',
  current_stage_id text NOT NULL,
  next_action text,
  access_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "auth update patients" ON public.patients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete patients" ON public.patients FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER patients_set_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.patient_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  from_stage text,
  to_stage text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.patient_audit_log TO authenticated;
GRANT ALL ON public.patient_audit_log TO service_role;
ALTER TABLE public.patient_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read audit" ON public.patient_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert audit" ON public.patient_audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);
