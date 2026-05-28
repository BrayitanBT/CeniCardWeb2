import { supabase } from '../supabaseClient'

const BUCKET_FOTOS = 'fotos-perfil'

export async function subirFoto(file, userId) {
  const ext = file.name.split('.').pop()
  const filePath = `${userId}/perfil_${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .upload(filePath, file, { upsert: true })

  if (error) {
    if (error.message?.includes('bucket') || error.statusCode === 404) {
      throw new Error(`El bucket '${BUCKET_FOTOS}' no existe. Verifica que esté creado en Supabase Storage.`)
    }
    throw error
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_FOTOS)
    .getPublicUrl(filePath)

  return urlData.publicUrl
}
