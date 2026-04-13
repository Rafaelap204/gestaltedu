'use client'

import { parseVideoUrl } from '@/lib/utils/video'
import { Play } from 'lucide-react'

interface VideoPlayerProps {
  videoUrl: string | null
  videoProvider: 'youtube' | 'vimeo' | 'panda' | null
  title: string
}

export function VideoPlayer({ videoUrl, videoProvider, title }: VideoPlayerProps) {
  // Parse URL para obter embed URL
  const getEmbedUrl = (): string | null => {
    if (!videoUrl) {
      console.log('[VideoPlayer] No video URL provided')
      return null
    }
    
    console.log('[VideoPlayer] Parsing URL:', videoUrl, 'Provider:', videoProvider)
    
    const result = parseVideoUrl(videoUrl)
    console.log('[VideoPlayer] Parse result:', result)
    
    if (result.embedUrl) {
      return result.embedUrl
    }
    
    // Fallback: se provider foi especificado mas não conseguiu parse
    if (videoProvider === 'youtube') {
      const match = videoUrl.match(/([a-zA-Z0-9_-]{11})/)
      if (match) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
    }
    
    if (videoProvider === 'vimeo') {
      const match = videoUrl.match(/(\d+)/)
      if (match) {
        return `https://player.vimeo.com/video/${match[1]}`
      }
    }
    
    if (videoProvider === 'panda') {
      // Panda Video: try to extract ID from URL or use URL directly
      const pandaPatterns = [
        /player-panda\.b-cdn\.net\/([a-zA-Z0-9_-]+)/,
        /cdn\.panda\.video\/([a-zA-Z0-9_-]+)/,
        /dashboard\.panda\.video\/(?:video|embed)\/([a-zA-Z0-9_-]+)/,
      ]
      for (const pattern of pandaPatterns) {
        const match = videoUrl.match(pattern)
        if (match) {
          return `https://player-panda.b-cdn.net/${match[1]}`
        }
      }
      // If URL looks like a direct Panda player URL, use as-is
      if (videoUrl.includes('player-panda.b-cdn.net')) {
        return videoUrl
      }
    }
    
    return null
  }

  const embedUrl = getEmbedUrl()

  if (!embedUrl) {
    return (
      <div className="relative w-full aspect-video bg-brand-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-brand-gray-800 flex items-center justify-center">
            <Play size={32} className="text-brand-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-brand-gray-300 mb-2">
            Nenhum vídeo disponível
          </h3>
          <p className="text-sm text-brand-gray-500">
            Esta aula ainda não possui um vídeo associado.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}
