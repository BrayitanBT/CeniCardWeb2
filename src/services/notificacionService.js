import { supabase } from '../supabaseClient'
import { logError } from './errorService'

export async function getNotificaciones(usuarioId) {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false })

  if (error) {
    logError(error, 'notificacionService.getNotificaciones')
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
    logError(error, 'notificacionService.getNotificacionesNoLeidas')
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
    logError(error, 'notificacionService.createNotificacion')
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
    logError(error, 'notificacionService.marcarNotificacionLeida')
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
    logError(error, 'notificacionService.marcarTodasNotificacionesLeidas')
    throw error
  }
}

export async function deleteNotificacion(id) {
  const { error } = await supabase
    .from('notificaciones')
    .delete()
    .eq('id', id)

  if (error) {
    logError(error, 'notificacionService.deleteNotificacion')
    throw error
  }
}

export async function eliminarNotificacionesAntiguas(usuarioId) {
  const hace24h = new Date();
  hace24h.setHours(hace24h.getHours() - 24);

  const { data, error } = await supabase
    .from('notificaciones')
    .delete()
    .eq('usuario_id', usuarioId)
    .lt('created_at', hace24h.toISOString())
    .select('id')

  if (error) {
    logError(error, 'notificacionService.eliminarNotificacionesAntiguas')
    throw error
  }
  return data?.length || 0
}
