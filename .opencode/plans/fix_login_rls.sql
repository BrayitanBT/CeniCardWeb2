-- ============================================================
-- FUNCIÓN: Obtener usuario por documento (bypass RLS seguro)
-- ============================================================
-- Esta función usa SECURITY DEFINER para ejecutarse con permisos
-- del creador (postgres), evitando la recursión infinita de RLS.
-- Se usa durante el login cuando el usuario aún no está autenticado.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_by_documento(p_documento TEXT)
RETURNS TABLE (
  correo            TEXT,
  rol               TEXT,
  primer_nombre     TEXT,
  primer_apellido   TEXT,
  estado_carne      TEXT,
  activo            BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.correo,
    u.rol,
    u.primer_nombre,
    u.primer_apellido,
    u.estado_carne,
    u.activo
  FROM usuarios u
  WHERE u.numero_cc = p_documento
  LIMIT 1;
END;
$$;

-- Revocar acceso público, solo roles autenticados pueden ejecutar
REVOKE ALL ON FUNCTION public.get_user_by_documento(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_by_documento(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_documento(TEXT) TO anon;

-- ============================================================
-- Verificar que la función existe
-- ============================================================
SELECT proname, prosecdef, proargtypes
FROM pg_proc
WHERE proname = 'get_user_by_documento';
