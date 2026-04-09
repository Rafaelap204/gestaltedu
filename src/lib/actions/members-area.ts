'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole, requireAuth } from '@/lib/utils/auth'
import type { MembersAreaTheme, MembersAreaConfig, LessonMaterial } from '@/types/database'

// ==================== MEMBERS AREA CONFIG ====================

export async function getMembersAreaConfig(courseId: string): Promise<MembersAreaConfig | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()

    const { data: course, error } = await supabase
      .from('courses')
      .select('id, teacher_id, members_area_enabled, members_area_subdomain, members_area_custom_domain, members_area_theme')
      .eq('id', courseId)
      .single()

    if (error || !course) {
      return { error: 'Curso não encontrado' }
    }

    const isAdmin = session.profile?.role === 'admin'
    const isOwner = course.teacher_id === session.profile?.id

    if (!isAdmin && !isOwner) {
      return { error: 'Você não tem permissão para acessar este curso' }
    }

    const theme = (course.members_area_theme as MembersAreaTheme) || {
      primaryColor: '#F97316',
      logoUrl: null,
      darkMode: false,
    }

    return {
      enabled: course.members_area_enabled || false,
      subdomain: course.members_area_subdomain || null,
      customDomain: course.members_area_custom_domain || null,
      theme,
    }
  } catch (error) {
    console.error('Error in getMembersAreaConfig:', error)
    return { error: 'Erro ao buscar configurações da área de membros' }
  }
}

export async function updateMembersAreaConfig(
  courseId: string,
  config: Partial<MembersAreaConfig>
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()

    // Verify ownership
    const { data: course } = await supabase
      .from('courses')
      .select('teacher_id, members_area_subdomain')
      .eq('id', courseId)
      .single()

    if (!course) {
      return { error: 'Curso não encontrado' }
    }

    const isAdmin = session.profile?.role === 'admin'
    const isOwner = course.teacher_id === session.profile?.id

    if (!isAdmin && !isOwner) {
      return { error: 'Você não tem permissão para editar este curso' }
    }

    // Check subdomain uniqueness if changing
    if (config.subdomain !== undefined && config.subdomain) {
      const normalizedSubdomain = config.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')
      if (normalizedSubdomain !== course.members_area_subdomain) {
        const { data: existing } = await supabase
          .from('courses')
          .select('id')
          .eq('members_area_subdomain', normalizedSubdomain)
          .neq('id', courseId)
          .single()

        if (existing) {
          return { error: 'Este subdomínio já está em uso por outro curso' }
        }
      }
      config.subdomain = normalizedSubdomain
    }

    // Check custom domain uniqueness if changing
    if (config.customDomain !== undefined && config.customDomain) {
      const normalizedDomain = config.customDomain.toLowerCase().trim()
      const { data: existingDomain } = await supabase
        .from('courses')
        .select('id')
        .eq('members_area_custom_domain', normalizedDomain)
        .neq('id', courseId)
        .single()

      if (existingDomain) {
        return { error: 'Este domínio personalizado já está em uso por outro curso' }
      }
      config.customDomain = normalizedDomain
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (config.enabled !== undefined) {
      updateData.members_area_enabled = config.enabled
    }
    if (config.subdomain !== undefined) {
      updateData.members_area_subdomain = config.subdomain || null
    }
    if (config.customDomain !== undefined) {
      updateData.members_area_custom_domain = config.customDomain || null
    }
    if (config.theme !== undefined) {
      updateData.members_area_theme = config.theme
    }

    const { error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', courseId)

    if (error) {
      console.error('Error updating members area config:', error)
      return { error: 'Erro ao atualizar configurações. Tente novamente.' }
    }

    revalidatePath(`/teacher/courses/${courseId}/members-area`)
    revalidatePath('/teacher/courses')
    return { success: true }
  } catch (error) {
    console.error('Error in updateMembersAreaConfig:', error)
    return { error: 'Erro ao atualizar configurações. Tente novamente.' }
  }
}

export async function toggleMembersArea(
  courseId: string,
  enabled: boolean
): Promise<{ success: boolean } | { error: string }> {
  return updateMembersAreaConfig(courseId, { enabled })
}

export async function checkSubdomainAvailability(
  subdomain: string,
  courseId?: string
): Promise<{ available: boolean } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()

    const normalizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')

    if (normalizedSubdomain.length < 3) {
      return { error: 'O subdomínio deve ter pelo menos 3 caracteres' }
    }

    // Reserved subdomains
    const reserved = ['www', 'app', 'admin', 'teacher', 'api', 'mail', 'ftp', 'staging', 'dev', 'test', 'gestalt', 'gestaltedu']
    if (reserved.includes(normalizedSubdomain)) {
      return { error: 'Este subdomínio é reservado e não pode ser utilizado' }
    }

    let query = supabase
      .from('courses')
      .select('id')
      .eq('members_area_subdomain', normalizedSubdomain)

    if (courseId) {
      query = query.neq('id', courseId)
    }

    const { data } = await query.single()

    return { available: !data }
  } catch (error) {
    console.error('Error in checkSubdomainAvailability:', error)
    return { error: 'Erro ao verificar disponibilidade do subdomínio' }
  }
}

