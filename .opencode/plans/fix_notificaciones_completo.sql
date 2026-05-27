-- ============================================================
-- CREAR TABLA notificaciones SI NO EXISTE
-- ============================================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT,
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS RLS para notificaciones
-- ============================================================
DROP POLICY IF EXISTS "notificaciones_select" ON notificaciones;
DROP POLICY IF EXISTS "notificaciones_insert" ON notificaciones;
DROP POLICY IF EXISTS "notificaciones_update" ON notificaciones;
DROP POLICY IF EXISTS "notificaciones_delete" ON notificaciones;

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

-- ============================================================
-- TRIGGER: Notificar a admins cuando se crea un préstamo
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_notif_prestamo_creado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notificaciones (usuario_id, tipo, titulo, descripcion)
  SELECT u.id, 'prestamo_creado', 'Nueva solicitud de préstamo', 'Un usuario ha solicitado un préstamo'
  FROM usuarios u
  WHERE u.rol IN ('admin', 'funcionario');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_prestamo_creado ON prestamos;
CREATE TRIGGER trg_notif_prestamo_creado
  AFTER INSERT ON prestamos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notif_prestamo_creado();

-- ============================================================
-- TRIGGER: Notificar cuando se aprueba un préstamo
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_notif_prestamo_aceptado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notificaciones (usuario_id, tipo, titulo, descripcion)
  VALUES (NEW.usuario_id, 'prestamo_aceptado', 'Préstamo aprobado', 'Tu solicitud de préstamo ha sido aprobada');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_prestamo_aceptado ON prestamos;
CREATE TRIGGER trg_notif_prestamo_aceptado
  AFTER UPDATE OF estado ON prestamos
  FOR EACH ROW
  WHEN (NEW.estado = 'aceptado')
  EXECUTE FUNCTION public.fn_notif_prestamo_aceptado();

-- ============================================================
-- TRIGGER: Notificar cuando se rechaza un préstamo
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_notif_prestamo_rechazado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notificaciones (usuario_id, tipo, titulo, descripcion)
  VALUES (NEW.usuario_id, 'prestamo_rechazado', 'Préstamo rechazado', COALESCE(NEW.motivo_rechazo, 'Tu solicitud de préstamo ha sido rechazada'));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_prestamo_rechazado ON prestamos;
CREATE TRIGGER trg_notif_prestamo_rechazado
  AFTER UPDATE OF estado ON prestamos
  FOR EACH ROW
  WHEN (NEW.estado = 'rechazado')
  EXECUTE FUNCTION public.fn_notif_prestamo_rechazado();

-- ============================================================
-- TRIGGER: Notificar cuando se devuelve un equipo
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_notif_equipo_devuelto()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notificaciones (usuario_id, tipo, titulo, descripcion)
  VALUES (NEW.usuario_id, 'equipo_devuelto', 'Equipo devuelto', 'El equipo prestado ha sido devuelto correctamente');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_equipo_devuelto ON prestamos;
CREATE TRIGGER trg_notif_equipo_devuelto
  AFTER UPDATE OF estado ON prestamos
  FOR EACH ROW
  WHEN (NEW.estado = 'devuelto')
  EXECUTE FUNCTION public.fn_notif_equipo_devuelto();

-- ============================================================
-- TRIGGER: Notificar a admins cuando se agrega un equipo
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_notif_equipo_agregado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notificaciones (usuario_id, tipo, titulo, descripcion)
  SELECT u.id, 'equipo_agregado', 'Nuevo equipo agregado', 'Equipo #' || NEW.numero || CASE WHEN NEW.marca IS NOT NULL THEN ' - ' || NEW.marca ELSE '' END
  FROM usuarios u
  WHERE u.rol IN ('admin', 'funcionario');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_equipo_agregado ON equipos;
CREATE TRIGGER trg_notif_equipo_agregado
  AFTER INSERT ON equipos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notif_equipo_agregado();

-- ============================================================
-- Habilitar real-time para notificaciones
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;

-- ============================================================
-- Función RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.crear_notificaciones_admin(
  p_tipo TEXT,
  p_titulo TEXT,
  p_descripcion TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notificaciones (usuario_id, tipo, titulo, descripcion)
  SELECT u.id, p_tipo, p_titulo, p_descripcion
  FROM usuarios u
  WHERE u.rol IN ('admin', 'funcionario');
END;
$$;

REVOKE ALL ON FUNCTION public.crear_notificaciones_admin(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crear_notificaciones_admin(TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================
-- Verificación
-- ============================================================
SELECT tgname AS trigger_name, relname AS table_name
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE tgname LIKE 'trg_notif_%'
ORDER BY tgname;
