# Script RLS Completo — CeniCard

> Ejecutar en: **Supabase Dashboard → SQL Editor**

```sql
-- ============================================================
-- CENICARD — SCRIPT COMPLETO DE SEGURIDAD RLS
-- ============================================================
-- Este script hace 4 cosas:
--   1. Crea función helper is_admin_or_funcionario()
--   2. Aplica políticas RLS a TODAS las tablas
--   3. Corrige trigger trg_cupo_ficha (SECURITY DEFINER)
--   4. Limpia la RPC temporal update_estado_carne (ya no necesaria)
-- ============================================================

-- ============================================================
-- SECCIÓN 1: FUNCIÓN HELPER is_admin_or_funcionario()
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
-- SECCIÓN 2: POLÍTICAS RLS — TODAS LAS TABLAS
-- ============================================================

-- --------------------------------------------------------
-- 2.1 TABLA: usuarios
-- --------------------------------------------------------
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'usuarios' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON usuarios', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "usuarios_select" ON usuarios
FOR SELECT USING (
  auth.uid() = id OR public.is_admin_or_funcionario()
);

CREATE POLICY "usuarios_insert" ON usuarios
FOR INSERT WITH CHECK (
  public.is_admin_or_funcionario()
);

CREATE POLICY "usuarios_update" ON usuarios
FOR UPDATE
USING (
  auth.uid() = id OR public.is_admin_or_funcionario()
)
WITH CHECK (
  auth.uid() = id OR public.is_admin_or_funcionario()
);

CREATE POLICY "usuarios_delete" ON usuarios
FOR DELETE USING (
  public.is_admin_or_funcionario()
);

-- --------------------------------------------------------
-- 2.2 TABLA: prestamos
-- --------------------------------------------------------
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'prestamos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON prestamos', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "prestamos_select" ON prestamos
FOR SELECT USING (
  usuario_id = auth.uid() OR public.is_admin_or_funcionario()
);

CREATE POLICY "prestamos_insert" ON prestamos
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "prestamos_update" ON prestamos
FOR UPDATE
USING (
  usuario_id = auth.uid() OR public.is_admin_or_funcionario()
)
WITH CHECK (
  usuario_id = auth.uid() OR public.is_admin_or_funcionario()
);

CREATE POLICY "prestamos_delete" ON prestamos
FOR DELETE USING (
  public.is_admin_or_funcionario()
);

-- --------------------------------------------------------
-- 2.3 TABLA: equipos
-- --------------------------------------------------------
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'equipos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON equipos', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "equipos_select" ON equipos
FOR SELECT USING (
  auth.role() = 'authenticated'
);

CREATE POLICY "equipos_insert" ON equipos
FOR INSERT WITH CHECK (
  public.is_admin_or_funcionario()
);

CREATE POLICY "equipos_update" ON equipos
FOR UPDATE
USING (public.is_admin_or_funcionario())
WITH CHECK (public.is_admin_or_funcionario());

CREATE POLICY "equipos_delete" ON equipos
FOR DELETE USING (
  public.is_admin_or_funcionario()
);

-- --------------------------------------------------------
-- 2.4 TABLA: categorias_equipos
-- --------------------------------------------------------
ALTER TABLE categorias_equipos ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'categorias_equipos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON categorias_equipos', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "categorias_equipos_select" ON categorias_equipos
FOR SELECT USING (
  auth.role() = 'authenticated'
);

CREATE POLICY "categorias_equipos_insert" ON categorias_equipos
FOR INSERT WITH CHECK (
  public.is_admin_or_funcionario()
);

CREATE POLICY "categorias_equipos_update" ON categorias_equipos
FOR UPDATE
USING (public.is_admin_or_funcionario())
WITH CHECK (public.is_admin_or_funcionario());

CREATE POLICY "categorias_equipos_delete" ON categorias_equipos
FOR DELETE USING (
  public.is_admin_or_funcionario()
);

-- --------------------------------------------------------
-- 2.5 TABLA: fichas
-- --------------------------------------------------------
ALTER TABLE fichas ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'fichas' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON fichas', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "fichas_select" ON fichas
FOR SELECT USING (
  auth.role() = 'authenticated'
);

CREATE POLICY "fichas_insert" ON fichas
FOR INSERT WITH CHECK (
  public.is_admin_or_funcionario()
);

CREATE POLICY "fichas_update" ON fichas
FOR UPDATE
USING (public.is_admin_or_funcionario())
WITH CHECK (public.is_admin_or_funcionario());

CREATE POLICY "fichas_delete" ON fichas
FOR DELETE USING (
  public.is_admin_or_funcionario()
);

-- --------------------------------------------------------
-- 2.6 TABLA: noticias
-- --------------------------------------------------------
ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'noticias' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON noticias', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "noticias_select" ON noticias
FOR SELECT USING (
  auth.role() = 'authenticated'
);

CREATE POLICY "noticias_insert" ON noticias
FOR INSERT WITH CHECK (
  public.is_admin_or_funcionario()
);

CREATE POLICY "noticias_update" ON noticias
FOR UPDATE
USING (public.is_admin_or_funcionario())
WITH CHECK (public.is_admin_or_funcionario());

CREATE POLICY "noticias_delete" ON noticias
FOR DELETE USING (
  public.is_admin_or_funcionario()
);

-- --------------------------------------------------------
-- 2.7 TABLA: notificaciones
-- --------------------------------------------------------
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'notificaciones' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON notificaciones', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "notificaciones_select" ON notificaciones
FOR SELECT USING (
  usuario_id = auth.uid() OR public.is_admin_or_funcionario()
);

CREATE POLICY "notificaciones_insert" ON notificaciones
FOR INSERT WITH CHECK (
  auth.role() IN ('authenticated', 'anon')
);

CREATE POLICY "notificaciones_update" ON notificaciones
FOR UPDATE
USING (
  usuario_id = auth.uid() OR public.is_admin_or_funcionario()
)
WITH CHECK (
  usuario_id = auth.uid() OR public.is_admin_or_funcionario()
);

CREATE POLICY "notificaciones_delete" ON notificaciones
FOR DELETE USING (
  public.is_admin_or_funcionario()
);

-- --------------------------------------------------------
-- 2.8 TABLA: solicitudes_eventos
-- --------------------------------------------------------
ALTER TABLE solicitudes_eventos ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'solicitudes_eventos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON solicitudes_eventos', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "solicitudes_eventos_select" ON solicitudes_eventos
FOR SELECT USING (
  usuario_id = auth.uid() OR public.is_admin_or_funcionario()
);

CREATE POLICY "solicitudes_eventos_insert" ON solicitudes_eventos
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "solicitudes_eventos_update" ON solicitudes_eventos
FOR UPDATE
USING (
  usuario_id = auth.uid() OR public.is_admin_or_funcionario()
)
WITH CHECK (
  usuario_id = auth.uid() OR public.is_admin_or_funcionario()
);

CREATE POLICY "solicitudes_eventos_delete" ON solicitudes_eventos
FOR DELETE USING (
  public.is_admin_or_funcionario()
);

-- --------------------------------------------------------
-- 2.9 TABLA: solicitudes_salones
-- --------------------------------------------------------
ALTER TABLE solicitudes_salones ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'solicitudes_salones' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON solicitudes_salones', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "solicitudes_salones_select" ON solicitudes_salones
FOR SELECT USING (
  usuario_id = auth.uid() OR public.is_admin_or_funcionario()
);

CREATE POLICY "solicitudes_salones_insert" ON solicitudes_salones
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "solicitudes_salones_update" ON solicitudes_salones
FOR UPDATE
USING (
  usuario_id = auth.uid() OR public.is_admin_or_funcionario()
)
WITH CHECK (
  usuario_id = auth.uid() OR public.is_admin_or_funcionario()
);

CREATE POLICY "solicitudes_salones_delete" ON solicitudes_salones
FOR DELETE USING (
  public.is_admin_or_funcionario()
);

-- ============================================================
-- SECCIÓN 3: CORREGIR TRIGGER trg_cupo_ficha
-- ============================================================

DROP TRIGGER IF EXISTS trg_cupo_ficha ON usuarios;

CREATE OR REPLACE FUNCTION fn_cupo_ficha()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cupos INT;
  v_inscritos INT;
BEGIN
  IF NEW.rol = 'aprendiz' AND NEW.ficha_id IS NOT NULL THEN
    SELECT cupos_maximos INTO v_cupos
    FROM fichas WHERE id = NEW.ficha_id;

    SELECT COUNT(*) INTO v_inscritos
    FROM usuarios
    WHERE ficha_id = NEW.ficha_id
      AND rol = 'aprendiz'
      AND activo = TRUE
      AND id <> NEW.id;

    IF v_inscritos >= v_cupos THEN
      RAISE EXCEPTION 'La ficha % ya alcanzó su límite de % aprendices.',
        NEW.ficha_id, v_cupos;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cupo_ficha
BEFORE INSERT ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_cupo_ficha();

CREATE TRIGGER trg_cupo_ficha_update
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_cupo_ficha();

-- ============================================================
-- SECCIÓN 4: LIMPIEZA — Eliminar RPC temporal
-- ============================================================

DROP FUNCTION IF EXISTS public.update_estado_carne(UUID, TEXT);

-- ============================================================
-- SECCIÓN 5: VERIFICACIÓN
-- ============================================================

SELECT
  tablename,
  policyname,
  cmd AS operacion
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```
