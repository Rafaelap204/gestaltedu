'use client'

import { createClient } from '@/lib/supabase/client'

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const supabase = createClient()
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true })
  
  if (error) {
    return { error: error.message }
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)
  
  return { url: publicUrl }
}

export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean } | { error: string }> {
  const supabase = createClient()
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export function getFilePathFromUrl(bucket: string, url: string): string | null {
  // Extrai o path de uma URL pública do Supabase Storage
  // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const pattern = new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`)
  const match = url.match(pattern)
  return match ? match[1] : null
}
