
-- Allow authenticated users to delete clients
CREATE POLICY "Authenticated users can delete clients" ON public.clientes
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
