-- Storage RLS policies for private buckets: garantias, clientes, solicitud_garantias
-- Allow authenticated users full access to objects in these buckets

DROP POLICY IF EXISTS "Auth users read private buckets" ON storage.objects;
DROP POLICY IF EXISTS "Auth users upload private buckets" ON storage.objects;
DROP POLICY IF EXISTS "Auth users update private buckets" ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete private buckets" ON storage.objects;

CREATE POLICY "Auth users read private buckets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id IN ('garantias', 'clientes', 'solicitud_garantias'));

CREATE POLICY "Auth users upload private buckets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('garantias', 'clientes', 'solicitud_garantias'));

CREATE POLICY "Auth users update private buckets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('garantias', 'clientes', 'solicitud_garantias'))
WITH CHECK (bucket_id IN ('garantias', 'clientes', 'solicitud_garantias'));

CREATE POLICY "Auth users delete private buckets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('garantias', 'clientes', 'solicitud_garantias'));