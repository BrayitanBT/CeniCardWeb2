import { supabase } from '../supabaseClient'

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
