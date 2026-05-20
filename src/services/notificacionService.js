import { supabase } from '../supabaseClient'

export async function getNotificaciones(usuarioId) {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error obteniendo notificaciones:', error)
    return []
  }
  return data
}

export async function getNotificacionesNoLeidas(usuarioId) {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('leida', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error obteniendo notificaciones no leídas:', error)
    return []
  }
  return data
}

export async function createNotificacion(notificacion) {
  const { data, error } = await supabase
    .from('notificaciones')
    .insert([{
      usuario_id: notificacion.usuario_id,
      tipo: notificacion.tipo,
      titulo: notificacion.titulo,
      descripcion: notificacion.descripcion || null,
      icono: notificacion.icono || null
    }])
    .select()

  if (error) {
    console.error('Error creando notificación:', error)
    throw error
  }
  return data[0]
}

export async function marcarNotificacionLeida(id) {
  const { data, error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error marcando notificación como leída:', error)
    throw error
  }
  return data[0]
}

export async function marcarTodasNotificacionesLeidas(usuarioId) {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('usuario_id', usuarioId)
    .eq('leida', false)

  if (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error)
    throw error
  }
}

export async function deleteNotificacion(id) {
  const { error } = await supabase
    .from('notificaciones')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error eliminando notificación:', error)
    throw error
  }
}
