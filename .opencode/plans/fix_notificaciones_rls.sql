-- ============================================================
-- FUNCIÓN: Crear notificaciones para administradores (bypass RLS)
-- ============================================================
-- Esta función usa SECURITY DEFINER para evitar RLS al consultar
-- usuarios con rol admin/funcionario e insertar notificaciones.
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
  SELECT
    u.id,
    p_tipo,
    p_titulo,
    p_descripcion
  FROM usuarios u
  WHERE u.rol IN ('admin', 'funcionario');
END;
$$;

REVOKE ALL ON FUNCTION public.crear_notificaciones_admin(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crear_notificaciones_admin(TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================
-- Verificar que la función existe
-- ============================================================
SELECT proname, prosecdef
FROM pg_proc
WHERE proname = 'crear_notificaciones_admin';
