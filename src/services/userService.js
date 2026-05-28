import { supabase } from '../supabaseClient'
import { logError } from './errorService'
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
    logError(error, 'userService.getUsuarios')
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
    logError(error, 'userService.getUsuarioById')
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
      .rpc('get_user_by_documento', { p_documento: usuarioData.numero_cc })
      .maybeSingle()

    if (existingCC) {
      throw new Error('Ya existe un usuario con este número de documento')
    }

    const { data: existingEmail } = await supabase
      .from('usuarios')
      .select('correo')
      .eq('correo', usuarioData.correo)
      .maybeSingle()

    if (existingEmail) {
      throw new Error('Ya existe un usuario con este correo electrónico')
    }

    const metadata = {
      numero_cc: usuarioData.numero_cc,
      primer_nombre: usuarioData.primer_nombre,
      segundo_nombre: usuarioData.segundo_nombre || '',
      primer_apellido: usuarioData.primer_apellido,
      segundo_apellido: usuarioData.segundo_apellido || '',
      celular: usuarioData.celular || '',
      rol: usuarioData.rol || 'aprendiz',
      ficha_id: usuarioData.ficha_id ? String(usuarioData.ficha_id) : '',
      centro_formacion: usuarioData.centro_formacion || '',
      rh: usuarioData.rh || ''
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_crear_usuario', {
      p_email: usuarioData.correo,
      p_password: usuarioData.contrasena,
      p_datos: metadata
    })

    if (rpcError) {
      if (rpcError.message?.includes('already exists') || rpcError.code === '23505') {
        throw new Error('Ya existe un usuario con este correo electrónico')
      }
      throw rpcError
    }

    const authUserId = rpcData

    const { data: updated } = await supabase
      .from('usuarios')
      .update({
        numero_cc: usuarioData.numero_cc,
        celular: usuarioData.celular || null,
        ficha_id: usuarioData.ficha_id || null,
        centro_formacion: usuarioData.centro_formacion || null,
        regional: usuarioData.regional || null,
        rh: usuarioData.rh || null,
        fecha_vencimiento_carne: usuarioData.fecha_vencimiento_carne || null,
        foto_url: usuarioData.foto_url || null,
        eps: usuarioData.eps || null,
        condicion_medica: usuarioData.condicion_medica || null,
        contacto_emergencia_nombre: usuarioData.contacto_emergencia_nombre || null,
        contacto_emergencia_telefono: usuarioData.contacto_emergencia_telefono || null,
        perfil_profesional: usuarioData.perfil_profesional || null,
        carnet_trasero_completado: usuarioData.carnet_trasero_completado || false
      })
      .eq('id', authUserId)
      .select()

    if (!updated?.length) {
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert([{
          id: authUserId,
          numero_cc: usuarioData.numero_cc,
          primer_nombre: usuarioData.primer_nombre,
          segundo_nombre: usuarioData.segundo_nombre || null,
          primer_apellido: usuarioData.primer_apellido,
          segundo_apellido: usuarioData.segundo_apellido || null,
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

      if (insertError) {
        if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
          return { id: authUserId }
        }
        throw insertError
      }
    }

    return { id: authUserId }
  } catch (error) {
    logError(error, 'userService.createUsuario')
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
      let val = updates[key]
      if (val === '' && (key === 'fecha_vencimiento_carne' || key === 'ficha_id')) {
        val = null
      }
      allowedUpdates[key] = val
    }
  })
  
  const { data, error } = await supabase
    .from('usuarios')
    .update(allowedUpdates)
    .eq('id', id)
    .select()

  if (error) {
    logError(error, 'userService.updateUsuario')
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
    logError(error, 'userService.deleteUsuario')
    throw error
  }
}

export async function getRolesDisponibles() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('rol')
    .not('rol', 'is', null)

  if (error) {
    logError(error, 'userService.getRolesDisponibles')
    return []
  }

  const rolesUnicos = [...new Set(data.map(item => item.rol))].filter(Boolean)
  return rolesUnicos.sort()
}

export async function getAllUsuariosConFichas() {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      *,
      fichas(codigo_ficha, nombre_programa)
    `)
    .order('primer_apellido', { ascending: true })

  if (error) {
    logError(error, 'userService.getAllUsuariosConFichas')
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
