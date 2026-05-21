-- ============================================================
-- ACTUALIZAR ESTADO DEL CARNÉ PARA TODOS LOS USUARIOS
-- ============================================================
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================
-- Reglas:
--   Si tiene préstamos activos (estado = 'aceptado') → 'bloqueado'
--   Si NO tiene préstamos activos                  → 'activo'
--   Si está 'vencido'                               → se mantiene 'vencido'
-- ============================================================

-- 1. Usuarios CON préstamos activos → bloqueado
UPDATE usuarios
SET estado_carne = 'bloqueado'
WHERE id IN (
  SELECT DISTINCT usuario_id
  FROM prestamos
  WHERE estado = 'aceptado'
)
AND estado_carne NOT IN ('vencido', 'bloqueado');

-- 2. Usuarios SIN préstamos activos → activo
UPDATE usuarios
SET estado_carne = 'activo'
WHERE id NOT IN (
  SELECT DISTINCT usuario_id
  FROM prestamos
  WHERE estado = 'aceptado'
)
AND estado_carne IN ('bloqueado', 'prestamo');

-- 3. VERIFICACIÓN: mostrar estado de todos los usuarios
SELECT
  u.id,
  u.primer_nombre || ' ' || u.primer_apellido AS nombre,
  u.rol,
  u.estado_carne,
  COUNT(p.id) FILTER (WHERE p.estado = 'aceptado') AS prestamos_activos,
  COUNT(p.id) FILTER (WHERE p.estado = 'pendiente') AS prestamos_pendientes,
  COUNT(p.id) FILTER (WHERE p.estado = 'devuelto') AS prestamos_devueltos,
  COUNT(p.id) FILTER (WHERE p.estado = 'rechazado') AS prestamos_rechazados
FROM usuarios u
LEFT JOIN prestamos p ON p.usuario_id = u.id
GROUP BY u.id, u.primer_nombre, u.primer_apellido, u.rol, u.estado_carne
ORDER BY u.primer_nombre, u.primer_apellido;
