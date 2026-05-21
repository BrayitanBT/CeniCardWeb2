-- ============================================================
-- PASO 1: FUNCIÓN HELPER is_admin_or_funcionario()
-- ============================================================
-- Copia y pega TODO este bloque en Supabase → SQL Editor → Run
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin_or_funcionario()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
      AND rol IN ('admin', 'funcionario')
  );
$$;
