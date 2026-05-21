-- ============================================================
-- PASO 4: CORREGIR trigger cupo_ficha + LIMPIEZA
-- ============================================================
-- Copia y pega TODO este bloque en Supabase → SQL Editor → Run
-- ============================================================

-- 4.1 Recrear trg_cupo_ficha con SECURITY DEFINER
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

-- 4.2 Eliminar RPC temporal (ya no necesaria con las nuevas RLS)
DROP FUNCTION IF EXISTS public.update_estado_carne(UUID, TEXT);

-- 4.3 VERIFICACIÓN: listar todas las políticas
SELECT
  tablename,
  policyname,
  cmd AS operacion
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
