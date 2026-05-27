-- ============================================================
-- RPC: Crear usuario desde el panel admin (bypass auto-login)
-- ============================================================
-- Esta función usa SECURITY DEFINER para ejecutarse con permisos
-- de administrador, evitando que signUp() auto-loguee al admin
-- como el nuevo usuario.
-- ============================================================

-- Insertar directamente en auth.users (compatible con Supabase)
-- La función auth.create_user() no existe en todos los proyectos
CREATE OR REPLACE FUNCTION public.admin_crear_usuario(
  p_email TEXT,
  p_password TEXT,
  p_datos JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, confirmation_sent_at,
    raw_user_meta_data,
    created_at, updated_at,
    aud, role
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(), NOW(),
    p_datos,
    NOW(), NOW(),
    'authenticated',
    'authenticated'
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id, 'email', p_email),
    'email',
    NOW(), NOW(), NOW()
  );

  RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_crear_usuario(TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_crear_usuario(TEXT, TEXT, JSONB) TO authenticated;

-- ============================================================
-- Verificación
-- ============================================================
SELECT proname, prosecdef
FROM pg_proc
WHERE proname = 'admin_crear_usuario';
