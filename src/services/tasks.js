import { supabase } from '../supabaseClient'

// ============ HELPERS ============
const formatearNombreCompleto = (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido) => {
  const segundoNombre = segundo_nombre ? ` ${segundo_nombre}` : ''
  const segundoApellido = segundo_apellido ? ` ${segundo_apellido}` : ''
  return `${primer_nombre}${segundoNombre} ${primer_apellido}${segundoApellido}`.trim()
}

// ============ USUARIOS ============
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
    // Verificar si el documento ya existe
    const { data: existingCC } = await supabase
      .from('usuarios')
      .select('numero_cc')
      .eq('numero_cc', usuarioData.numero_cc)
      .single()

    if (existingCC) {
      throw new Error('Ya existe un usuario con este número de documento')
    }

    // Verificar si el correo ya existe
    const { data: existingEmail } = await supabase
      .from('usuarios')
      .select('correo')
      .eq('correo', usuarioData.correo)
      .single()

    if (existingEmail) {
      throw new Error('Ya existe un usuario con este correo electrónico')
    }

    // Crear usuario en auth.users
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

    // Crear perfil en public.usuarios
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

// ============ PRÉSTAMOS ============

// Función para obtener préstamos (solo lectura - normalmente permitido)
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

// Función para aprobar préstamo (sin triggers de notificaciones)
export async function aprobarPrestamo(id, gestionado_por_id) {
  try {
    // Usar una transacción para asegurar consistencia
    const { data: prestamo, error: getError } = await supabase
      .from('prestamos')
      .select('equipo_id, usuario_id')
      .eq('id', id)
      .single()
    
    if (getError) {
      console.error('Error obteniendo préstamo:', getError)
      throw getError
    }
    
    // Actualizar el préstamo
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

// Función para rechazar préstamo
export async function rechazarPrestamo(id, motivo_rechazo, gestionado_por_id) {
  try {
    // Obtener información del préstamo
    const { data: prestamo, error: getError } = await supabase
      .from('prestamos')
      .select('equipo_id, usuario_id')
      .eq('id', id)
      .single()
    
    if (getError) {
      console.error('Error obteniendo préstamo:', getError)
      throw getError
    }

    // Actualizar el préstamo como rechazado
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

// Función para devolver equipo
export async function devolverEquipo(id, gestionado_por_id) {
  try {
    // 1. Obtener el equipo_id
    const { data: prestamo, error: getError } = await supabase
      .from('prestamos')
      .select('equipo_id')
      .eq('id', id)
      .single()
    
    if (getError) throw getError
    
    // 2. Actualizar el préstamo como devuelto
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

// ============ EQUIPOS ============
export async function getEquipos() {
  const { data, error } = await supabase
    .from('equipos')
    .select(`
      *,
      categorias_equipos(id, nombre, icono, descripcion)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error obteniendo equipos:', error)
    return []
  }
  return data
}

export async function getEquiposByCategoria(categoriaId) {
  const { data, error } = await supabase
    .from('equipos')
    .select(`
      *,
      categorias_equipos(nombre, icono)
    `)
    .eq('categoria_id', categoriaId)
    .eq('activo', true)
    .order('numero', { ascending: true })

  if (error) {
    console.error('Error obteniendo equipos por categoría:', error)
    return []
  }
  return data
}

export async function getEquiposDisponibles() {
  const { data, error } = await supabase
    .from('equipos')
    .select(`
      *,
      categorias_equipos(nombre, icono)
    `)
    .eq('estado', 'disponible')
    .eq('activo', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error obteniendo equipos disponibles:', error)
    return []
  }
  return data
}

export async function getEquipoById(id) {
  const { data, error } = await supabase
    .from('equipos')
    .select(`
      *,
      categorias_equipos(id, nombre, icono, descripcion)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error obteniendo equipo:', error)
    return null
  }
  return data
}

export async function createEquipo(equipo) {
  const { data, error } = await supabase
    .from('equipos')
    .insert([{
      numero: equipo.numero,
      categoria_id: equipo.categoria_id,
      marca: equipo.marca || null,
      modelo: equipo.modelo || null,
      serial: equipo.serial || null,
      descripcion: equipo.descripcion || null,
      estado: equipo.estado || 'disponible',
      imagen_url: equipo.imagen_url || null,
      activo: equipo.activo !== undefined ? equipo.activo : true
    }])
    .select()

  if (error) {
    console.error('Error creando equipo:', error)
    throw error
  }
  return data[0]
}

export async function updateEquipo(id, updates) {
  const allowedUpdates = {}
  const camposPermitidos = ['numero', 'categoria_id', 'marca', 'modelo', 'serial', 'descripcion', 'estado', 'imagen_url', 'activo']
  
  Object.keys(updates).forEach(key => {
    if (camposPermitidos.includes(key)) {
      allowedUpdates[key] = updates[key]
    }
  })
  
  const { data, error } = await supabase
    .from('equipos')
    .update(allowedUpdates)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error actualizando equipo:', error)
    throw error
  }
  return data[0]
}

export async function deleteEquipo(id) {
  // Verificar si el equipo tiene préstamos activos
  const { data: prestamosActivos } = await supabase
    .from('prestamos')
    .select('id')
    .eq('equipo_id', id)
    .in('estado', ['pendiente', 'aceptado'])
  
  if (prestamosActivos && prestamosActivos.length > 0) {
    throw new Error('No se puede eliminar el equipo porque tiene préstamos activos o pendientes')
  }
  
  const { error } = await supabase
    .from('equipos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error eliminando equipo:', error)
    throw error
  }
}

// ============ CATEGORÍAS DE EQUIPOS ============
export async function getCategoriasEquipos() {
  const { data, error } = await supabase
    .from('categorias_equipos')
    .select('*')
    .eq('activa', true)
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error obteniendo categorías:', error)
    return []
  }
  return data
}

export async function getCategoriaById(id) {
  const { data, error } = await supabase
    .from('categorias_equipos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error obteniendo categoría:', error)
    return null
  }
  return data
}

export async function createCategoria(categoria) {
  const { data, error } = await supabase
    .from('categorias_equipos')
    .insert([{
      nombre: categoria.nombre,
      icono: categoria.icono || null,
      descripcion: categoria.descripcion || null,
      activa: categoria.activa !== undefined ? categoria.activa : true
    }])
    .select()

  if (error) {
    console.error('Error creando categoría:', error)
    throw error
  }
  return data[0]
}

export async function updateCategoria(id, updates) {
  const allowedUpdates = {}
  const camposPermitidos = ['nombre', 'icono', 'descripcion', 'activa']
  
  Object.keys(updates).forEach(key => {
    if (camposPermitidos.includes(key)) {
      allowedUpdates[key] = updates[key]
    }
  })
  
  const { data, error } = await supabase
    .from('categorias_equipos')
    .update(allowedUpdates)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error actualizando categoría:', error)
    throw error
  }
  return data[0]
}

export async function deleteCategoria(id) {
  // Verificar si hay equipos en esta categoría
  const { data: equipos } = await supabase
    .from('equipos')
    .select('id')
    .eq('categoria_id', id)
    .limit(1)
  
  if (equipos && equipos.length > 0) {
    throw new Error('No se puede eliminar la categoría porque tiene equipos asociados')
  }
  
  const { error } = await supabase
    .from('categorias_equipos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error eliminando categoría:', error)
    throw error
  }
}

