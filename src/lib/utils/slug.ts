export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function generateUniqueSlug(title: string, existingSlugs: string[] = []): string {
  let slug = slugify(title)
  
  if (!existingSlugs.includes(slug)) {
    return slug
  }
  
  // Adiciona sufixo aleatório se o slug já existe
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  return `${slug}-${randomSuffix}`
}
