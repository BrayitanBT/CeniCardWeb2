-- ============================================================
-- PASO 2: Trigger trg_prestamo_aceptado ACTUALIZADO (BEFORE UPDATE)
-- ============================================================
-- Cambios:
--   Aceptar: verificar que no haya otra solicitud aceptada del mismo equipo
--   Rechazar: liberar equipo SOLO si no hay otras solicitudes pendientes
--   Devolver: sin cambios
-- ============================================================

DROP TRIGGER IF EXISTS trg_prestamo_aceptado ON prestamos;

CREATE OR REPLACE FUNCTION fn_prestamo_estado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_estado_carne TEXT;
  v_otra_aceptada INT;
  v_otra_pendiente INT;
BEGIN

  -- ==========================================
  -- ACEPTAR: pendiente → aceptado
  -- ==========================================
  IF NEW.estado = 'aceptado' AND OLD.estado = 'pendiente' THEN

    -- Obtener estado actual del carné
    SELECT estado_carne INTO v_estado_carne
    FROM usuarios WHERE id = NEW.usuario_id;

    -- Validaciones de carné
    IF v_estado_carne = 'vencido' THEN
      RAISE EXCEPTION 'No se puede aceptar el préstamo: el carné del usuario está vencido. Debe renovarlo primero.';
    END IF;

    IF v_estado_carne = 'bloqueado' THEN
      RAISE EXCEPTION 'No se puede aceptar el préstamo: el carné del usuario está bloqueado. Contacta al área administrativa.';
    END IF;

    IF v_estado_carne = 'prestamo' THEN
      RAISE EXCEPTION 'No se puede aceptar el préstamo: el usuario ya tiene un préstamo activo.';
    END IF;

    -- Doble validación: verificar que no haya otra solicitud YA aceptada del mismo equipo
    SELECT COUNT(*) INTO v_otra_aceptada
    FROM prestamos
    WHERE equipo_id = NEW.equipo_id
      AND estado = 'aceptado'
      AND id != NEW.id;

    IF v_otra_aceptada > 0 THEN
      RAISE EXCEPTION 'Este equipo ya fue asignado a otro usuario. No se puede aceptar esta solicitud.';
    END IF;

    -- Cambiar estado del carné a bloqueado
    UPDATE usuarios
    SET estado_carne = 'bloqueado'
    WHERE id = NEW.usuario_id;

    -- Registrar fecha de aceptación (equipo ya está 'ocupado' desde el INSERT)
    NEW.fecha_aceptacion = NOW();

  END IF;

  -- ==========================================
  -- RECHAZAR: pendiente → rechazado
  -- ==========================================
  IF NEW.estado = 'rechazado' AND OLD.estado = 'pendiente' THEN

    -- Verificar si hay OTRAS solicitudes pendientes para ese equipo
    SELECT COUNT(*) INTO v_otra_pendiente
    FROM prestamos
    WHERE equipo_id = NEW.equipo_id
      AND estado = 'pendiente'
      AND id != NEW.id;

    IF v_otra_pendiente = 0 THEN
      -- No hay más solicitudes pendientes → liberar equipo
      UPDATE equipos
      SET estado = 'disponible'
      WHERE id = NEW.equipo_id;
    END IF;
    -- Si hay otras pendientes → equipo sigue 'ocupado'

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
