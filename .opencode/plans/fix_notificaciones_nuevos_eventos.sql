-- ============================================================
-- Agregar nuevos tipos al CHECK constraint
-- ============================================================
ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_tipo_check 
CHECK (tipo = ANY (ARRAY[
  'perfil_actualizado', 'mensaje_nuevo', 'carne_bloqueado', 'carne_activado',
  'prestamo_aceptado', 'prestamo_rechazado', 'prestamo_devolucion',
  'prestamo_creado', 'equipo_devuelto', 'equipo_agregado',
  'noticia_creada', 'usuario_creado',
  'carne_por_vencer', 'registro_exitoso', 'otro'
]));

-- ============================================================
-- TRIGGER: Notificar a admins cuando se crea una noticia
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_notif_noticia_creada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notificaciones (usuario_id, tipo, titulo, descripcion)
  SELECT u.id, 'noticia_creada', 'Nueva noticia publicada', NEW.titulo
  FROM usuarios u
  WHERE u.rol IN ('admin', 'funcionario');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_noticia_creada ON noticias;
CREATE TRIGGER trg_notif_noticia_creada
  AFTER INSERT ON noticias
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notif_noticia_creada();

-- ============================================================
-- TRIGGER: Notificar a admins cuando se crea un usuario
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_notif_usuario_creado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notificaciones (usuario_id, tipo, titulo, descripcion)
  SELECT u.id, 'usuario_creado', 'Nuevo usuario registrado',
    NEW.primer_nombre || ' ' || NEW.primer_apellido || ' (' || NEW.rol || ')'
  FROM usuarios u
  WHERE u.rol IN ('admin', 'funcionario');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notif_usuario_creado ON usuarios;
CREATE TRIGGER trg_notif_usuario_creado
  AFTER INSERT ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notif_usuario_creado();

-- ============================================================
-- Verificación
-- ============================================================
SELECT tgname AS trigger_name, relname AS table_name
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE tgname LIKE 'trg_notif_%'
ORDER BY tgname;
