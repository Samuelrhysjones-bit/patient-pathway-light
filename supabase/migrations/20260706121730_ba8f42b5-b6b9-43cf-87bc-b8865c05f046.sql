
DROP POLICY "auth update patients" ON public.patients;
DROP POLICY "auth delete patients" ON public.patients;
CREATE POLICY "auth update patients" ON public.patients FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth delete patients" ON public.patients FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
