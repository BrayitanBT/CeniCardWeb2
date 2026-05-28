-- Crear bucket para fotos de perfil de usuarios
-- Ejecutar en Supabase SQL Editor (dashboard > SQL Editor)

-- 1. Crear el bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-usuarios', 'fotos-usuarios', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política: permitir SELECT público (para ver las fotos)
CREATE POLICY "Acceso público a fotos-usuarios"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos-usuarios');

-- 3. Política: permitir INSERT a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden subir fotos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fotos-usuarios'
  AND auth.role() = 'authenticated'
);

-- 4. Política: permitir UPDATE a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden actualizar fotos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'fotos-usuarios' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'fotos-usuarios' AND auth.role() = 'authenticated');

-- 5. Política: permitir DELETE al propio usuario o admin (opcional)
CREATE POLICY "Usuarios autenticados pueden eliminar sus fotos"
ON storage.objects FOR DELETE
USING (bucket_id = 'fotos-usuarios' AND auth.role() = 'authenticated');
