
CREATE POLICY "Auth users delete pagos"
  ON public.pagos FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
