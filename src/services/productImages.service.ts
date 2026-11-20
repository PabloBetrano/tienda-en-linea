import { supabase } from './supabase'

const BUCKET = 'product-images'
const PUBLIC_PATH_MARKER = `/storage/v1/object/public/${BUCKET}/`
const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

function pathFromPublicUrl(url: string | null | undefined) {
  if (!url) return null
  const markerIndex = url.indexOf(PUBLIC_PATH_MARKER)
  if (markerIndex === -1) return null
  try {
    return decodeURIComponent(url.slice(markerIndex + PUBLIC_PATH_MARKER.length))
  } catch {
    return null
  }
}

export const productImagesService = {
  async upload(file: File) {
    const extension = extensions[file.type]
    if (!extension) throw new Error('El formato de la imagen no es compatible.')

    const path = `products/${crypto.randomUUID()}.${extension}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })
    if (error) throw error

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return { path, publicUrl: data.publicUrl }
  },

  async removeByPath(path: string) {
    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) throw error
  },

  async removeByPublicUrl(url: string | null | undefined) {
    const path = pathFromPublicUrl(url)
    if (path) await this.removeByPath(path)
  },

  pathFromPublicUrl,
}
