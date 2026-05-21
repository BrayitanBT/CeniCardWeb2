-- ============================================================
-- POLÍTICAS RLS COMPLETAS PARA CENICARD
-- ============================================================
-- Permite a admin/funcionario gestionar todo el aplicativo
-- Permite a cada usuario ver/editar su propio perfil
-- Permite login sin autenticar (vía RPC get_user_by_documento)
-- ============================================================

-- ============================================================
-- 0. FUNCIÓN HELPER: Verificar si el usuario es admin/funcionario
-- ============================================================
-- Usa SECURITY DEFINER para evitar recursión infinita de RLS
-- Se usa en las políticas de todas las tablas de gestión
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin_or_funcionario()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
      AND rol IN ('admin', 'funcionario')
  );
$$;

-- ============================================================
-- 1. TABLA: usuarios
-- ============================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'usuarios' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON usuarios', r.policyname);
  END LOOP;
END $$;

-- SELECT: cada usuario ve su propio registro + admin/funcionario ven todos
CREATE POLICY "usuarios_select" ON usuarios
FOR SELECT
USING (
  auth.uid() = id
  OR public.is_admin_or_funcionario()
);

-- INSERT: solo admin/funcionario pueden crear usuarios
CREATE POLICY "usuarios_insert" ON usuarios
FOR INSERT
WITH CHECK (
  public.is_admin_or_funcionario()
);

-- UPDATE: cada usuario edita su perfil + admin/funcionario editan cualquiera
CREATE POLICY "usuarios_update" ON usuarios
FOR UPDATE
USING (
  auth.uid() = id
  OR public.is_admin_or_funcionario()
)
WITH CHECK (
  auth.uid() = id
  OR public.is_admin_or_funcionario()
);

-- DELETE: solo admin/funcionario
CREATE POLICY "usuarios_delete" ON usuarios
FOR DELETE
USING (
  public.is_admin_or_funcionario()
);

-- ============================================================
-- 2. TABLA: prestamos
-- ============================================================

ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'prestamos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON prestamos', r.policyname);
  END LOOP;
END $$;

-- SELECT: admin/funcionario ven todos, cada usuario ve los suyos
CREATE POLICY "prestamos_select" ON prestamos
FOR SELECT
USING (
  usuario_id = auth.uid()
  OR public.is_admin_or_funcionario()
);

-- INSERT: cualquier usuario autenticado puede solicitar
CREATE POLICY "prestamos_insert" ON prestamos
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);

-- UPDATE: admin/funcionario gestionan, cada usuario ve los suyos
CREATE POLICY "prestamos_update" ON prestamos
FOR UPDATE
USING (
  usuario_id = auth.uid()
  OR public.is_admin_or_funcionario()
)
WITH CHECK (
  usuario_id = auth.uid()
  OR public.is_admin_or_funcionario()
);

-- DELETE: solo admin/funcionario
CREATE POLICY "prestamos_delete" ON prestamos
FOR DELETE
USING (
  public.is_admin_or_funcionario()
);

-- ============================================================
-- 3. TABLA: equipos
-- ============================================================

ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'equipos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON equipos', r.policyname);
  END LOOP;
END $$;

-- SELECT: todos los autenticados pueden ver equipos
CREATE POLICY "equipos_select" ON equipos
FOR SELECT
USING (
  auth.role() = 'authenticated'
);

-- INSERT: solo admin/funcionario
CREATE POLICY "equipos_insert" ON equipos
FOR INSERT
WITH CHECK (
  public.is_admin_or_funcionario()
);

-- UPDATE: solo admin/funcionario
CREATE POLICY "equipos_update" ON equipos
FOR UPDATE
USING (
  public.is_admin_or_funcionario()
)
WITH CHECK (
  public.is_admin_or_funcionario()
);

-- DELETE: solo admin/funcionario
CREATE POLICY "equipos_delete" ON equipos
FOR DELETE
USING (
  public.is_admin_or_funcionario()
);

-- ============================================================
-- 4. TABLA: categorias_equipos
-- ============================================================

ALTER TABLE categorias_equipos ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'categorias_equipos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON categorias_equipos', r.policyname);
  END LOOP;
END $$;

-- SELECT: todos los autenticados
CREATE POLICY "categorias_equipos_select" ON categorias_equipos
FOR SELECT
USING (
  auth.role() = 'authenticated'
);

-- INSERT: solo admin/funcionario
CREATE POLICY "categorias_equipos_insert" ON categorias_equipos
FOR INSERT
WITH CHECK (
  public.is_admin_or_funcionario()
);

-- UPDATE: solo admin/funcionario
CREATE POLICY "categorias_equipos_update" ON categorias_equipos
FOR UPDATE
USING (
  public.is_admin_or_funcionario()
)
WITH CHECK (
  public.is_admin_or_funcionario()
);

-- DELETE: solo admin/funcionario
CREATE POLICY "categorias_equipos_delete" ON categorias_equipos
FOR DELETE
USING (
  public.is_admin_or_funcionario()
);

