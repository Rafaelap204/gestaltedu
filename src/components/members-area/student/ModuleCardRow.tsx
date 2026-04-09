'use client'

import { useRef } from 'react'
import Link from 'next/link'
import {
  BookOpen, Video, FileText, Download, Music, Image, Code,
  Palette, GraduationCap, Lightbulb, Target, Rocket, Star,
  Heart, Zap, Globe, Users, Trophy, Clock, Layers, Package,
  ChevronLeft, ChevronRight, CheckCircle2,
} from 'lucide-react'
import { LessonCard } from './LessonCard'

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, Video, FileText, Download, Music, Image, Code,
  Palette, GraduationCap, Lightbulb, Target, Rocket, Star,
  Heart, Zap, Globe, Users, Trophy, Clock, Layers, Package,
}

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

interface ModuleWithProgress {
  id: string
  title: string
  description: string | null
  icon: string | null
  order: number
  lessons: LessonWithProgress[]
  totalLessons: number
  completedLessons: number
  progressPct: number
}

interface ModuleCardRowProps {
  module: ModuleWithProgress
  courseId: string
  primaryColor: string
  isDark: boolean
}

export function ModuleCardRow({
  module,
  courseId,
  primaryColor,
  isDark,
}: ModuleCardRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const IconComponent = ICON_MAP[module.icon || 'BookOpen'] || BookOpen
  const textColor = isDark ? 'text-white' : 'text-brand-gray-900'
  const subtextColor = isDark ? 'text-brand-gray-300' : 'text-brand-gray-500'

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = 300
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <div>
      {/* Module Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: primaryColor + '15', color: primaryColor }}
          >
            <IconComponent size={20} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${textColor}`}>
              {module.title}
            </h3>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${subtextColor}`}>
                {module.completedLessons}/{module.totalLessons} aulas
              </span>
              {module.progressPct === 100 && (
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <CheckCircle2 size={14} />
                  Completo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-32 h-2 bg-brand-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${module.progressPct}%`,
                backgroundColor: module.progressPct === 100 ? '#10B981' : primaryColor,
              }}
            />
          </div>
          <span className={`text-sm font-medium ${subtextColor}`}>
            {module.progressPct}%
          </span>
        </div>
      </div>

      {/* Scrollable Lesson Cards */}
      <div className="relative group">
        {/* Left scroll button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
          style={{ backgroundColor: isDark ? '#2a2a5a' : 'white', color: isDark ? 'white' : '#374151' }}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Cards container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 px-1 scroll-smooth"
          style={{ scrollbarWidth: 'thin', msOverflowStyle: 'auto' }}
        >
          {module.lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              courseId={courseId}
              primaryColor={primaryColor}
              isDark={isDark}
            />
          ))}
        </div>

        {/* Right scroll button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
          style={{ backgroundColor: isDark ? '#2a2a5a' : 'white', color: isDark ? 'white' : '#374151' }}
        >
          <ChevronRight size={20} />
        </button>

        {/* Gradient overlays - reduced width to not block clicks */}
        <div className={`absolute left-0 top-0 bottom-2 w-4 pointer-events-none bg-gradient-to-r ${isDark ? 'from-[#141425]' : 'from-brand-gray-50'} to-transparent`} />
        <div className={`absolute right-0 top-0 bottom-2 w-4 pointer-events-none bg-gradient-to-l ${isDark ? 'from-[#141425]' : 'from-brand-gray-50'} to-transparent`} />
      </div>
    </div>
  )
}
