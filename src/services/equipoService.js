import { supabase } from '../supabaseClient'
import { logError } from './errorService'

async function notificarAdmins(tipo, titulo, descripcion) {
  try {
    await supabase.rpc('crear_notificaciones_admin', {
      p_tipo: tipo,
      p_titulo: titulo,
      p_descripcion: descripcion || null
    })
  } catch (e) {
    logError(e, 'equipoService.notificarAdmins')
  }
}

export async function getEquipos() {
  const { data, error } = await supabase
    .from('equipos')
    .select(`
      *,
      categorias_equipos(id, nombre, icono, descripcion)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    logError(error, 'equipoService.getEquipos')
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
    logError(error, 'equipoService.getEquiposByCategoria')
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
    logError(error, 'equipoService.getEquiposDisponibles')
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
    logError(error, 'equipoService.getEquipoById')
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
    logError(error, 'equipoService.createEquipo')
    throw error
  }

  const nuevoEquipo = data[0]
  await notificarAdmins(
    'equipo_agregado',
    'Nuevo equipo agregado',
    `Equipo #${nuevoEquipo.numero} - ${nuevoEquipo.marca || ''} ${nuevoEquipo.modelo || ''}`.trim()
  )

  return nuevoEquipo
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
    logError(error, 'equipoService.updateEquipo')
    throw error
  }
  return data[0]
}

export async function deleteEquipo(id) {
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
    logError(error, 'equipoService.deleteEquipo')
    throw error
  }
}

export async function getCategoriasEquipos() {
  const { data, error } = await supabase
    .from('categorias_equipos')
    .select('*')
    .eq('activa', true)
    .order('nombre', { ascending: true })

  if (error) {
    logError(error, 'equipoService.getCategoriasEquipos')
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
    logError(error, 'equipoService.getCategoriaById')
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
    logError(error, 'equipoService.createCategoria')
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
    logError(error, 'equipoService.updateCategoria')
    throw error
  }
  return data[0]
}

export async function deleteCategoria(id) {
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
    logError(error, 'equipoService.deleteCategoria')
    throw error
  }
}
