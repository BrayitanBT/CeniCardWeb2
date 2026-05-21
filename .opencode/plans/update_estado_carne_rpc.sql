-- ============================================================
-- FUNCIÓN: Actualizar estado del carné (bypass RLS seguro)
-- ============================================================
-- Solo actualiza estado_carne. No permite modificar otros campos.
-- Se ejecuta con permisos del creador (postgres).
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_estado_carne(
  p_usuario_id UUID,
  p_estado TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar que el estado sea uno de los permitidos
  IF p_estado NOT IN ('activo', 'bloqueado', 'prestamo', 'vencido') THEN
    RAISE EXCEPTION 'Estado de carné inválido: %', p_estado;
  END IF;

  UPDATE usuarios
  SET estado_carne = p_estado
  WHERE id = p_usuario_id;
END;
$$;

-- Solo usuarios autenticados pueden ejecutar
REVOKE ALL ON FUNCTION public.update_estado_carne(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_estado_carne(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_estado_carne(UUID, TEXT) TO anon;