-- ============================================================
-- 5. TABLA: fichas
-- ============================================================

ALTER TABLE fichas ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'fichas' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON fichas', r.policyname);
  END LOOP;
END $$;

-- SELECT: todos los autenticados
CREATE POLICY "fichas_select" ON fichas
FOR SELECT
USING (
  auth.role() = 'authenticated'
);

-- INSERT: solo admin/funcionario
CREATE POLICY "fichas_insert" ON fichas
FOR INSERT
WITH CHECK (
  public.is_admin_or_funcionario()
);

-- UPDATE: solo admin/funcionario
CREATE POLICY "fichas_update" ON fichas
FOR UPDATE
USING (
  public.is_admin_or_funcionario()
)
WITH CHECK (
  public.is_admin_or_funcionario()
);

-- DELETE: solo admin/funcionario
CREATE POLICY "fichas_delete" ON fichas
FOR DELETE
USING (
  public.is_admin_or_funcionario()
);

-- ============================================================
-- 6. TABLA: noticias
-- ============================================================

ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'noticias' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON noticias', r.policyname);
  END LOOP;
END $$;

-- SELECT: todos los autenticados
CREATE POLICY "noticias_select" ON noticias
FOR SELECT
USING (
  auth.role() = 'authenticated'
);

-- INSERT: solo admin/funcionario
CREATE POLICY "noticias_insert" ON noticias
FOR INSERT
WITH CHECK (
  public.is_admin_or_funcionario()
);

-- UPDATE: solo admin/funcionario
CREATE POLICY "noticias_update" ON noticias
FOR UPDATE
USING (
  public.is_admin_or_funcionario()
)
WITH CHECK (
  public.is_admin_or_funcionario()
);

-- DELETE: solo admin/funcionario
CREATE POLICY "noticias_delete" ON noticias
FOR DELETE
USING (
  public.is_admin_or_funcionario()
);

-- ============================================================
-- 7. TABLA: notificaciones
-- ============================================================

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'notificaciones' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON notificaciones', r.policyname);
  END LOOP;
END $$;

-- SELECT: cada usuario ve las suyas + admin/funcionario ven todas
CREATE POLICY "notificaciones_select" ON notificaciones
FOR SELECT
USING (
  usuario_id = auth.uid()
  OR public.is_admin_or_funcionario()
);

-- INSERT: triggers del sistema insertan (anon + authenticated)
CREATE POLICY "notificaciones_insert" ON notificaciones
FOR INSERT
WITH CHECK (
  auth.role() IN ('authenticated', 'anon')
);

-- UPDATE: cada usuario marca las suyas como leídas + admin
CREATE POLICY "notificaciones_update" ON notificaciones
FOR UPDATE
USING (
  usuario_id = auth.uid()
  OR public.is_admin_or_funcionario()
)
WITH CHECK (
  usuario_id = auth.uid()
  OR public.is_admin_or_funcionario()
);

-- DELETE: solo admin/funcionario
CREATE POLICY "notificaciones_delete" ON notificaciones
FOR DELETE
USING (
  public.is_admin_or_funcionario()
);

-- ============================================================
-- 8. TABLA: solicitudes_eventos
-- ============================================================

ALTER TABLE solicitudes_eventos ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'solicitudes_eventos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON solicitudes_eventos', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "solicitudes_eventos_select" ON solicitudes_eventos
FOR SELECT
USING (
  usuario_id = auth.uid()
  OR public.is_admin_or_funcionario()
);

CREATE POLICY "solicitudes_eventos_insert" ON solicitudes_eventos
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "solicitudes_eventos_update" ON solicitudes_eventos
FOR UPDATE
USING (
  usuario_id = auth.uid()
  OR public.is_admin_or_funcionario()
)
WITH CHECK (
  usuario_id = auth.uid()
  OR public.is_admin_or_funcionario()
);

CREATE POLICY "solicitudes_eventos_delete" ON solicitudes_eventos
FOR DELETE
USING (
  public.is_admin_or_funcionario()
);

-- ============================================================
-- 9. TABLA: solicitudes_salones
-- ============================================================

ALTER TABLE solicitudes_salones ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'solicitudes_salones' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON solicitudes_salones', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "solicitudes_salones_select" ON solicitudes_salones
FOR SELECT
USING (
  usuario_id = auth.uid()
  OR public.is_admin_or_funcionario()
);

CREATE POLICY "solicitudes_salones_insert" ON solicitudes_salones
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "solicitudes_salones_update" ON solicitudes_salones
FOR UPDATE
USING (
  usuario_id = auth.uid()
  OR public.is_admin_or_funcionario()
)
WITH CHECK (
  usuario_id = auth.uid()
  OR public.is_admin_or_funcionario()
);

CREATE POLICY "solicitudes_salones_delete" ON solicitudes_salones
FOR DELETE
USING (
  public.is_admin_or_funcionario()
);

-- ============================================================
-- VERIFICACIÓN: listar todas las políticas creadas
-- ============================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
