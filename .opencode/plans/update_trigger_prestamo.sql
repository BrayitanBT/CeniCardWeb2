-- ============================================================
-- ACTUALIZACIÓN: Trigger trg_prestamo_aceptado
-- Lógica de estado del carné al aceptar/devolver préstamos
-- ============================================================
-- REEMPLAZA el trigger existente en prestamos (BEFORE UPDATE)
-- ============================================================

-- 1. Eliminar el trigger existente
DROP TRIGGER IF EXISTS trg_prestamo_aceptado ON prestamos;

-- 2. Eliminar la función anterior si existía con este nombre
DROP FUNCTION IF EXISTS fn_prestamo_estado() CASCADE;

-- 3. Crear la nueva función con la lógica de estados
CREATE OR REPLACE FUNCTION fn_prestamo_estado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN

  -- ==========================================
  -- ACEPTAR: pendiente → aceptado
  -- ==========================================
  IF NEW.estado = 'aceptado' AND OLD.estado = 'pendiente' THEN

    -- Lógica de estado del carné:
    -- activo    → prestamo   (carné operativo, en uso)
    -- prestamo  → bloqueado  (ya tenía otro préstamo activo, doble préstamo)
    -- vencido   → vencido    (se mantiene, requiere renovación)
    -- bloqueado → bloqueado  (se mantiene)
    UPDATE usuarios
    SET estado_carne = CASE
        WHEN estado_carne = 'activo'    THEN 'prestamo'
        WHEN estado_carne = 'prestamo'  THEN 'bloqueado'
        WHEN estado_carne = 'vencido'   THEN 'vencido'
        WHEN estado_carne = 'bloqueado' THEN 'bloqueado'
        ELSE 'prestamo'
    END
    WHERE id = NEW.usuario_id;

    -- Marcar equipo como ocupado
    UPDATE equipos
    SET estado = 'ocupado'
    WHERE id = NEW.equipo_id;

    -- Registrar fecha de aceptación
    NEW.fecha_aceptacion = NOW();

  END IF;

  -- ==========================================
  -- RECHAZAR: pendiente → rechazado
  -- ==========================================
  IF NEW.estado = 'rechazado' AND OLD.estado = 'pendiente' THEN
    -- Liberar el equipo si estaba ocupado (por seguridad)
    UPDATE equipos
    SET estado = 'disponible'
    WHERE id = NEW.equipo_id AND estado = 'ocupado';
  END IF;

  -- ==========================================
  -- DEVOLVER: aceptado → devuelto
  -- ==========================================
  IF NEW.estado = 'devuelto' AND OLD.estado = 'aceptado' THEN

    -- Verificar si el usuario tiene OTROS préstamos activos
    -- Si tiene más préstamos → se queda bloqueado
    -- Si no tiene más préstamos → vuelve a activo
    UPDATE usuarios
    SET estado_carne = CASE
        WHEN EXISTS (
          SELECT 1 FROM prestamos
          WHERE usuario_id = NEW.usuario_id
            AND estado = 'aceptado'
            AND id != NEW.id
        ) THEN 'bloqueado'
        ELSE 'activo'
    END
    WHERE id = NEW.usuario_id;

    -- Liberar el equipo
    UPDATE equipos
    SET estado = 'disponible'
    WHERE id = NEW.equipo_id;

    -- Registrar fecha de devolución
    NEW.fecha_devolucion = NOW();

  END IF;

  RETURN NEW;
END;
$$;

-- 4. Recrear el trigger con la nueva función
CREATE TRIGGER trg_prestamo_aceptado
BEFORE UPDATE ON prestamos
FOR EACH ROW
EXECUTE FUNCTION fn_prestamo_estado();

-- ============================================================
-- Verificación: listar triggers de prestamos
-- ============================================================
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'prestamos'
ORDER BY trigger_name;
