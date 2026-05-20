import { supabase } from '../supabaseClient'
import { formatearNombreCompleto } from './utils'

export async function getHistorial(filtros = {}) {
  let query = supabase
    .from('prestamos')
    .select(`
      *,
      usuarios:usuario_id(
        id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, numero_cc
      ),
      equipos:equipo_id(
        id, numero, marca, modelo, serial,
        categorias_equipos(nombre)
      ),
      gestionado_por:gestionado_por(
        id, primer_nombre, primer_apellido
      )
    `)
    .in('estado', ['aceptado', 'rechazado', 'devuelto'])
  
  if (filtros.usuario_id) {
    query = query.eq('usuario_id', filtros.usuario_id)
  }
  if (filtros.estado) {
    query = query.eq('estado', filtros.estado)
  }
  if (filtros.fecha_desde) {
    query = query.gte('fecha_solicitud', filtros.fecha_desde)
  }
  if (filtros.fecha_hasta) {
    query = query.lte('fecha_solicitud', filtros.fecha_hasta)
  }
  
  const { data, error } = await query.order('updated_at', { ascending: false })

  if (error) {
    console.error('Error obteniendo historial:', error)
    return []
  }
  
  return data.map(item => ({
    ...item,
    usuario_nombre: item.usuarios ? formatearNombreCompleto(
      item.usuarios.primer_nombre,
      item.usuarios.segundo_nombre,
      item.usuarios.primer_apellido,
      item.usuarios.segundo_apellido
    ) : 'N/A',
    usuario_documento: item.usuarios?.numero_cc || 'N/A',
    equipo_nombre: item.equipos ? `${item.equipos.numero} - ${item.equipos.marca || ''} ${item.equipos.modelo || ''}`.trim() : 'N/A',
    equipo_categoria: item.equipos?.categorias_equipos?.nombre || 'N/A',
    gestionado_por_nombre: item.gestionado_por ? `${item.gestionado_por.primer_nombre} ${item.gestionado_por.primer_apellido}` : 'Sistema'
  }))
}
