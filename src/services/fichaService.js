import { supabase } from '../supabaseClient'
import { logError } from './errorService'

export async function getFichas() {
  const { data, error } = await supabase
    .from('fichas')
    .select('*')
    .order('codigo_ficha', { ascending: true })

  if (error) {
    logError(error, 'fichaService.getFichas')
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
    logError(error, 'fichaService.getFichasActivas')
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
    logError(error, 'fichaService.getFichaById')
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
    logError(error, 'fichaService.createFicha')
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
    logError(error, 'fichaService.updateFicha')
    throw error
  }
  return data[0]
}

export async function deleteFicha(id) {
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
    logError(error, 'fichaService.deleteFicha')
    throw error
  }
}
