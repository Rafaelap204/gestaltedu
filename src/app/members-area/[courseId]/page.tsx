import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import { MembersAreaDashboard } from '@/components/members-area/student/MembersAreaDashboard'

interface MembersPageProps {
  params: Promise<{
    courseId: string
  }>
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { courseId } = await params
  const session = await requireAuth(`/members-area/${courseId}`)
  const profileId = session.profile?.id

  if (!profileId) {
    redirect('/login')
  }

  // Verify enrollment - usar profileId (profiles.id)
  const supabase = await createClient()
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', profileId)
    .eq('course_id', courseId)
    .single()

  if (!enrollment || enrollment.status === 'cancelled') {
    redirect(`/app/my-courses`)
  }

  // Get course info
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, description, thumbnail_url, members_area_theme')
    .eq('id', courseId)
    .single()

  if (!course) {
    redirect('/app/my-courses')
  }

  // Get modules with lessons
  const { data: modules } = await supabase
    .from('modules')
    .select(`
      id,
      title,
      description,
      icon,
      order,
      lessons (
        id,
        title,
        video_url,
        video_provider,
        materials,
        duration_seconds,
        order
      )
    `)
    .eq('course_id', courseId)
    .order('order', { ascending: true })

  // Get lesson progress
  const allLessons = (modules || []).flatMap((m: { lessons: Array<{ id: string }> }) => m.lessons || [])
  const lessonIds = allLessons.map((l: { id: string }) => l.id)

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed, progress_pct')
    .eq('user_id', profileId)
    .in('lesson_id', lessonIds)

  const progressMap = new Map(
    (progress || []).map(p => [p.lesson_id, p])
  )

  // Build modules with progress
  const modulesWithProgress = (modules || []).map((mod: {
    id: string
    title: string
    description: string | null
    icon: string | null
    order: number
    lessons: Array<{
      id: string
      title: string
      video_url: string | null
      video_provider: string | null
      materials: unknown
      duration_seconds: number | null
      order: number
    }>
  }) => {
    const lessonsWithProgress = (mod.lessons || [])
      .sort((a, b) => a.order - b.order)
      .map(lesson => ({
        ...lesson,
        completed: progressMap.get(lesson.id)?.completed || false,
        progress_pct: progressMap.get(lesson.id)?.progress_pct || 0,
      }))

    const totalLessons = lessonsWithProgress.length
    const completedLessons = lessonsWithProgress.filter((l: { completed: boolean }) => l.completed).length
    const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return {
      ...mod,
      lessons: lessonsWithProgress,
      totalLessons,
      completedLessons,
      progressPct,
    }
  })

  const totalLessons = allLessons.length
  const totalCompleted = (progress || []).filter(p => p.completed).length
  const overallProgress = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0

  // Find next incomplete lesson
  const nextLesson = allLessons.find((l: { id: string }) => {
    const p = progressMap.get(l.id)
    return !p?.completed
  })

  const theme = course.members_area_theme as {
    primaryColor?: string
    logoUrl?: string | null
    darkMode?: boolean
  } | null

  return (
    <MembersAreaDashboard
      course={{
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        theme: {
          primaryColor: theme?.primaryColor || '#F97316',
          logoUrl: theme?.logoUrl || null,
          darkMode: theme?.darkMode || false,
        },
      }}
      modules={modulesWithProgress}
      totalLessons={totalLessons}
      totalCompleted={totalCompleted}
      overallProgress={overallProgress}
      nextLessonId={nextLesson?.id || null}
    />
  )
}
