import { supabase } from '../supabaseClient'
import { formatearNombreCompleto } from './utils'

export async function getPrestamos() {
  const { data, error } = await supabase
    .from('prestamos')
    .select(`
      *,
      usuarios:usuario_id(
        id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, numero_cc, correo
      ),
      equipos:equipo_id(
        id, numero, marca, modelo, serial, estado,
        categorias_equipos(id, nombre, icono)
      )
    `)
    .order('fecha_solicitud', { ascending: false })

  if (error) {
    console.error('Error obteniendo préstamos:', error)
    return []
  }
  
  return data.map(prestamo => ({
    ...prestamo,
    usuario_nombre: prestamo.usuarios ? formatearNombreCompleto(
      prestamo.usuarios.primer_nombre,
      prestamo.usuarios.segundo_nombre,
      prestamo.usuarios.primer_apellido,
      prestamo.usuarios.segundo_apellido
    ) : 'N/A',
    usuario_documento: prestamo.usuarios?.numero_cc || 'N/A',
    equipo_info: prestamo.equipos ? `${prestamo.equipos.numero} - ${prestamo.equipos.marca || ''} ${prestamo.equipos.modelo || ''}`.trim() : 'N/A'
  }))
}

export async function aprobarPrestamo(id, gestionado_por_id) {
  try {
    const { error: getError } = await supabase
      .from('prestamos')
      .select('equipo_id, usuario_id')
      .eq('id', id)
      .single()
    
    if (getError) {
      console.error('Error obteniendo préstamo:', getError)
      throw getError
    }
    
    const { error: updateError } = await supabase
      .from('prestamos')
      .update({ 
        estado: 'aceptado', 
        gestionado_por: gestionado_por_id
      })
      .eq('id', id)
    
    if (updateError) {
      console.error('Error actualizando préstamo:', updateError)
      throw updateError
    }
    
    return { success: true, message: 'Préstamo aprobado correctamente' }
    
  } catch (error) {
    console.error('Error aprobando préstamo:', error)
    throw error
  }
}

export async function rechazarPrestamo(id, motivo_rechazo, gestionado_por_id) {
  try {
    const { error: getError } = await supabase
      .from('prestamos')
      .select('equipo_id, usuario_id')
      .eq('id', id)
      .single()
    
    if (getError) {
      console.error('Error obteniendo préstamo:', getError)
      throw getError
    }

    const { error: updateError } = await supabase
      .from('prestamos')
      .update({ 
        estado: 'rechazado',
        motivo_rechazo: motivo_rechazo,
        gestionado_por: gestionado_por_id
      })
      .eq('id', id)
    
    if (updateError) {
      console.error('Error actualizando préstamo:', updateError)
      throw updateError
    }
    
    return { success: true, message: 'Préstamo rechazado correctamente' }
    
  } catch (error) {
    console.error('Error rechazando préstamo:', error)
    throw error
  }
}

export async function devolverEquipo(id, gestionado_por_id) {
  try {
    const { error: getError } = await supabase
      .from('prestamos')
      .select('equipo_id')
      .eq('id', id)
      .single()
    
    if (getError) throw getError
    
    const { error: updateError } = await supabase
      .from('prestamos')
      .update({ 
        estado: 'devuelto', 
        gestionado_por: gestionado_por_id
      })
      .eq('id', id)
    
    if (updateError) throw updateError
      
    return { success: true }
    
  } catch (error) {
    console.error('Error devolviendo equipo:', error)
    throw error
  }
}

export async function crearSolicitudPrestamo(usuarioId, equipoId, fechaDevolucionEsperada = null, observaciones = null) {
  try {
    const { data: equipo, error: equipoError } = await supabase
      .from('equipos')
      .select('estado, activo')
      .eq('id', equipoId)
      .single()
    
    if (equipoError) throw equipoError
    
    if (!equipo.activo || equipo.estado !== 'disponible') {
      throw new Error('El equipo no está disponible para préstamo')
    }
    
    const { data, error } = await supabase
      .from('prestamos')
      .insert([{
        usuario_id: usuarioId,
        equipo_id: equipoId,
        estado: 'pendiente',
        fecha_devolucion_esperada: fechaDevolucionEsperada,
        observaciones: observaciones
      }])
      .select()
    
    if (error) throw error
    
    await supabase
      .from('equipos')
      .update({ estado: 'ocupado' })
      .eq('id', equipoId)
    
    return data[0]
  } catch (error) {
    console.error('Error creando solicitud de préstamo:', error)
    throw error
  }
}

export async function getSolicitudesPorUsuario(usuarioId) {
  const { data, error } = await supabase
    .from('prestamos')
    .select(`
      *,
      equipos:equipo_id(
        id, numero, marca, modelo, serial,
        categorias_equipos(nombre, icono)
      )
    `)
    .eq('usuario_id', usuarioId)
    .order('fecha_solicitud', { ascending: false })

  if (error) {
    console.error('Error obteniendo solicitudes del usuario:', error)
    return []
  }
  
  return data.map(solicitud => ({
    ...solicitud,
    equipo_info: solicitud.equipos ? `${solicitud.equipos.numero} - ${solicitud.equipos.marca || ''} ${solicitud.equipos.modelo || ''}`.trim() : 'N/A'
  }))
}
