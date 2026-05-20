import { supabase } from '../supabaseClient'
import { formatearNombreCompleto } from './utils'

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
