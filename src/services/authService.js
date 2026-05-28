import { supabase } from '../supabaseClient'
import { logError } from './errorService'
import { formatearNombreCompleto } from './utils'

const ROLES_PERMITIDOS = ['funcionario', 'admin', 'instructor', 'contratista']

export async function loginConDocumento(documento, contrasena) {
  try {
    if (!documento || !documento.trim()) {
      return { data: null, error: new Error('Por favor, ingresa tu número de documento.') }
    }
    
    if (!contrasena || !contrasena.trim()) {
      return { data: null, error: new Error('Por favor, ingresa tu contraseña.') }
    }

    const { data: usuario, error: buscarError } = await supabase
      .rpc('get_user_by_documento', { p_documento: documento.trim() })
      .maybeSingle()

    if (buscarError) {
      logError(buscarError, 'authService.loginConDocumento')
      return { 
        data: null, 
        error: new Error('Error al verificar el documento. Intenta de nuevo.') 
      }
    }

    if (!usuario) {
      return { 
        data: null, 
        error: new Error('El número de documento no está registrado en el sistema.') 
      }
    }

    if (usuario.activo === false) {
      return { 
        data: null, 
        error: new Error('Tu cuenta está desactivada. Contacta al administrador.') 
      }
    }

    if (!ROLES_PERMITIDOS.includes(usuario.rol)) {
      return { 
        data: null, 
        error: new Error('Acceso denegado. Los aprendices no tienen acceso al sistema.') 
      }
    }

    if (!usuario.correo) {
      return { 
        data: null, 
        error: new Error('Tu cuenta no tiene un correo electrónico asociado. Contacta al administrador.') 
      }
    }

    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: usuario.correo,
      password: contrasena,
    })

    if (loginError) {
      logError(loginError, 'authService.loginConDocumento')
      
      if (loginError.message.includes('Invalid login credentials')) {
        return { 
          data: null, 
          error: new Error('Contraseña incorrecta. Verifica e intenta de nuevo.') 
        }
      }
      
      if (loginError.message.includes('Email not confirmed')) {
        return { 
          data: null, 
          error: new Error('Por favor, confirma tu correo electrónico antes de iniciar sesión.') 
        }
      }
      
      return { 
        data: null, 
        error: new Error('Error al iniciar sesión. Verifica tus credenciales.') 
      }
    }

    return { 
      data: {
        session: authData.session,
        user: authData.user,
        perfil: {
          nombre_completo: `${usuario.primer_nombre} ${usuario.primer_apellido}`,
          rol: usuario.rol,
          estado_carne: usuario.estado_carne
        }
      }, 
      error: null 
    }
    
  } catch (error) {
    logError(error, 'authService.loginConDocumento')
    return { 
      data: null, 
      error: new Error('Ocurrió un error inesperado. Por favor, intenta de nuevo más tarde.') 
    }
  }
}

export async function registrarUsuario(userData) {
  try {
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('numero_cc')
      .eq('numero_cc', userData.numero_cc)
      .single()

    if (existingUser) {
      throw new Error('Ya existe un usuario con este documento')
    }

    const { data: existingEmail } = await supabase
      .from('usuarios')
      .select('correo')
      .eq('correo', userData.correo)
      .single()

    if (existingEmail) {
      throw new Error('Ya existe un usuario con este correo')
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.correo,
      password: userData.contrasena,
      options: {
        data: {
          primer_nombre: userData.primer_nombre,
          primer_apellido: userData.primer_apellido,
          rol: userData.rol || 'aprendiz'
        }
      }
    })

    if (authError) throw authError

    const { data: profileData, error: profileError } = await supabase
      .from('usuarios')
      .insert([{
        id: authData.user.id,
        primer_nombre: userData.primer_nombre,
        segundo_nombre: userData.segundo_nombre || null,
        primer_apellido: userData.primer_apellido,
        segundo_apellido: userData.segundo_apellido || null,
        numero_cc: userData.numero_cc,
        correo: userData.correo,
        celular: userData.celular || null,
        rol: userData.rol || 'aprendiz',
        ficha_id: userData.ficha_id || null,
        centro_formacion: userData.centro_formacion || null,
        regional: userData.regional || null,
        estado_carne: 'activo'
      }])
      .select()

    if (profileError) {
      logError(profileError, 'authService.registrarUsuario')
      throw profileError
    }

    return { user: authData.user, profile: profileData[0] }
  } catch (error) {
    logError(error, 'authService.registrarUsuario')
    throw error
  }
}

export async function obtenerSesionActual() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session) return null
    return data.session
  } catch (error) {
    logError(error, 'authService.obtenerSesionActual')
    return null
  }
}

export async function cerrarSesion() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    logError(error, 'authService.cerrarSesion')
    throw error
  }
}

export async function obtenerPerfilUsuario(userId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      *,
      fichas(codigo_ficha, nombre_programa)
    `)
    .eq('id', userId)
    .single()

  if (error) {
    logError(error, 'authService.obtenerPerfilUsuario')
    return null
  }
  
  return {
    ...data,
    nombre_completo: formatearNombreCompleto(
      data.primer_nombre,
      data.segundo_nombre,
      data.primer_apellido,
      data.segundo_apellido
    )
  }
}

export async function actualizarPerfilUsuario(userId, updates) {
  const allowedUpdates = {}
  const camposPermitidos = [
    'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido',
    'celular', 'foto_url', 'rh', 'eps', 'condicion_medica',
    'contacto_emergencia_nombre', 'contacto_emergencia_telefono'
  ]
  
  Object.keys(updates).forEach(key => {
    if (camposPermitidos.includes(key)) {
      allowedUpdates[key] = updates[key]
    }
  })
  
  const { data, error } = await supabase
    .from('usuarios')
    .update(allowedUpdates)
    .eq('id', userId)
    .select()

  if (error) {
    logError(error, 'authService.actualizarPerfilUsuario')
    throw error
  }
  return data[0]
}
