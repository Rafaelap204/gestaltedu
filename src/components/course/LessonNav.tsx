'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface LessonNavProps {
  courseId: string
  prevLessonId: string | null
  nextLessonId: string | null
  prevLessonTitle?: string | null
  nextLessonTitle?: string | null
}

export function LessonNav({
  courseId,
  prevLessonId,
  nextLessonId,
  prevLessonTitle,
  nextLessonTitle,
}: LessonNavProps) {
  const router = useRouter()

  const navigateToLesson = (lessonId: string) => {
    router.push(`/app/course/${courseId}?lesson=${lessonId}`)
  }

  return (
    <div className="flex items-center justify-between gap-4 mt-6">
      {/* Botão Aula Anterior */}
      <Button
        variant="outline"
        size="md"
        onClick={() => prevLessonId && navigateToLesson(prevLessonId)}
        disabled={!prevLessonId}
        className="flex-1 justify-start"
      >
        <ChevronLeft size={20} className="mr-2 shrink-0" />
        <div className="text-left min-w-0">
          <span className="block text-xs text-brand-gray-500">Aula anterior</span>
          <span className="block truncate text-sm font-medium">
            {prevLessonTitle || 'Início do curso'}
          </span>
        </div>
      </Button>

      {/* Botão Próxima Aula */}
      <Button
        variant="outline"
        size="md"
        onClick={() => nextLessonId && navigateToLesson(nextLessonId)}
        disabled={!nextLessonId}
        className="flex-1 justify-end"
      >
        <div className="text-right min-w-0">
          <span className="block text-xs text-brand-gray-500">Próxima aula</span>
          <span className="block truncate text-sm font-medium">
            {nextLessonTitle || 'Fim do curso'}
          </span>
        </div>
        <ChevronRight size={20} className="ml-2 shrink-0" />
      </Button>
    </div>
  )
}
