'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Video, FileText, Download, CheckCircle2, Play, Clock } from 'lucide-react'

interface LessonWithProgress {
  id: string
  title: string
  video_url: string | null
  video_provider: string | null
  materials: unknown
  duration_seconds: number | null
  order: number
  completed: boolean
  progress_pct: number
}

interface LessonCardProps {
  lesson: LessonWithProgress
  courseId: string
  primaryColor: string
  isDark: boolean
}

function getLessonTypeInfo(lesson: LessonWithProgress) {
  if (lesson.video_url) {
    return { icon: Video, label: 'Vídeo', bgClass: 'bg-blue-500/20 text-blue-400' }
  }
  const materials = lesson.materials as Array<{ contentType?: string }> | undefined
  if (materials && materials.length > 0) {
    const ct = materials[0].contentType
    if (ct === 'ebook') return { icon: FileText, label: 'Ebook', bgClass: 'bg-purple-500/20 text-purple-400' }
    if (ct === 'text') return { icon: FileText, label: 'Texto', bgClass: 'bg-green-500/20 text-green-400' }
    if (ct === 'resource') return { icon: Download, label: 'Recurso', bgClass: 'bg-yellow-500/20 text-yellow-400' }
  }
  return { icon: FileText, label: 'Conteúdo', bgClass: 'bg-brand-gray-500/20 text-brand-gray-400' }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function LessonCard({
  lesson,
  courseId,
  primaryColor,
  isDark,
}: LessonCardProps) {
  const router = useRouter()
  const typeInfo = getLessonTypeInfo(lesson)
  const TypeIcon = typeInfo.icon
  const cardBg = isDark ? 'bg-[#1e1e3a] hover:bg-[#252550]' : 'bg-white hover:bg-brand-gray-50'
  const textColor = isDark ? 'text-white' : 'text-brand-gray-900'
  const subtextColor = isDark ? 'text-brand-gray-400' : 'text-brand-gray-500'

  const handleClick = () => {
    router.push(`/members-area/${courseId}/watch?lesson=${lesson.id}`)
  }

  return (
    <div
      onClick={handleClick}
      className={`flex-shrink-0 w-48 sm:w-56 rounded-xl overflow-hidden border transition-all duration-200 hover:scale-[1.03] hover:shadow-lg group cursor-pointer relative z-10 ${
        isDark ? 'border-brand-gray-700' : 'border-brand-gray-200'
      } ${cardBg}`}
    >
      {/* Thumbnail area */}
      <div className="relative h-28 flex items-center justify-center" style={{ backgroundColor: isDark ? '#14142a' : '#f3f4f6' }}>
        {/* Type icon */}
        <div className={`p-3 rounded-xl ${typeInfo.bgClass}`}>
          <TypeIcon size={28} />
        </div>

        {/* Completed badge */}
        {lesson.completed && (
          <div className="absolute top-2 right-2">
            <CheckCircle2 size={20} className="text-green-500" fill="currentColor" />
          </div>
        )}

        {/* Duration */}
        {lesson.duration_seconds && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-xs">
            <Clock size={10} />
            {formatDuration(lesson.duration_seconds)}
          </div>
        )}

        {/* Play overlay on hover */}
        {!lesson.completed && lesson.video_url && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              <Play size={18} className="text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className={`text-sm font-medium ${textColor} line-clamp-2 leading-snug`}>
          {lesson.title}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${subtextColor}`}>
            {typeInfo.label}
          </span>
          {lesson.progress_pct > 0 && !lesson.completed && (
            <div className="w-12 h-1 bg-brand-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${lesson.progress_pct}%`,
                  backgroundColor: primaryColor,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
