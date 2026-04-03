'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  ChevronDown, 
  ChevronUp,
  Menu,
  X,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { VideoPlayer } from './VideoPlayer'
import { LessonNav } from './LessonNav'
import { MaterialList } from './MaterialList'
import type { CourseContent, Lesson, Module } from '@/lib/queries/course-content'
import { markLessonCompleteAction, markLessonIncompleteAction } from '@/lib/actions/progress'

interface PlayerLayoutProps {
  course: CourseContent
  currentLesson: Lesson
  prevLessonId: string | null
  nextLessonId: string | null
  prevLessonTitle: string | null
  nextLessonTitle: string | null
}

// Helper para formatar duração
function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function PlayerLayout({
  course,
  currentLesson,
  prevLessonId,
  nextLessonId,
  prevLessonTitle,
  nextLessonTitle,
}: PlayerLayoutProps) {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    // Expandir o módulo da aula atual
    const currentModule = course.modules.find(m => 
      m.lessons.some(l => l.id === currentLesson.id)
    )
    return currentModule ? new Set([currentModule.id]) : new Set()
  })
  const [isCompleting, setIsCompleting] = useState(false)

  // Toggle módulo expandido
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }

  // Navegar para uma aula
  const navigateToLesson = (lessonId: string) => {
    router.push(`/app/course/${course.id}?lesson=${lessonId}`)
    setIsSidebarOpen(false)
  }

  // Marcar aula como concluída/não concluída
  const toggleComplete = async () => {
    setIsCompleting(true)
    try {
      if (currentLesson.progress.completed) {
        await markLessonIncompleteAction(currentLesson.id)
      } else {
        await markLessonCompleteAction(currentLesson.id)
      }
      // Recarregar a página para atualizar o progresso
      router.refresh()
    } catch (error) {
      console.error('Error toggling lesson completion:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  // Contar aulas concluídas em um módulo
  const getModuleProgress = (module: Module) => {
    const completed = module.lessons.filter(l => l.progress.completed).length
    return { completed, total: module.lessons.length }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block w-80 bg-brand-gray-900 h-full overflow-y-auto border-r border-brand-gray-800">
        <SidebarContent
          course={course}
          currentLesson={currentLesson}
          expandedModules={expandedModules}
          toggleModule={toggleModule}
          navigateToLesson={navigateToLesson}
          getModuleProgress={getModuleProgress}
        />
      </aside>

      {/* Sidebar - Mobile Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-80 bg-brand-gray-900 overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-brand-gray-800">
              <span className="font-semibold text-white">Conteúdo do Curso</span>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-brand-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarContent
              course={course}
              currentLesson={currentLesson}
              expandedModules={expandedModules}
              toggleModule={toggleModule}
              navigateToLesson={navigateToLesson}
              getModuleProgress={getModuleProgress}
            />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto bg-brand-gray-50">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Mobile Header com botão de menu */}
          <div className="lg:hidden flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={18} className="mr-2" />
              Conteúdo
            </Button>
            <span className="text-sm text-brand-gray-600">
              {course.progress.progressPct}% concluído
            </span>
          </div>

          {/* Video Player */}
          <VideoPlayer
            videoUrl={currentLesson.videoUrl}
            videoProvider={currentLesson.videoProvider}
            title={currentLesson.title}
          />

          {/* Lesson Info */}
          <div className="mt-6">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-brand-gray-900">
                {currentLesson.title}
              </h1>
              
              <Button
                variant={currentLesson.progress.completed ? "secondary" : "primary"}
                size="md"
                onClick={toggleComplete}
                loading={isCompleting}
                className="shrink-0"
              >
                {currentLesson.progress.completed ? (
                  <>
                    <Check size={18} className="mr-2" />
                    Concluída
                  </>
                ) : (
                  'Marcar como concluída'
                )}
              </Button>
            </div>

            {/* Navigation */}
            <LessonNav
              courseId={course.id}
              prevLessonId={prevLessonId}
              nextLessonId={nextLessonId}
              prevLessonTitle={prevLessonTitle}
              nextLessonTitle={nextLessonTitle}
            />

            {/* Materials */}
            <MaterialList materials={currentLesson.materials} />
          </div>
        </div>
      </main>
    </div>
  )
}

// Componente interno para o conteúdo da sidebar
interface SidebarContentProps {
  course: CourseContent
  currentLesson: Lesson
  expandedModules: Set<string>
  toggleModule: (moduleId: string) => void
  navigateToLesson: (lessonId: string) => void
  getModuleProgress: (module: Module) => { completed: number; total: number }
}

function SidebarContent({
  course,
  currentLesson,
  expandedModules,
  toggleModule,
  navigateToLesson,
  getModuleProgress,
}: SidebarContentProps) {
  return (
    <div className="p-4">
      {/* Course Title */}
      <h2 className="font-bold text-white mb-1 line-clamp-2">
        {course.title}
      </h2>
      
      {/* Overall Progress */}
      <div className="mb-6">
        <ProgressBar
          progress={course.progress.progressPct}
          size="sm"
          showPercentage={true}
          className="text-white"
        />
        <p className="text-xs text-brand-gray-400 mt-1">
          {course.progress.completedLessons} de {course.progress.totalLessons} aulas concluídas
        </p>
      </div>

      {/* Modules */}
      <div className="space-y-2">
        {course.modules.map((module, moduleIndex) => {
          const { completed, total } = getModuleProgress(module)
          const isExpanded = expandedModules.has(module.id)
          const isCurrentModule = module.lessons.some(l => l.id === currentLesson.id)

          return (
            <div 
              key={module.id}
              className={`rounded-lg overflow-hidden ${
                isCurrentModule ? 'bg-brand-gray-800' : 'bg-brand-gray-800/50'
              }`}
            >
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-brand-gray-800 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">
                    {moduleIndex + 1}. {module.title}
                  </p>
                  <p className="text-xs text-brand-gray-400 mt-0.5">
                    {completed}/{total} aulas concluídas
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-brand-gray-400 shrink-0 ml-2" />
                ) : (
                  <ChevronDown size={16} className="text-brand-gray-400 shrink-0 ml-2" />
                )}
              </button>

              {/* Lessons */}
              {isExpanded && (
                <div className="pb-2">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const isCurrentLesson = lesson.id === currentLesson.id
                    const isCompleted = lesson.progress.completed

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => navigateToLesson(lesson.id)}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                          isCurrentLesson
                            ? 'bg-brand-orange/20 border-l-2 border-brand-orange'
                            : 'hover:bg-brand-gray-700/50 border-l-2 border-transparent'
                        }`}
                      >
                        {/* Status Icon */}
                        <div className="shrink-0 mt-0.5">
                          {isCompleted ? (
                            <CheckCircle2 size={16} className="text-green-500" />
                          ) : (
                            <Circle size={16} className="text-brand-gray-500" />
                          )}
                        </div>

                        {/* Lesson Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${
                            isCurrentLesson 
                              ? 'text-white font-medium' 
                              : 'text-brand-gray-300'
                          }`}>
                            {lessonIndex + 1}. {lesson.title}
                          </p>
                          {lesson.durationSeconds && (
                            <p className="text-xs text-brand-gray-500 mt-0.5 flex items-center gap-1">
                              <Play size={10} />
                              {formatDuration(lesson.durationSeconds)}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


