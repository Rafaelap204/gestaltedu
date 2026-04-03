'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'

/**
 * Marca uma aula como concluída
 * - Verifica se o usuário está autenticado e matriculado no curso
 * - Faz upsert do progresso da aula com completed=true
 * - Verifica se todas as aulas do curso estão concluídas e atualiza a matrícula
 */
export async function markLessonCompleteAction(
  lessonId: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireAuth()
    const supabase = await createClient()
    const profileId = session.profile?.id

    if (!profileId) {
      return { error: 'Perfil não encontrado' }
    }

    // Buscar a aula e verificar se o usuário está matriculado no curso
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        id,
        module:modules!inner(
          id,
          course_id
        )
      `)
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return { error: 'Aula não encontrada' }
    }

    const courseId = (lesson.module as any).course_id

    // Verificar matrícula ativa
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', profileId)
      .eq('course_id', courseId)
      .single()

    if (enrollmentError || !enrollment) {
      return { error: 'Você não está matriculado neste curso' }
    }

    if (enrollment.status !== 'active') {
      return { error: 'Matrícula não está ativa' }
    }

    // Fazer upsert do progresso da aula
    const { error: upsertError } = await supabase
      .from('lesson_progress')
      .upsert(
        {
          user_id: profileId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
          progress_pct: 100,
        },
        {
          onConflict: 'user_id,lesson_id',
        }
      )

    if (upsertError) {
      console.error('Error upserting lesson progress:', upsertError)
      return { error: 'Erro ao atualizar progresso' }
    }

    // Verificar se todas as aulas do curso estão concluídas
    await checkAndUpdateCourseCompletion(profileId, courseId)

    return { success: true }
  } catch (error) {
    console.error('Error in markLessonCompleteAction:', error)
    return { error: 'Erro interno do servidor' }
  }
}

/**
 * Atualiza o progresso percentual de uma aula
 * - Não sobrescreve se já estiver concluída
 */
export async function updateLessonProgressAction(
  lessonId: string,
  progressPct: number
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireAuth()
    const supabase = await createClient()
    const profileId = session.profile?.id

    if (!profileId) {
      return { error: 'Perfil não encontrado' }
    }

    // Validar percentual
    const clampedProgress = Math.min(100, Math.max(0, progressPct))

    // Verificar se já existe progresso concluído
    const { data: existingProgress } = await supabase
      .from('lesson_progress')
      .select('completed')
      .eq('user_id', profileId)
      .eq('lesson_id', lessonId)
      .single()

    // Se já estiver concluído, não atualizar
    if (existingProgress?.completed) {
      return { success: true }
    }

    // Fazer upsert do progresso
    const { error: upsertError } = await supabase
      .from('lesson_progress')
      .upsert(
        {
          user_id: profileId,
          lesson_id: lessonId,
          progress_pct: clampedProgress,
          completed: clampedProgress >= 100,
          completed_at: clampedProgress >= 100 ? new Date().toISOString() : null,
        },
        {
          onConflict: 'user_id,lesson_id',
        }
      )

    if (upsertError) {
      console.error('Error upserting lesson progress:', upsertError)
      return { error: 'Erro ao atualizar progresso' }
    }

    // Se completou 100%, verificar conclusão do curso
    if (clampedProgress >= 100) {
      const { data: lesson } = await supabase
        .from('lessons')
        .select('module:modules!inner(course_id)')
        .eq('id', lessonId)
        .single()

      if (lesson) {
        const courseId = (lesson.module as any).course_id
        await checkAndUpdateCourseCompletion(profileId, courseId)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateLessonProgressAction:', error)
    return { error: 'Erro interno do servidor' }
  }
}

/**
 * Marca uma aula como não concluída
 * - Se a matrícula estava completa, reverte para ativa
 */
export async function markLessonIncompleteAction(
  lessonId: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireAuth()
    const supabase = await createClient()
    const profileId = session.profile?.id

    if (!profileId) {
      return { error: 'Perfil não encontrado' }
    }

    // Buscar a aula para obter o courseId
    const { data: lesson } = await supabase
      .from('lessons')
      .select('module:modules!inner(course_id)')
      .eq('id', lessonId)
      .single()

    const courseId = lesson ? (lesson.module as any).course_id : null

    // Atualizar progresso da aula
    const { error: updateError } = await supabase
      .from('lesson_progress')
      .upsert(
        {
          user_id: profileId,
          lesson_id: lessonId,
          completed: false,
          completed_at: null,
          progress_pct: 0,
        },
        {
          onConflict: 'user_id,lesson_id',
        }
      )

    if (updateError) {
      console.error('Error updating lesson progress:', updateError)
      return { error: 'Erro ao atualizar progresso' }
    }

    // Se a matrícula estava completa, reverter para ativa
    if (courseId) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('user_id', profileId)
        .eq('course_id', courseId)
        .single()

      if (enrollment?.status === 'completed') {
        await supabase
          .from('enrollments')
          .update({
            status: 'active',
            completed_at: null,
          })
          .eq('id', enrollment.id)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in markLessonIncompleteAction:', error)
    return { error: 'Erro interno do servidor' }
  }
}

/**
 * Helper: Verifica se todas as aulas do curso estão concluídas
 * e atualiza o status da matrícula se necessário
 */
async function checkAndUpdateCourseCompletion(
  profileId: string,
  courseId: string
): Promise<void> {
  const supabase = await createClient()

  // Buscar todas as aulas do curso
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId)

  const moduleIds = modules?.map(m => m.id) || []

  if (moduleIds.length === 0) return

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .in('module_id', moduleIds)

  const totalLessons = lessons?.length || 0

  if (totalLessons === 0) return

  // Buscar aulas concluídas
  const { data: completedProgress } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', profileId)
    .eq('completed', true)
    .in('lesson_id', lessons?.map(l => l.id) || [])

  const completedLessons = completedProgress?.length || 0

  // Se todas as aulas estão concluídas, marcar matrícula como completa
  if (completedLessons >= totalLessons) {
    await supabase
      .from('enrollments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', profileId)
      .eq('course_id', courseId)
  }
}
