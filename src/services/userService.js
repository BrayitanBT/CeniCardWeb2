import { supabase } from '../supabaseClient'
import { formatearNombreCompleto } from './utils'

export async function getUsuarios() {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      *,
      fichas(codigo_ficha, nombre_programa)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error obteniendo usuarios:', error)
    return []
  }
  
  return data.map(user => ({
    ...user,
    nombre: formatearNombreCompleto(
      user.primer_nombre, 
      user.segundo_nombre, 
      user.primer_apellido, 
      user.segundo_apellido
    )
  }))
}

export async function getUsuarioById(id) {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      *,
      fichas(codigo_ficha, nombre_programa)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error obteniendo usuario:', error)
    return null
  }
  
  return {
    ...data,
    nombre: formatearNombreCompleto(
      data.primer_nombre, 
      data.segundo_nombre, 
      data.primer_apellido, 
      data.segundo_apellido
    )
  }
}

export async function createUsuario(usuarioData) {
  try {
    const { data: existingCC } = await supabase
      .from('usuarios')
      .select('numero_cc')
      .eq('numero_cc', usuarioData.numero_cc)
      .single()

    if (existingCC) {
      throw new Error('Ya existe un usuario con este número de documento')
    }

    const { data: existingEmail } = await supabase
      .from('usuarios')
      .select('correo')
      .eq('correo', usuarioData.correo)
      .single()

    if (existingEmail) {
      throw new Error('Ya existe un usuario con este correo electrónico')
    }

    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: usuarioData.correo,
      password: usuarioData.contrasena,
      options: {
        data: {
          primer_nombre: usuarioData.primer_nombre,
          primer_apellido: usuarioData.primer_apellido,
          rol: usuarioData.rol || 'aprendiz'
        }
      }
    })

    if (authError) throw authError

    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        id: authUser.user.id,
        primer_nombre: usuarioData.primer_nombre,
        segundo_nombre: usuarioData.segundo_nombre || null,
        primer_apellido: usuarioData.primer_apellido,
        segundo_apellido: usuarioData.segundo_apellido || null,
        numero_cc: usuarioData.numero_cc,
        correo: usuarioData.correo,
        celular: usuarioData.celular || null,
        rol: usuarioData.rol || 'aprendiz',
        ficha_id: usuarioData.ficha_id || null,
        centro_formacion: usuarioData.centro_formacion || null,
        regional: usuarioData.regional || null,
        rh: usuarioData.rh || null,
        fecha_vencimiento_carne: usuarioData.fecha_vencimiento_carne || null,
        foto_url: usuarioData.foto_url || null,
        estado_carne: usuarioData.estado_carne || 'activo',
        eps: usuarioData.eps || null,
        condicion_medica: usuarioData.condicion_medica || null,
        contacto_emergencia_nombre: usuarioData.contacto_emergencia_nombre || null,
        contacto_emergencia_telefono: usuarioData.contacto_emergencia_telefono || null,
        perfil_profesional: usuarioData.perfil_profesional || null,
        carnet_trasero_completado: usuarioData.carnet_trasero_completado || false
      }])
      .select()

    if (error) {
      console.error('Error creando perfil:', error)
      throw error
    }

    return data[0]
  } catch (error) {
    console.error('Error creando usuario:', error)
    throw error
  }
}

export async function updateUsuario(id, updates) {
  const allowedUpdates = {}
  const camposPermitidos = [
    'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido',
    'celular', 'rol', 'ficha_id', 'centro_formacion', 'regional',
    'rh', 'fecha_vencimiento_carne', 'foto_url', 'estado_carne', 'eps',
    'condicion_medica', 'contacto_emergencia_nombre', 'contacto_emergencia_telefono',
    'perfil_profesional', 'carnet_trasero_completado', 'activo'
  ]
  
  Object.keys(updates).forEach(key => {
    if (camposPermitidos.includes(key)) {
      allowedUpdates[key] = updates[key]
    }
  })
  
  const { data, error } = await supabase
    .from('usuarios')
    .update(allowedUpdates)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error actualizando usuario:', error)
    throw error
  }
  return data[0]
}

export async function deleteUsuario(id) {
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error eliminando usuario:', error)
    throw error
  }
}

export async function getRolesDisponibles() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('rol')
    .not('rol', 'is', null)

  if (error) {
    console.error('Error obteniendo roles:', error)
    return []
  }

  const rolesUnicos = [...new Set(data.map(item => item.rol))].filter(Boolean)
  return rolesUnicos.sort()
}
