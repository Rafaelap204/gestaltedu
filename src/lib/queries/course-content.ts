import { createClient } from '@/lib/supabase/server'
import { calculateProgress } from '@/lib/utils/progress'

export interface Lesson {
  id: string
  title: string
  videoUrl: string | null
  videoProvider: 'youtube' | 'vimeo' | null
  durationSeconds: number | null
  order: number
  materials: Array<{
    name: string
    url: string
    type?: string
  }>
  progress: {
    completed: boolean
    progressPct: number
    completedAt: string | null
  }
}

export interface Module {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

export interface CourseContent {
  id: string
  title: string
  description: string | null
  slug: string
  thumbnailUrl: string | null
  teacher: {
    id: string
    name: string | null
  } | null
  modules: Module[]
  enrollment: {
    id: string
    status: 'active' | 'completed' | 'cancelled'
    startedAt: string
    completedAt: string | null
  }
  progress: {
    totalLessons: number
    completedLessons: number
    progressPct: number
  }
}

/**
 * Busca o conteúdo completo de um curso com progresso do aluno
 */
export async function getCourseContent(
  courseId: string,
  profileId: string
): Promise<CourseContent | null> {
  const supabase = await createClient()

  // Verificar matrícula
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id, status, started_at, completed_at')
    .eq('user_id', profileId)
    .eq('course_id', courseId)
    .single()

  if (enrollmentError || !enrollment) {
    return null
  }

  // Buscar detalhes do curso
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      description,
      slug,
      thumbnail_url,
      teacher:profiles!inner(id, name)
    `)
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    return null
  }

  // Buscar módulos ordenados
  const { data: modulesData, error: modulesError } = await supabase
    .from('modules')
    .select('id, title, order')
    .eq('course_id', courseId)
    .order('order', { ascending: true })

  if (modulesError) {
    return null
  }

  // Buscar todas as aulas de todos os módulos
  const moduleIds = modulesData?.map(m => m.id) || []
  
  let lessonsData: any[] = []
  if (moduleIds.length > 0) {
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, video_url, video_provider, duration_seconds, order, module_id, materials')
      .in('module_id', moduleIds)
      .order('order', { ascending: true })
    
    lessonsData = lessons || []
  }

  // Buscar progresso do aluno para todas as aulas
  const lessonIds = lessonsData.map(l => l.id)
  
  let progressData: any[] = []
  if (lessonIds.length > 0) {
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed, progress_pct, completed_at')
      .eq('user_id', profileId)
      .in('lesson_id', lessonIds)
    
    progressData = progress || []
  }

  // Criar mapa de progresso para fácil acesso
  const progressMap = new Map(
    progressData.map(p => [
      p.lesson_id,
      {
        completed: p.completed,
        progressPct: p.progress_pct,
        completedAt: p.completed_at,
      },
    ])
  )

  // Estruturar módulos com aulas
  const modules: Module[] = modulesData.map(module => {
    const moduleLessons = lessonsData
      .filter(l => l.module_id === module.id)
      .map(lesson => {
        const progress = progressMap.get(lesson.id)
        return {
          id: lesson.id,
          title: lesson.title,
          videoUrl: lesson.video_url,
          videoProvider: lesson.video_provider,
          durationSeconds: lesson.duration_seconds,
          order: lesson.order,
          materials: lesson.materials || [],
          progress: {
            completed: progress?.completed || false,
            progressPct: progress?.progressPct || 0,
            completedAt: progress?.completedAt || null,
          },
        }
      })
      .sort((a, b) => a.order - b.order)

    return {
      id: module.id,
      title: module.title,
      order: module.order,
      lessons: moduleLessons,
    }
  })

  // Calcular estatísticas de progresso
  const allLessons = modules.flatMap(m => m.lessons)
  const totalLessons = allLessons.length
  const completedLessons = allLessons.filter(l => l.progress.completed).length
  const progressPct = calculateProgress(completedLessons, totalLessons)

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    slug: course.slug,
    thumbnailUrl: course.thumbnail_url,
    teacher: course.teacher as any,
    modules,
    enrollment: {
      id: enrollment.id,
      status: enrollment.status,
      startedAt: enrollment.started_at,
      completedAt: enrollment.completed_at,
    },
    progress: {
      totalLessons,
      completedLessons,
      progressPct,
    },
  }
}

/**
 * Encontra a primeira aula incompleta do curso em ordem
 */
export async function getNextLesson(
  courseId: string,
  profileId: string
): Promise<string | null> {
  const supabase = await createClient()

  // Buscar todos os módulos do curso
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId)
    .order('order', { ascending: true })

  const moduleIds = modules?.map(m => m.id) || []
  
  if (moduleIds.length === 0) return null

  // Buscar todas as aulas ordenadas
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .in('module_id', moduleIds)
    .order('order', { ascending: true })

  if (!lessons || lessons.length === 0) return null

  const lessonIds = lessons.map(l => l.id)

  // Buscar progresso das aulas
  const { data: progressData } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed')
    .eq('user_id', profileId)
    .in('lesson_id', lessonIds)

  const completedMap = new Map(
    progressData?.map(p => [p.lesson_id, p.completed]) || []
  )

  // Encontrar primeira aula não concluída
  const firstIncomplete = lessons.find(
    lesson => !completedMap.get(lesson.id)
  )

  // Se todas estão concluídas, retornar a primeira aula
  return firstIncomplete?.id || lessons[0]?.id || null
}

/**
 * Busca uma aula específica com contexto do curso
 */
export async function getLessonWithContext(
  lessonId: string,
  profileId: string
): Promise<{
  lesson: Lesson
  courseId: string
  moduleId: string
  prevLessonId: string | null
  nextLessonId: string | null
} | null> {
  const supabase = await createClient()

  // Buscar a aula atual
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      video_url,
      video_provider,
      duration_seconds,
      order,
      module_id,
      materials,
      module:modules!inner(course_id)
    `)
    .eq('id', lessonId)
    .single()

  if (lessonError || !lesson) {
    return null
  }

  const courseId = (lesson.module as any).course_id
  const moduleId = lesson.module_id

  // Buscar progresso da aula
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('completed, progress_pct, completed_at')
    .eq('user_id', profileId)
    .eq('lesson_id', lessonId)
    .single()

  // Buscar todas as aulas do curso para navegação
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId)
    .order('order', { ascending: true })

  const moduleIds = modules?.map(m => m.id) || []

  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, order, module_id')
    .in('module_id', moduleIds)
    .order('order', { ascending: true })

  // Encontrar índice da aula atual
  const currentIndex = allLessons?.findIndex(l => l.id === lessonId) ?? -1
  
  const prevLessonId = currentIndex > 0 ? allLessons![currentIndex - 1].id : null
  const nextLessonId = currentIndex < (allLessons?.length || 0) - 1 
    ? allLessons![currentIndex + 1].id 
    : null

  return {
    lesson: {
      id: lesson.id,
      title: lesson.title,
      videoUrl: lesson.video_url,
      videoProvider: lesson.video_provider,
      durationSeconds: lesson.duration_seconds,
      order: lesson.order,
      materials: lesson.materials || [],
      progress: {
        completed: progress?.completed || false,
        progressPct: progress?.progress_pct || 0,
        completedAt: progress?.completed_at || null,
      },
    },
    courseId,
    moduleId,
    prevLessonId,
    nextLessonId,
  }
}