// ==================== MODULE DETAILS ====================

export async function updateModuleDetails(
  moduleId: string,
  data: { description?: string; icon?: string; title?: string }
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()

    // Verify ownership through course
    const { data: module } = await supabase
      .from('modules')
      .select('course_id, courses!inner(teacher_id)')
      .eq('id', moduleId)
      .single()

    if (!module) {
      return { error: 'Módulo não encontrado' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const courseTeacherId = (module.courses as any)?.teacher_id
    const isAdmin = session.profile?.role === 'admin'
    const isOwner = courseTeacherId === session.profile?.id

    if (!isAdmin && !isOwner) {
      return { error: 'Você não tem permissão para editar este módulo' }
    }

    const updateData: Record<string, unknown> = {}

    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null
    }
    if (data.icon !== undefined) {
      updateData.icon = data.icon
    }
    if (data.title !== undefined) {
      updateData.title = data.title.trim()
    }

    const { error } = await supabase
      .from('modules')
      .update(updateData)
      .eq('id', moduleId)

    if (error) {
      console.error('Error updating module details:', error)
      return { error: 'Erro ao atualizar módulo. Tente novamente.' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const courseId = (module as any).course_id
    revalidatePath(`/teacher/courses/${courseId}/members-area`)
    return { success: true }
  } catch (error) {
    console.error('Error in updateModuleDetails:', error)
    return { error: 'Erro ao atualizar módulo. Tente novamente.' }
  }
}

// ==================== LESSON CONTENT ====================

export async function updateLessonContent(
  lessonId: string,
  data: {
    title?: string
    description?: string
    video_url?: string
    video_provider?: string
    materials?: LessonMaterial[]
  }
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()

    // Verify ownership through course
    const { data: lesson } = await supabase
      .from('lessons')
      .select('module_id, modules!inner(course_id, courses!inner(teacher_id))')
      .eq('id', lessonId)
      .single()

    if (!lesson) {
      return { error: 'Aula não encontrada' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const courseTeacherId = (lesson.modules as any)?.courses?.teacher_id
    const isAdmin = session.profile?.role === 'admin'
    const isOwner = courseTeacherId === session.profile?.id

    if (!isAdmin && !isOwner) {
      return { error: 'Você não tem permissão para editar esta aula' }
    }

    const updateData: Record<string, unknown> = {}

    if (data.title !== undefined) {
      updateData.title = data.title.trim()
    }
    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null
    }
    if (data.video_url !== undefined) {
      updateData.video_url = data.video_url || null
    }
    if (data.video_provider !== undefined) {
      updateData.video_provider = data.video_provider || null
    }
    if (data.materials !== undefined) {
      updateData.materials = data.materials
    }

    const { error } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', lessonId)

    if (error) {
      console.error('Error updating lesson content:', error)
      return { error: 'Erro ao atualizar aula. Tente novamente.' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const courseId = (lesson.modules as any)?.course_id
    revalidatePath(`/teacher/courses/${courseId}/members-area`)
    return { success: true }
  } catch (error) {
    console.error('Error in updateLessonContent:', error)
    return { error: 'Erro ao atualizar aula. Tente novamente.' }
  }
}

// ==================== COURSE ACCESS LOG ====================

export async function logCourseAccess(
  courseId: string,
  lessonId?: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireAuth()
    const supabase = await createClient()
    const profileId = session.profile?.id

    if (!profileId) {
      return { error: 'Perfil não encontrado' }
    }

    const { error } = await supabase
      .from('course_access_logs')
      .insert({
        user_id: profileId,
        course_id: courseId,
        lesson_id: lessonId || null,
      })

    if (error) {
      console.error('Error logging course access:', error)
      return { error: 'Erro ao registrar acesso' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in logCourseAccess:', error)
    return { error: 'Erro ao registrar acesso' }
  }
}

// ==================== GET COURSE WITH MEMBERS AREA DATA ====================

export async function getCourseMembersAreaData(courseId: string) {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()

    // Get course with members area config
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        slug,
        description,
        thumbnail_url,
        teacher_id,
        members_area_enabled,
        members_area_subdomain,
        members_area_custom_domain,
        members_area_theme
      `)
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return { error: 'Curso não encontrado' }
    }

    const isAdmin = session.profile?.role === 'admin'
    const isOwner = course.teacher_id === session.profile?.id

    if (!isAdmin && !isOwner) {
      return { error: 'Você não tem permissão para acessar este curso' }
    }

    // Get modules with lessons
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        description,
        icon,
        order,
        created_at,
        lessons (
          id,
          title,
          video_url,
          video_provider,
          materials,
          duration_seconds,
          order,
          created_at
        )
      `)
      .eq('course_id', courseId)
      .order('order', { ascending: true })

    if (modulesError) {
      console.error('Error fetching modules:', modulesError)
      return { error: 'Erro ao buscar módulos' }
    }

    // Sort lessons within each module
    const sortedModules = (modules || []).map(mod => ({
      ...mod,
      lessons: (mod.lessons || []).sort((a, b) => a.order - b.order),
    }))

    // Get enrollment count
    const { count: enrollmentsCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('status', 'active')

    return {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        members_area_enabled: course.members_area_enabled || false,
        members_area_subdomain: course.members_area_subdomain || null,
        members_area_custom_domain: course.members_area_custom_domain || null,
        members_area_theme: (course.members_area_theme as MembersAreaTheme) || {
          primaryColor: '#F97316',
          logoUrl: null,
          darkMode: false,
        },
      },
      modules: sortedModules,
      enrollmentsCount: enrollmentsCount || 0,
    }
  } catch (error) {
    console.error('Error in getCourseMembersAreaData:', error)
    return { error: 'Erro ao buscar dados do curso' }
  }
}

// ==================== STUDENT: GET MEMBERS AREA CONTENT ====================

export async function getStudentMembersAreaContent(courseId: string) {
  try {
    const session = await requireAuth()
    const supabase = await createClient()
    const profileId = session.profile?.id

    if (!profileId) {
      return { error: 'Perfil não encontrado' }
    }

    // Verify enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', profileId)
      .eq('course_id', courseId)
      .single()

    if (!enrollment || enrollment.status === 'cancelled') {
      return { error: 'Você não está matriculado neste curso' }
    }

    // Get course info
    const { data: course } = await supabase
      .from('courses')
      .select('id, title, slug, description, thumbnail_url, members_area_theme')
      .eq('id', courseId)
      .single()

    if (!course) {
      return { error: 'Curso não encontrado' }
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

    // Get lesson progress for this user in this course
    const allLessons = (modules || []).flatMap(m => m.lessons || [])
    const lessonIds = allLessons.map(l => l.id)

    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed, progress_pct')
      .eq('user_id', profileId)
      .in('lesson_id', lessonIds)

    const progressMap = new Map(
      (progress || []).map(p => [p.lesson_id, p])
    )

    // Calculate progress per module
    const modulesWithProgress = (modules || []).map(mod => {
      const lessonsWithProgress = (mod.lessons || [])
        .sort((a, b) => a.order - b.order)
        .map(lesson => ({
          ...lesson,
          completed: progressMap.get(lesson.id)?.completed || false,
          progress_pct: progressMap.get(lesson.id)?.progress_pct || 0,
        }))

      const totalLessons = lessonsWithProgress.length
      const completedLessons = lessonsWithProgress.filter(l => l.completed).length
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
    const nextLesson = allLessons.find(l => {
      const p = progressMap.get(l.id)
      return !p?.completed
    })

    return {
      course: {
        ...course,
        members_area_theme: (course.members_area_theme as MembersAreaTheme) || {
          primaryColor: '#F97316',
          logoUrl: null,
          darkMode: false,
        },
      },
      modules: modulesWithProgress,
      totalLessons,
      totalCompleted,
      overallProgress,
      nextLessonId: nextLesson?.id || null,
    }
  } catch (error) {
    console.error('Error in getStudentMembersAreaContent:', error)
    return { error: 'Erro ao buscar conteúdo do curso' }
  }
}
