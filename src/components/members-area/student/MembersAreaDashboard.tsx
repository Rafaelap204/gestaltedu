'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Play, CheckCircle2, BookOpen, Video, FileText, Download,
  ChevronRight, Clock, ArrowLeft,
} from 'lucide-react'
import { CourseProgressHeader } from './CourseProgressHeader'
import { ModuleCardRow } from './ModuleCardRow'

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

interface CourseTheme {
  primaryColor: string
  logoUrl: string | null
  darkMode: boolean
}

interface MembersAreaDashboardProps {
  course: {
    id: string
    title: string
    slug: string
    description: string | null
    thumbnail_url: string | null
    theme: CourseTheme
  }
  modules: ModuleWithProgress[]
  totalLessons: number
  totalCompleted: number
  overallProgress: number
  nextLessonId: string | null
}

export function MembersAreaDashboard({
  course,
  modules,
  totalLessons,
  totalCompleted,
  overallProgress,
  nextLessonId,
}: MembersAreaDashboardProps) {
  const router = useRouter()
  const { theme } = course
  const isDark = theme.darkMode

  const bgColor = isDark ? 'bg-[#141425]' : 'bg-brand-gray-50'
  const textColor = isDark ? 'text-white' : 'text-brand-gray-900'
  const subtextColor = isDark ? 'text-brand-gray-300' : 'text-brand-gray-500'
  const cardBg = isDark ? 'bg-[#1e1e3a]' : 'bg-white'
  const borderColor = isDark ? 'border-brand-gray-700' : 'border-brand-gray-200'

  return (
    <div className={`min-h-screen ${bgColor} transition-colors duration-300`}>
      {/* Top Nav */}
      <nav className={`${cardBg} border-b ${borderColor} sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link
                href="/app/my-courses"
                className={`p-2 rounded-lg ${isDark ? 'text-brand-gray-400 hover:text-white hover:bg-brand-gray-700' : 'text-brand-gray-500 hover:text-brand-gray-700 hover:bg-brand-gray-100'} transition-colors`}
              >
                <ArrowLeft size={20} />
              </Link>
              {theme.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={theme.logoUrl} alt="Logo" className="h-8 object-contain" />
              ) : (
                <div
                  className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  G
                </div>
              )}
              <span className={`font-semibold ${textColor}`}>{course.title}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Hero / Progress Header */}
        <CourseProgressHeader
          courseTitle={course.title}
          courseDescription={course.description}
          thumbnailUrl={course.thumbnail_url}
          totalLessons={totalLessons}
          totalCompleted={totalCompleted}
          overallProgress={overallProgress}
          nextLessonId={nextLessonId}
          courseId={course.id}
          primaryColor={theme.primaryColor}
          isDark={isDark}
        />

        {/* Module Rows */}
        {modules.map((mod) => (
          <ModuleCardRow
            key={mod.id}
            module={mod}
            courseId={course.id}
            primaryColor={theme.primaryColor}
            isDark={isDark}
          />
        ))}

        {modules.length === 0 && (
          <div className={`text-center py-16 ${cardBg} rounded-xl border ${borderColor}`}>
            <BookOpen size={48} className={`mx-auto ${subtextColor} mb-4`} />
            <h3 className={`text-lg font-semibold ${textColor} mb-2`}>
              Nenhum conteúdo disponível
            </h3>
            <p className={`${subtextColor}`}>
              Este curso ainda não possui módulos e aulas cadastrados.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
