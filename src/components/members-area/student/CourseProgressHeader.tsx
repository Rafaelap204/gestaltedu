'use client'

import Link from 'next/link'
import { Play, Trophy } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface CourseProgressHeaderProps {
  courseTitle: string
  courseDescription: string | null
  thumbnailUrl: string | null
  totalLessons: number
  totalCompleted: number
  overallProgress: number
  nextLessonId: string | null
  courseId: string
  primaryColor: string
  isDark: boolean
}

export function CourseProgressHeader({
  courseTitle,
  courseDescription,
  thumbnailUrl,
  totalLessons,
  totalCompleted,
  overallProgress,
  nextLessonId,
  courseId,
  primaryColor,
  isDark,
}: CourseProgressHeaderProps) {
  const textColor = isDark ? 'text-white' : 'text-brand-gray-900'
  const subtextColor = isDark ? 'text-brand-gray-300' : 'text-brand-gray-500'

  return (
    <div className={`relative rounded-2xl overflow-hidden ${isDark ? 'bg-gradient-to-r from-[#1e1e3a] to-[#2a2a5a]' : 'bg-gradient-to-r from-brand-gray-900 to-brand-gray-700'}`}>
      {/* Background thumbnail overlay */}
      {thumbnailUrl && (
        <div className="absolute inset-0 opacity-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
        </div>
      )}

      <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Thumbnail */}
        {thumbnailUrl && (
          <div className="hidden sm:block flex-shrink-0">
            <div className="w-32 h-20 rounded-lg overflow-hidden shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailUrl}
                alt={courseTitle}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
            {courseTitle}
          </h2>
          {courseDescription && (
            <p className="text-sm text-white/70 mb-4 line-clamp-2">
              {courseDescription}
            </p>
          )}

          {/* Progress stats */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-yellow-400" />
              <span className="text-sm text-white/90">
                {totalCompleted} de {totalLessons} aulas concluídas
              </span>
            </div>
            <span
              className="text-sm font-bold"
              style={{ color: primaryColor }}
            >
              {overallProgress}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-white/20 rounded-full w-full max-w-md">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${overallProgress}%`,
                backgroundColor: primaryColor,
              }}
            />
          </div>
        </div>

        {/* Continue button */}
        {nextLessonId && (
          <Link
            href={`/members-area/${courseId}/watch?lesson=${nextLessonId}`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white transition-transform hover:scale-105 shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <Play size={18} fill="currentColor" />
            Continuar
          </Link>
        )}
      </div>
    </div>
  )
}
