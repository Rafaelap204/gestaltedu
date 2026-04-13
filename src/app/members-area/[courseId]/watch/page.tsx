import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { requireAuth } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import { VideoPlayer } from '@/components/course/VideoPlayer'
import { MaterialList } from '@/components/course/MaterialList'
import { Button } from '@/components/ui/Button'

interface WatchPageProps {
  params: Promise<{
    courseId: string
  }>
  searchParams: Promise<{
    lesson?: string
  }>
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  try {
    const { courseId } = await params
    const { lesson: lessonId } = await searchParams

    console.log('[WatchPage] Loading watch page:', { courseId, lessonId })

    const session = await requireAuth(`/members-area/${courseId}/watch`)
    const profileId = session.profile?.id

    console.log('[WatchPage] Auth check:', { profileId: profileId || 'null', lessonId: lessonId || 'null' })

    if (!profileId || !lessonId) {
      console.log('[WatchPage] Redirect: missing profileId or lessonId')
      redirect(`/members-area/${courseId}`)
    }

    const supabase = await createClient()

    // Verify enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', profileId)
      .eq('course_id', courseId)
      .single()

    console.log('[WatchPage] Enrollment check:', { enrollment: enrollment || 'null', error: enrollmentError?.message || 'none' })

    if (!enrollment || enrollment.status === 'cancelled') {
      console.log('[WatchPage] Redirect: no enrollment or cancelled')
      redirect('/app/my-courses')
    }

    // Get lesson data with module info
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        video_url,
        video_provider,
        materials,
        duration_seconds,
        order,
        module:modules(id, title, course_id)
      `)
      .eq('id', lessonId)
      .single()

    console.log('[WatchPage] Lesson check:', { lesson: lesson ? 'found' : 'null', error: lessonError?.message || 'none' })

    if (!lesson) {
      console.log('[WatchPage] Redirect: lesson not found')
      redirect(`/members-area/${courseId}`)
    }

    // Verify lesson belongs to this course
    const moduleData = lesson.module as any
    console.log('[WatchPage] Module check:', { moduleCourseId: moduleData?.course_id, expectedCourseId: courseId })
    
    if (moduleData?.course_id !== courseId) {
      console.log('[WatchPage] Redirect: lesson does not belong to course')
      redirect(`/members-area/${courseId}`)
    }

    // Get all lessons in this module for navigation
    const { data: moduleLessons } = await supabase
    .from('lessons')
    .select('id, title, order')
    .eq('module_id', moduleData.id)
    .order('order', { ascending: true })

    // Get lesson progress
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('completed, progress_pct')
      .eq('user_id', profileId)
      .eq('lesson_id', lessonId)
      .single()

    // Find prev/next lessons
    const currentIndex = moduleLessons?.findIndex(l => l.id === lessonId) ?? -1
    const prevLesson = currentIndex > 0 ? moduleLessons?.[currentIndex - 1] : null
    const nextLesson = currentIndex < (moduleLessons?.length ?? 0) - 1 ? moduleLessons?.[currentIndex + 1] : null

    // Get course theme
    const { data: course } = await supabase
      .from('courses')
      .select('title, members_area_theme')
      .eq('id', courseId)
      .single()

    const theme = course?.members_area_theme as { primaryColor?: string; darkMode?: boolean } | null
    const primaryColor = theme?.primaryColor || '#F97316'

    return (
      <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#141414] border-b border-brand-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/members-area/${courseId}`}
            className="flex items-center gap-2 text-white hover:text-brand-gray-300 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Voltar ao curso</span>
          </Link>

          <div className="flex items-center gap-4">
            <h1 className="text-white font-medium truncate max-w-md">
              {lesson.title}
            </h1>
            {progress?.completed && (
              <CheckCircle2 size={20} className="text-green-500" />
            )}
          </div>

          <div className="flex items-center gap-2">
            {prevLesson && (
              <Link
                href={`/members-area/${courseId}/watch?lesson=${prevLesson.id}`}
              >
                <Button variant="ghost" size="sm" className="text-white hover:bg-brand-gray-800">
                  <ChevronLeft size={18} className="mr-1" />
                  Anterior
                </Button>
              </Link>
            )}
            {nextLesson && (
              <Link
                href={`/members-area/${courseId}/watch?lesson=${nextLesson.id}`}
              >
                <Button variant="ghost" size="sm" className="text-white hover:bg-brand-gray-800">
                  Próxima
                  <ChevronRight size={18} className="ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Video Player */}
        <div className="aspect-video bg-black">
          {lesson.video_url ? (
            <VideoPlayer
              videoUrl={lesson.video_url}
              videoProvider={(lesson.video_provider as 'youtube' | 'vimeo' | 'panda') || null}
              title={lesson.title}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <p>Esta aula não possui vídeo</p>
            </div>
          )}
        </div>

        {/* Lesson Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-brand-gray-400 text-sm mb-1">{moduleData.title}</p>
              <h2 className="text-white text-xl font-semibold">{lesson.title}</h2>
            </div>

            {/* Mark as complete button */}
            <form action={async () => {
              'use server'
              const supabase = await createClient()
              await supabase
                .from('lesson_progress')
                .upsert({
                  user_id: profileId,
                  lesson_id: lessonId,
                  completed: true,
                  progress_pct: 100,
                  completed_at: new Date().toISOString(),
                })
              redirect(`/members-area/${courseId}/watch?lesson=${lessonId}`)
            }}>
              <Button
                type="submit"
                variant={progress?.completed ? 'secondary' : 'primary'}
                className={progress?.completed ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                style={!progress?.completed ? { backgroundColor: primaryColor } : {}}
              >
                {progress?.completed ? (
                  <>
                    <CheckCircle2 size={18} className="mr-2" />
                    Concluído
                  </>
                ) : (
                  'Marcar como concluído'
                )}
              </Button>
            </form>
          </div>

          {/* Materials */}
          {lesson.materials && Array.isArray(lesson.materials) && lesson.materials.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white font-medium mb-3">Materiais</h3>
              <MaterialList materials={lesson.materials as any[]} />
            </div>
          )}
        </div>
      </div>
      </div>
    )
  } catch (error) {
    console.error('[WatchPage] Error loading watch page:', error)
    const { courseId } = await params
    redirect(`/members-area/${courseId}`)
  }
}
