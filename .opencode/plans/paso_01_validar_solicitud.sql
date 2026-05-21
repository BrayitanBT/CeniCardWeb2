-- ============================================================
-- PASO 1: Trigger trg_validar_solicitud_prestamo (BEFORE INSERT)
-- ============================================================
-- Evita que dos usuarios soliciten el mismo equipo al mismo tiempo.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_validar_solicitud_prestamo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_estado_equipo TEXT;
  v_activo_equipo BOOLEAN;
  v_solicitud_existente INT;
BEGIN

  -- 1. Verificar que el equipo esté disponible y activo
  SELECT estado, activo
  INTO v_estado_equipo, v_activo_equipo
  FROM equipos
  WHERE id = NEW.equipo_id;

  IF v_estado_equipo IS NULL THEN
    RAISE EXCEPTION 'El equipo no existe.';
  END IF;

  IF NOT v_activo_equipo THEN
    RAISE EXCEPTION 'El equipo no está activo.';
  END IF;

  IF v_estado_equipo != 'disponible' THEN
    RAISE EXCEPTION 'El equipo no está disponible para préstamo. Estado actual: %', v_estado_equipo;
  END IF;

  -- 2. Verificar que NO exista otra solicitud pendiente o aceptada para ese equipo
  SELECT COUNT(*) INTO v_solicitud_existente
  FROM prestamos
  WHERE equipo_id = NEW.equipo_id
    AND estado IN ('pendiente', 'aceptado');

  IF v_solicitud_existente > 0 THEN
    RAISE EXCEPTION 'El equipo ya tiene una solicitud pendiente o aceptada. No se puede solicitar.';
  END IF;

  -- 3. Marcar equipo como ocupado
  UPDATE equipos
  SET estado = 'ocupado'
  WHERE id = NEW.equipo_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_solicitud_prestamo
BEFORE INSERT ON prestamos
FOR EACH ROW
EXECUTE FUNCTION fn_validar_solicitud_prestamo();