// ============ NOTICIAS ============
export async function getNoticias() {
  const { data, error } = await supabase
    .from('noticias')
    .select(`
      *,
      creado_por:creado_por(id, primer_nombre, primer_apellido)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error obteniendo noticias:', error)
    return []
  }
  
  return data.map(noticia => ({
    ...noticia,
    autor_nombre: noticia.creado_por ? `${noticia.creado_por.primer_nombre} ${noticia.creado_por.primer_apellido}` : 'Sistema'
  }))
}

export async function getNoticiasPublicadas() {
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .eq('publicado', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error obteniendo noticias publicadas:', error)
    return []
  }
  return data
}

export async function getNoticiaById(id) {
  const { data, error } = await supabase
    .from('noticias')
    .select(`
      *,
      creado_por:creado_por(id, primer_nombre, primer_apellido, segundo_nombre, segundo_apellido)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error obteniendo noticia:', error)
    return null
  }
  
  return {
    ...data,
    autor_nombre: data.creado_por ? formatearNombreCompleto(
      data.creado_por.primer_nombre,
      data.creado_por.segundo_nombre,
      data.creado_por.primer_apellido,
      data.creado_por.segundo_apellido
    ) : 'Sistema'
  }
}

export async function createNoticia(noticia) {
  const { data, error } = await supabase
    .from('noticias')
    .insert([{
      titulo: noticia.titulo,
      descripcion: noticia.descripcion,
      imagen_url: noticia.imagen_url || null,
      publicado: noticia.publicado !== undefined ? noticia.publicado : true,
      creado_por: noticia.creado_por || null
    }])
    .select()

  if (error) {
    console.error('Error creando noticia:', error)
    throw error
  }
  return data[0]
}

