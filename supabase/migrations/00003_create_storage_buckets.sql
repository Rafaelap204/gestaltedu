-- Criar bucket para imagens de cursos se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-images', 'course-images', true)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket para thumbnails se não existir (para compatibilidade)
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Configurar políticas de acesso público para course-images
-- Permitir upload autenticado
DROP POLICY IF EXISTS "Permitir upload autenticado em course-images" ON storage.objects;
CREATE POLICY "Permitir upload autenticado em course-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-images');

-- Permitir leitura pública
DROP POLICY IF EXISTS "Permitir leitura pública em course-images" ON storage.objects;
CREATE POLICY "Permitir leitura pública em course-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-images');

-- Permitir delete para usuários autenticados (donos dos arquivos)
DROP POLICY IF EXISTS "Permitir delete para usuários autenticados em course-images" ON storage.objects;
CREATE POLICY "Permitir delete para usuários autenticados em course-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'course-images' AND auth.uid()::text = owner_id::text);

-- Configurar políticas de acesso público para thumbnails (compatibilidade)
-- Permitir upload autenticado
DROP POLICY IF EXISTS "Permitir upload autenticado em thumbnails" ON storage.objects;
CREATE POLICY "Permitir upload autenticado em thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

-- Permitir leitura pública
DROP POLICY IF EXISTS "Permitir leitura pública em thumbnails" ON storage.objects;
CREATE POLICY "Permitir leitura pública em thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

-- Permitir delete para usuários autenticados (donos dos arquivos)
DROP POLICY IF EXISTS "Permitir delete para usuários autenticados em thumbnails" ON storage.objects;
CREATE POLICY "Permitir delete para usuários autenticados em thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails' AND auth.uid()::text = owner_id::text);
