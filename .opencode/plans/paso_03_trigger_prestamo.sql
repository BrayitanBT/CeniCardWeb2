-- ============================================================
-- PASO 3: TRIGGER trg_prestamo_aceptado — Lógica del carné
-- ============================================================
-- Copia y pega TODO este bloque en Supabase → SQL Editor → Run
-- ============================================================
-- Reglas:
--   activo    → aceptar → estado_carne = 'bloqueado'
--   vencido   → RECHAZAR (error)
--   bloqueado → RECHAZAR (error)
--   prestamo  → RECHAZAR (error)
--   devuelto  → estado_carne = 'activo'
-- ============================================================

DROP TRIGGER IF EXISTS trg_prestamo_aceptado ON prestamos;

CREATE OR REPLACE FUNCTION fn_prestamo_estado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_estado_carne TEXT;
BEGIN

  -- ==========================================
  -- ACEPTAR: pendiente → aceptado
  -- ==========================================
  IF NEW.estado = 'aceptado' AND OLD.estado = 'pendiente' THEN

    -- Obtener estado actual del carné
    SELECT estado_carne INTO v_estado_carne
    FROM usuarios WHERE id = NEW.usuario_id;

    -- Validaciones: NO permitir si no está activo
    IF v_estado_carne = 'vencido' THEN
      RAISE EXCEPTION 'No se puede aceptar el préstamo: el carné del usuario está vencido. Debe renovarlo primero.';
    END IF;

    IF v_estado_carne = 'bloqueado' THEN
      RAISE EXCEPTION 'No se puede aceptar el préstamo: el carné del usuario está bloqueado. Contacta al área administrativa.';
    END IF;

    IF v_estado_carne = 'prestamo' THEN
      RAISE EXCEPTION 'No se puede aceptar el préstamo: el usuario ya tiene un préstamo activo.';
    END IF;

    -- Si está activo, cambiar a bloqueado
    UPDATE usuarios
    SET estado_carne = 'bloqueado'
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

    -- Restaurar carné a activo
    UPDATE usuarios
    SET estado_carne = 'activo'
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

CREATE TRIGGER trg_prestamo_aceptado
BEFORE UPDATE ON prestamos
FOR EACH ROW
EXECUTE FUNCTION fn_prestamo_estado();