export async function updateNoticia(id, updates) {
  const allowedUpdates = {}
  const camposPermitidos = ['titulo', 'descripcion', 'imagen_url', 'publicado']
  
  Object.keys(updates).forEach(key => {
    if (camposPermitidos.includes(key)) {
      allowedUpdates[key] = updates[key]
    }
  })
  
  const { data, error } = await supabase
    .from('noticias')
    .update(allowedUpdates)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error actualizando noticia:', error)
    throw error
  }
  return data[0]
}

export async function deleteNoticia(id) {
  const { error } = await supabase
    .from('noticias')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error eliminando noticia:', error)
    throw error
  }
}

// ============ FICHAS ============
export async function getFichas() {
  const { data, error } = await supabase
    .from('fichas')
    .select('*')
    .order('codigo_ficha', { ascending: true })

  if (error) {
    console.error('Error obteniendo fichas:', error)
    return []
  }
  return data
}

export async function getFichasActivas() {
  const { data, error } = await supabase
    .from('fichas')
    .select('*')
    .eq('activa', true)
    .order('codigo_ficha', { ascending: true })

  if (error) {
    console.error('Error obteniendo fichas activas:', error)
    return []
  }
  return data
}

export async function getFichaById(id) {
  const { data, error } = await supabase
    .from('fichas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error obteniendo ficha:', error)
    return null
  }
  return data
}

export async function createFicha(ficha) {
  const { data, error } = await supabase
    .from('fichas')
    .insert([{
      codigo_ficha: ficha.codigo_ficha,
      nombre_programa: ficha.nombre_programa,
      centro_formacion: ficha.centro_formacion,
      regional: ficha.regional,
      cupos_maximos: ficha.cupos_maximos || 35,
      fecha_inicio: ficha.fecha_inicio || null,
      fecha_fin: ficha.fecha_fin || null,
      activa: ficha.activa !== undefined ? ficha.activa : true
    }])
    .select()

  if (error) {
    console.error('Error creando ficha:', error)
    throw error
  }
  return data[0]
}

export async function updateFicha(id, updates) {
  const allowedUpdates = {}
  const camposPermitidos = ['codigo_ficha', 'nombre_programa', 'centro_formacion', 'regional', 'cupos_maximos', 'fecha_inicio', 'fecha_fin', 'activa']
  
  Object.keys(updates).forEach(key => {
    if (camposPermitidos.includes(key)) {
      allowedUpdates[key] = updates[key]
    }
  })
  
  const { data, error } = await supabase
    .from('fichas')
    .update(allowedUpdates)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error actualizando ficha:', error)
    throw error
  }
  return data[0]
}

export async function deleteFicha(id) {
  // Verificar si hay usuarios en esta ficha
  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id')
    .eq('ficha_id', id)
    .limit(1)
  
  if (usuarios && usuarios.length > 0) {
    throw new Error('No se puede eliminar la ficha porque tiene aprendices asociados')
  }
  
  const { error } = await supabase
    .from('fichas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error eliminando ficha:', error)
    throw error
  }
}

// ============ NOTIFICACIONES ============
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

// ============ ESTADÍSTICAS ============
export async function getEstadisticas() {
  try {
    const [usuarios, prestamosActivos, equiposDisponibles, prestamosHoy, noticiasRecientes] = await Promise.all([
      supabase.from('usuarios').select('id', { count: 'exact', head: true }),
      supabase.from('prestamos').select('id', { count: 'exact', head: true }).eq('estado', 'aceptado'),
      supabase.from('equipos').select('id', { count: 'exact', head: true }).eq('estado', 'disponible'),
      supabase.from('prestamos').select('id', { count: 'exact', head: true }).gte('fecha_solicitud', new Date().toISOString().split('T')[0]),
      supabase.from('noticias').select('id', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0])
    ])

    return {
      totalUsuarios: usuarios.count || 0,
      prestamosActivos: prestamosActivos.count || 0,
      equiposDisponibles: equiposDisponibles.count || 0,
      prestamosHoy: prestamosHoy.count || 0,
      noticiasRecientes: noticiasRecientes.count || 0
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    return {
      totalUsuarios: 0,
      prestamosActivos: 0,
      equiposDisponibles: 0,
      prestamosHoy: 0,
      noticiasRecientes: 0
    }
  }
}

