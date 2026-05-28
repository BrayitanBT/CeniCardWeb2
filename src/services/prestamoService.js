import { supabase } from '../supabaseClient'
import { logError } from './errorService'
import { formatearNombreCompleto } from './utils'
import { createNotificacion } from './notificacionService'

async function notificarAdmins(tipo, titulo, descripcion) {
  try {
    await supabase.rpc('crear_notificaciones_admin', {
      p_tipo: tipo,
      p_titulo: titulo,
      p_descripcion: descripcion || null
    })
  } catch (e) {
    logError(e, 'prestamoService.notificarAdmins')
  }
}

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
    logError(error, 'prestamoService.getPrestamos')
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
    const { data: prestamo, error: getError } = await supabase
      .from('prestamos')
      .select('equipo_id, usuario_id')
      .eq('id', id)
      .single()

    if (getError) {
      logError(getError, 'prestamoService.aprobarPrestamo')
      throw getError
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('estado_carne')
      .eq('id', prestamo.usuario_id)
      .single()

    const estadoActual = usuario?.estado_carne || 'activo'

    if (estadoActual === 'vencido') {
      throw new Error('No se puede aceptar: el carné del usuario está vencido. Debe renovarlo primero.')
    }
    if (estadoActual === 'bloqueado') {
      throw new Error('No se puede aceptar: el carné del usuario está bloqueado. Contacta al área administrativa.')
    }
    if (estadoActual === 'prestamo') {
      throw new Error('No se puede aceptar: el usuario ya tiene un préstamo activo.')
    }

    const { error: updateError } = await supabase
      .from('prestamos')
      .update({
        estado: 'aceptado',
        gestionado_por: gestionado_por_id
      })
      .eq('id', id)

    if (updateError) {
      logError(updateError, 'prestamoService.aprobarPrestamo')
      throw updateError
    }

    try {
      await createNotificacion({
        usuario_id: prestamo.usuario_id,
        tipo: 'prestamo_aceptado',
        titulo: 'Préstamo aprobado',
        descripcion: 'Tu solicitud de préstamo ha sido aprobada'
      })
    } catch (e) {
      logError(e, 'prestamoService.aprobarPrestamo')
    }

    return { success: true, message: 'Préstamo aprobado correctamente' }

  } catch (error) {
    logError(error, 'prestamoService.aprobarPrestamo')
    throw error
  }
}

export async function rechazarPrestamo(id, motivo_rechazo, gestionado_por_id) {
  try {
    const { data: prestamo, error: getError } = await supabase
      .from('prestamos')
      .select('equipo_id, usuario_id')
      .eq('id', id)
      .single()
    
    if (getError) {
      logError(getError, 'prestamoService.rechazarPrestamo')
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
      logError(updateError, 'prestamoService.rechazarPrestamo')
      throw updateError
    }

    try {
      await createNotificacion({
        usuario_id: prestamo.usuario_id,
        tipo: 'prestamo_rechazado',
        titulo: 'Préstamo rechazado',
        descripcion: motivo_rechazo || 'Tu solicitud de préstamo ha sido rechazada'
      })
    } catch (e) {
      logError(e, 'prestamoService.rechazarPrestamo')
    }
    
    return { success: true, message: 'Préstamo rechazado correctamente' }
    
  } catch (error) {
    logError(error, 'prestamoService.rechazarPrestamo')
    throw error
  }
}

export async function devolverEquipo(id, gestionado_por_id) {
  try {
    const { data: prestamo, error: getError } = await supabase
      .from('prestamos')
      .select('equipo_id, usuario_id')
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

    try {
      await createNotificacion({
        usuario_id: prestamo.usuario_id,
        tipo: 'equipo_devuelto',
        titulo: 'Equipo devuelto',
        descripcion: 'El equipo prestado ha sido devuelto correctamente'
      })
    } catch (e) {
      logError(e, 'prestamoService.devolverEquipo')
    }

    return { success: true }

  } catch (error) {
    logError(error, 'prestamoService.devolverEquipo')
    throw error
  }
}

export async function crearSolicitudPrestamo(usuarioId, equipoId, fechaDevolucionEsperada = null, observaciones = null) {
  try {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('estado_carne')
      .eq('id', usuarioId)
      .single()

    const estadoCarne = usuario?.estado_carne || 'activo'

    if (estadoCarne === 'vencido') {
      throw new Error('No puedes solicitar préstamos: tu carné está vencido. Renúevalo primero.')
    }
    if (estadoCarne === 'bloqueado') {
      throw new Error('No puedes solicitar préstamos: tu carné está bloqueado.')
    }
    if (estadoCarne === 'prestamo') {
      throw new Error('No puedes solicitar préstamos: ya tienes un préstamo activo.')
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

    const prestamo = data[0]

    const { data: datosUsuario } = await supabase
      .from('usuarios')
      .select('primer_nombre, primer_apellido')
      .eq('id', usuarioId)
      .single()

    const nombreUsuario = datosUsuario
      ? `${datosUsuario.primer_nombre} ${datosUsuario.primer_apellido}`
      : 'Un usuario'

    await notificarAdmins(
      'prestamo_creado',
      'Nueva solicitud de préstamo',
      `${nombreUsuario} ha solicitado un préstamo`
    )

    try {
      await createNotificacion({
        usuario_id: usuarioId,
        tipo: 'prestamo_creado',
        titulo: 'Solicitud creada',
        descripcion: 'Tu solicitud de préstamo está pendiente de aprobación'
      })
    } catch (e) {
      logError(e, 'prestamoService.crearSolicitudPrestamo')
    }

    return prestamo
  } catch (error) {
    logError(error, 'prestamoService.crearSolicitudPrestamo')
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
    logError(error, 'prestamoService.getSolicitudesPorUsuario')
    return []
  }
  
  return data.map(solicitud => ({
    ...solicitud,
    equipo_info: solicitud.equipos ? `${solicitud.equipos.numero} - ${solicitud.equipos.marca || ''} ${solicitud.equipos.modelo || ''}`.trim() : 'N/A'
  }))
}
