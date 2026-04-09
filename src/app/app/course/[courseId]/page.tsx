import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/utils/auth'
import { getCourseContent, getNextLesson, getLessonWithContext } from '@/lib/queries/course-content'
import { PlayerLayout } from '@/components/course/PlayerLayout'
import { createClient } from '@/lib/supabase/server'

interface CoursePlayerPageProps {
  params: Promise<{
    courseId: string
  }>
  searchParams: Promise<{
    lesson?: string
  }>
}

export default async function CoursePlayerPage({
  params,
  searchParams,
}: CoursePlayerPageProps) {
  const { courseId } = await params
  const { lesson: lessonId } = await searchParams

  // Verificar autenticação
  const session = await requireAuth(`/app/course/${courseId}`)
  const profileId = session.profile?.id

  if (!profileId) {
    redirect('/login')
  }

  // Verificar matrícula ativa - usar profileId (profiles.id)
  const supabase = await createClient()
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status, course:courses!inner(slug)')
    .eq('user_id', profileId)
    .eq('course_id', courseId)
    .single()

  // Se não estiver matriculado ou matrícula cancelada, redirecionar para página pública
  if (!enrollment || enrollment.status === 'cancelled') {
    // Fetch course slug separately if enrollment doesn't exist
    let courseSlug = courseId
    if (!enrollment) {
      const { data: course } = await supabase
        .from('courses')
        .select('slug')
        .eq('id', courseId)
        .single()
      if (course?.slug) {
        courseSlug = course.slug
      }
    } else {
      const courseData = enrollment.course as unknown as { slug: string }[]
      courseSlug = courseData?.[0]?.slug || courseId
    }
    redirect(`/course/${courseSlug}`)
  }

  // Buscar conteúdo do curso
  const course = await getCourseContent(courseId, profileId)

  if (!course) {
    redirect('/app/my-courses')
  }

  // Determinar qual aula mostrar
  let currentLessonId: string | undefined = lessonId
  
  if (!currentLessonId) {
    // Tentar encontrar a próxima aula incompleta
    currentLessonId = await getNextLesson(courseId, profileId) || undefined
  }

  // Se ainda não tiver aula, pegar a primeira aula do primeiro módulo
  if (!currentLessonId) {
    const firstModule = course.modules[0]
    const firstLesson = firstModule?.lessons[0]
    currentLessonId = firstLesson?.id
  }

  // Se não houver aulas, mostrar mensagem
  if (!currentLessonId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-16rem)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-brand-gray-900 mb-2">
            Nenhuma aula disponível
          </h2>
          <p className="text-brand-gray-600 mb-4">
            Este curso ainda não possui aulas cadastradas.
          </p>
          <a 
            href="/app/my-courses"
            className="text-brand-orange hover:underline"
          >
            Voltar para meus cursos
          </a>
        </div>
      </div>
    )
  }

  // Buscar contexto da aula (anterior/próxima)
  const lessonContext = await getLessonWithContext(currentLessonId, profileId)

  if (!lessonContext) {
    redirect('/app/my-courses')
  }

  const { lesson, prevLessonId, nextLessonId } = lessonContext

  // Buscar títulos das aulas anterior/próxima
  let prevLessonTitle: string | null = null
  let nextLessonTitle: string | null = null

  if (prevLessonId) {
    const allLessons = course.modules.flatMap(m => m.lessons)
    const prevLesson = allLessons.find(l => l.id === prevLessonId)
    prevLessonTitle = prevLesson?.title || null
  }

  if (nextLessonId) {
    const allLessons = course.modules.flatMap(m => m.lessons)
    const nextLesson = allLessons.find(l => l.id === nextLessonId)
    nextLessonTitle = nextLesson?.title || null
  }

  return (
    <PlayerLayout
      course={course}
      currentLesson={lesson}
      prevLessonId={prevLessonId}
      nextLessonId={nextLessonId}
      prevLessonTitle={prevLessonTitle}
      nextLessonTitle={nextLessonTitle}
    />
  )
}
