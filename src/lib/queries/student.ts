import { createClient } from '@/lib/supabase/server'
import { calculateProgress, type CourseProgress } from '@/lib/utils/progress'

export interface EnrollmentWithCourse {
  id: string
  status: string
  started_at: string
  completed_at: string | null
  course: {
    id: string
    title: string
    slug: string
    thumbnail_url: string | null
    members_area_enabled: boolean
    teacher: {
      name: string | null
    } | null
  }
  progress: {
    totalLessons: number
    completedLessons: number
    progressPct: number
    lastLessonId: string | null
  }
}

export async function getStudentEnrollments(profileId: string): Promise<EnrollmentWithCourse[]> {
  const supabase = await createClient()

  // Fetch enrollments with course data and teacher info
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      started_at,
      completed_at,
      course:courses(
        id,
        title,
        slug,
        thumbnail_url,
        members_area_enabled,
        teacher:profiles(name)
      )
    `)
    .eq('user_id', profileId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })

  if (error || !enrollments) {
    console.error('Error fetching enrollments:', error)
    return []
  }

  // For each enrollment, calculate progress
  const enrollmentsWithProgress: EnrollmentWithCourse[] = []

  for (const enrollment of enrollments) {
    const course = enrollment.course as any
    
    // Get all modules for this course first
    const { data: modules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', course.id)
    
    const moduleIds = modules?.map(m => m.id) || []
    
    // Get all lessons for these modules
    const { data: lessons } = moduleIds.length > 0 
      ? await supabase
          .from('lessons')
          .select('id')
          .in('module_id', moduleIds)
      : { data: [] }

    const totalLessons = lessons?.length || 0

    // Get completed lessons for this user
    const { data: progressData } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed')
      .eq('user_id', profileId)
      .in('lesson_id', lessons?.map(l => l.id) || [])

    const completedLessons = progressData?.filter(p => p.completed).length || 0
    const progressPct = calculateProgress(completedLessons, totalLessons)

    // Get last accessed lesson
    const lastLesson = progressData?.[0]?.lesson_id || null

    enrollmentsWithProgress.push({
      id: enrollment.id,
      status: enrollment.status,
      started_at: enrollment.started_at,
      completed_at: enrollment.completed_at,
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnail_url: course.thumbnail_url,
        members_area_enabled: course.members_area_enabled || false,
        teacher: course.teacher,
      },
      progress: {
        totalLessons,
        completedLessons,
        progressPct,
        lastLessonId: lastLesson,
      },
    })
  }

  return enrollmentsWithProgress
}

export async function getStudentCourseProgress(profileId: string, courseId: string): Promise<CourseProgress | null> {
  const supabase = await createClient()

  // Get course details
  const { data: course } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      thumbnail_url,
      teacher:profiles(name)
    `)
    .eq('id', courseId)
    .single()

  if (!course) return null

  // Get all lessons for this course
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId)

  const moduleIds = modules?.map(m => m.id) || []

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .in('module_id', moduleIds)

  const totalLessons = lessons?.length || 0

  // Get progress
  const { data: progressData } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed')
    .eq('user_id', profileId)
    .in('lesson_id', lessons?.map(l => l.id) || [])

  const completedLessons = progressData?.filter(p => p.completed).length || 0
  const lastLessonId = progressData?.[0]?.lesson_id || null

  return {
    courseId: course.id,
    courseTitle: course.title,
    courseSlug: course.slug,
    courseThumbnail: course.thumbnail_url,
    teacherName: (course.teacher as any)?.name || null,
    totalLessons,
    completedLessons,
    progressPct: calculateProgress(completedLessons, totalLessons),
    lastLessonId,
  }
}

export interface RecommendedCourse {
  id: string
  title: string
  slug: string
  thumbnail_url: string | null
  short_description: string | null
  price: number
  teacher: {
    name: string | null
  } | null
}

export async function getRecommendedCourses(profileId: string, limit = 6): Promise<RecommendedCourse[]> {
  const supabase = await createClient()

  // Get enrolled course IDs
  const { data: enrolledCourses } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', profileId)

  const enrolledIds = enrolledCourses?.map(e => e.course_id) || []

  // Fetch published courses not enrolled
  let query = supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      thumbnail_url,
      short_description,
      price,
      teacher:profiles(name)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (enrolledIds.length > 0) {
    query = query.not('id', 'in', `(${enrolledIds.join(',')})`)
  }

  const { data: courses, error } = await query

  if (error || !courses) {
    console.error('Error fetching recommended courses:', error)
    return []
  }

  return courses.map(course => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    thumbnail_url: course.thumbnail_url,
    short_description: course.short_description,
    price: course.price,
    teacher: course.teacher as any,
  }))
}

export async function getEnrollmentsByStatus(
  profileId: string,
  status: 'active' | 'completed'
): Promise<EnrollmentWithCourse[]> {
  const supabase = await createClient()

  let query = supabase
    .from('enrollments')
    .select(`
      id,
      status,
      started_at,
      completed_at,
      course:courses(
        id,
        title,
        slug,
        thumbnail_url,
        members_area_enabled,
        teacher:profiles(name)
      )
    `)
    .eq('user_id', profileId)

  if (status === 'completed') {
    query = query.eq('status', 'completed')
  } else {
    query = query.eq('status', 'active')
  }

  const { data: enrollments, error } = await query.order('started_at', { ascending: false })

  if (error || !enrollments) {
    console.error('Error fetching enrollments:', error)
    return []
  }

  // Calculate progress for each
  const enrollmentsWithProgress: EnrollmentWithCourse[] = []

  for (const enrollment of enrollments) {
    const course = enrollment.course as any

    // Get lessons count
    const { data: modules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', course.id)

    const moduleIds = modules?.map(m => m.id) || []

    const { data: lessons } = await supabase
      .from('lessons')
      .select('id')
      .in('module_id', moduleIds)

    const totalLessons = lessons?.length || 0

    const { data: progressData } = await supabase
      .from('lesson_progress')
      .select('completed')
      .eq('user_id', profileId)
      .in('lesson_id', lessons?.map(l => l.id) || [])

    const completedLessons = progressData?.filter(p => p.completed).length || 0
    const progressPct = calculateProgress(completedLessons, totalLessons)

    // Filter by progress for "active" tab (progress < 100%)
    // and "completed" tab (progress = 100% or status = completed)
    if (status === 'active' && progressPct >= 100) continue
    if (status === 'completed' && progressPct < 100 && enrollment.status !== 'completed') continue

    enrollmentsWithProgress.push({
      id: enrollment.id,
      status: enrollment.status,
      started_at: enrollment.started_at,
      completed_at: enrollment.completed_at,
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnail_url: course.thumbnail_url,
        members_area_enabled: course.members_area_enabled || false,
        teacher: course.teacher,
      },
      progress: {
        totalLessons,
        completedLessons,
        progressPct,
        lastLessonId: null,
      },
    })
  }

  return enrollmentsWithProgress
}
