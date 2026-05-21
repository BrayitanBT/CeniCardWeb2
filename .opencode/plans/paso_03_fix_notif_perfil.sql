-- ============================================================
-- PASO 3: Corregir trg_notif_perfil (AFTER UPDATE en usuarios)
-- ============================================================
-- Solo notifica cuando cambia un campo de perfil REAL,
-- NO cuando cambia estado_carne (por triggers de préstamos).
-- ============================================================

DROP TRIGGER IF EXISTS trg_notif_perfil ON usuarios;

CREATE OR REPLACE FUNCTION fn_notif_perfil()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Solo notificar si cambió un campo de perfil real
  IF OLD.primer_nombre IS DISTINCT FROM NEW.primer_nombre
     OR OLD.segundo_nombre IS DISTINCT FROM NEW.segundo_nombre
     OR OLD.primer_apellido IS DISTINCT FROM NEW.primer_apellido
     OR OLD.segundo_apellido IS DISTINCT FROM NEW.segundo_apellido
     OR OLD.celular IS DISTINCT FROM NEW.celular
     OR OLD.foto_url IS DISTINCT FROM NEW.foto_url
     OR OLD.rh IS DISTINCT FROM NEW.rh
     OR OLD.eps IS DISTINCT FROM NEW.eps
     OR OLD.condicion_medica IS DISTINCT FROM NEW.condicion_medica
     OR OLD.contacto_emergencia_nombre IS DISTINCT FROM NEW.contacto_emergencia_nombre
     OR OLD.contacto_emergencia_telefono IS DISTINCT FROM NEW.contacto_emergencia_telefono
     OR OLD.perfil_profesional IS DISTINCT FROM NEW.perfil_profesional
     OR OLD.centro_formacion IS DISTINCT FROM NEW.centro_formacion
     OR OLD.regional IS DISTINCT FROM NEW.regional
  THEN
    INSERT INTO notificaciones (usuario_id, tipo, titulo, descripcion, icono)
    VALUES (NEW.id, 'perfil_actualizado', 'Perfil actualizado',
      'Tus datos de Cenicard han sido actualizados correctamente.',
      'checkmark-circle-outline');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notif_perfil
AFTER UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION fn_notif_perfil();