export async function getEstadisticasPorCategoria() {
  try {
    const { data, error } = await supabase
      .from('categorias_equipos')
      .select(`
        id,
        nombre,
        icono,
        equipos(count)
      `)
      .eq('activa', true)

    if (error) throw error
    
    return data.map(cat => ({
      id: cat.id,
      nombre: cat.nombre,
      icono: cat.icono,
      totalEquipos: parseInt(cat.equipos[0]?.count || 0)
    }))
  } catch (error) {
    console.error('Error obteniendo estadísticas por categoría:', error)
    return []
  }
}

// ============ HISTORIAL ============
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
  
  // Aplicar filtros
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

// ============ SOLICITUDES DE PRÉSTAMOS ============
export async function crearSolicitudPrestamo(usuarioId, equipoId, fechaDevolucionEsperada = null, observaciones = null) {
  try {
    // Verificar que el equipo esté disponible
    const { data: equipo, error: equipoError } = await supabase
      .from('equipos')
      .select('estado, activo')
      .eq('id', equipoId)
      .single()
    
    if (equipoError) throw equipoError
    
    if (!equipo.activo || equipo.estado !== 'disponible') {
      throw new Error('El equipo no está disponible para préstamo')
    }
    
    // Crear la solicitud de préstamo
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
    
    // Marcar el equipo como ocupado temporalmente
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

// ============ AUTENTICACIÓN ============
const ROLES_PERMITIDOS = ['funcionario', 'admin']

export async function loginConDocumento(documento, contrasena) {
  try {
    // Validar que los campos no estén vacíos
    if (!documento || !documento.trim()) {
      return { data: null, error: new Error('Por favor, ingresa tu número de documento.') }
    }
    
    if (!contrasena || !contrasena.trim()) {
      return { data: null, error: new Error('Por favor, ingresa tu contraseña.') }
    }

    // 1. Buscar el usuario por número de documento (numero_cc)
    const { data: usuario, error: buscarError } = await supabase
      .from('usuarios')
      .select('correo, rol, primer_nombre, primer_apellido, estado_carne, activo')
      .eq('numero_cc', documento.trim())
      .maybeSingle() // Usar maybeSingle en lugar de single para evitar error 406

    if (buscarError) {
      console.error('Error buscando usuario:', buscarError)
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

    // 2. Verificar si el usuario está activo
    if (usuario.activo === false) {
      return { 
        data: null, 
        error: new Error('Tu cuenta está desactivada. Contacta al administrador.') 
      }
    }

    // 3. Validar rol - solo permitir acceso a funcionarios y admin 
    if (!ROLES_PERMITIDOS.includes(usuario.rol)) {
      return { 
        data: null, 
        error: new Error('Acceso denegado. Solo funcionarios y administradores pueden acceder al sistema.') 
      }
    }

    // 4. Verificar si el usuario tiene un correo asociado
    if (!usuario.correo) {
      return { 
        data: null, 
        error: new Error('Tu cuenta no tiene un correo electrónico asociado. Contacta al administrador.') 
      }
    }

    // 5. Intentar autenticar con Supabase Auth usando el correo y contraseña
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: usuario.correo,
      password: contrasena,
    })

    if (loginError) {
      console.error('Error de autenticación:', loginError)
      
      // Mensajes de error más amigables
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

    // 6. Login exitoso - retornar datos del usuario y sesión
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
    console.error('Error inesperado en login:', error)
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
      console.error('Error creando perfil:', profileError)
      throw profileError
    }

    return { user: authData.user, profile: profileData[0] }
  } catch (error) {
    console.error('Error en registro:', error)
    throw error
  }
}

export async function obtenerSesionActual() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session) return null
    return data.session
  } catch (error) {
    console.error('Error obteniendo sesión:', error)
    return null
  }
}

export async function cerrarSesion() {
  return await supabase.auth.signOut()
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
    console.error('Error obteniendo perfil:', error)
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
    console.error('Error actualizando perfil:', error)
    throw error
  }
  return data[0]
}