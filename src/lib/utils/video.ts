export type VideoProvider = 'youtube' | 'vimeo' | null

export function parseVideoUrl(url: string): { provider: VideoProvider; embedUrl: string | null } {
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ]
  
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern)
    if (match) {
      const videoId = match[1]
      return {
        provider: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      }
    }
  }
  
  // Vimeo patterns
  const vimeoPatterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ]
  
  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern)
    if (match) {
      const videoId = match[1]
      return {
        provider: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
      }
    }
  }
  
  return { provider: null, embedUrl: null }
}

export function getVideoEmbedUrl(url: string, provider: 'youtube' | 'vimeo'): string {
  const result = parseVideoUrl(url)
  if (result.provider === provider && result.embedUrl) {
    return result.embedUrl
  }
  
  // Fallback: tenta extrair ID e construir URL
  if (provider === 'youtube') {
    const match = url.match(/([a-zA-Z0-9_-]{11})/)
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
  }
  
  if (provider === 'vimeo') {
    const match = url.match(/(\d+)/)
    if (match) {
      return `https://player.vimeo.com/video/${match[1]}`
    }
  }
  
  return url
}

export function extractVideoId(url: string, provider: 'youtube' | 'vimeo'): string | null {
  const result = parseVideoUrl(url)
  if (result.provider !== provider || !result.embedUrl) {
    return null
  }
  
  if (provider === 'youtube') {
    const match = result.embedUrl.match(/embed\/([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
  }
  
  if (provider === 'vimeo') {
    const match = result.embedUrl.match(/video\/(\d+)/)
    return match ? match[1] : null
  }
  
  return null
}
