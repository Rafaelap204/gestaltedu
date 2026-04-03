'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, requireRole } from '@/lib/utils/auth'
import { slugify, generateUniqueSlug } from '@/lib/utils/slug'
import type { CourseStatus } from '@/types/database'

// ==================== COURSES ====================

export async function createCourseAction(formData: FormData): Promise<{ id: string } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()
    
    const title = formData.get('title') as string
    const shortDescription = formData.get('short_description') as string
    const fullDescription = formData.get('full_description') as string
    const price = parseFloat(formData.get('price') as string) || 0
    const category = formData.get('category') as string
    const level = formData.get('level') as string
    const thumbnailUrl = formData.get('thumbnail_url') as string
    
    if (!title?.trim()) {
      return { error: 'Título é obrigatório' }
    }
    
    // Verifica se o slug já existe
    const baseSlug = slugify(title)
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('slug')
      .ilike('slug', `${baseSlug}%`)
    
    const existingSlugs = existingCourses?.map(c => c.slug) || []
    const slug = generateUniqueSlug(title, existingSlugs)
    
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: title.trim(),
        slug,
        short_description: shortDescription?.trim() || null,
        full_description: fullDescription?.trim() || null,
        price,
        category: category || null,
        level: level || null,
        thumbnail_url: thumbnailUrl || null,
        teacher_id: session.profile?.id,
        status: 'draft',
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Error creating course:', error)
      return { error: 'Erro ao criar curso. Tente novamente.' }
    }
    
    revalidatePath('/teacher/courses')
    return { id: data.id }
  } catch (error) {
    console.error('Error in createCourseAction:', error)
    return { error: 'Erro ao criar curso. Tente novamente.' }
  }
}

export async function updateCourseAction(
  courseId: string,
  formData: FormData
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()
    
    // Verifica ownership
    const { data: course } = await supabase
      .from('courses')
      .select('teacher_id')
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
    
    const title = formData.get('title') as string
    const shortDescription = formData.get('short_description') as string
    const fullDescription = formData.get('full_description') as string
    const price = parseFloat(formData.get('price') as string)
    const category = formData.get('category') as string
    const level = formData.get('level') as string
    const thumbnailUrl = formData.get('thumbnail_url') as string
    
    if (!title?.trim()) {
      return { error: 'Título é obrigatório' }
    }
    
    const updateData: Record<string, unknown> = {
      title: title.trim(),
      short_description: shortDescription?.trim() || null,
      full_description: fullDescription?.trim() || null,
      category: category || null,
      level: level || null,
      updated_at: new Date().toISOString(),
    }
    
    if (!isNaN(price)) {
      updateData.price = price
    }
    
    if (thumbnailUrl !== undefined) {
      updateData.thumbnail_url = thumbnailUrl || null
    }
    
    const { error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', courseId)
    
    if (error) {
      console.error('Error updating course:', error)
      return { error: 'Erro ao atualizar curso. Tente novamente.' }
    }
    
    revalidatePath('/teacher/courses')
    revalidatePath(`/teacher/courses/${courseId}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Error in updateCourseAction:', error)
    return { error: 'Erro ao atualizar curso. Tente novamente.' }
  }
}

export async function deleteCourseAction(courseId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()
    
    // Verifica ownership e status
    const { data: course } = await supabase
      .from('courses')
      .select('teacher_id, status')
      .eq('id', courseId)
      .single()
    
    if (!course) {
      return { error: 'Curso não encontrado' }
    }
    
    const isAdmin = session.profile?.role === 'admin'
    const isOwner = course.teacher_id === session.profile?.id
    
    if (!isAdmin && !isOwner) {
      return { error: 'Você não tem permissão para excluir este curso' }
    }
    
    // Apenas cursos em rascunho podem ser excluídos (exceto admin)
    if (!isAdmin && course.status !== 'draft') {
      return { error: 'Apenas cursos em rascunho podem ser excluídos' }
    }
    
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
    
    if (error) {
      console.error('Error deleting course:', error)
      return { error: 'Erro ao excluir curso. Tente novamente.' }
    }
    
    revalidatePath('/teacher/courses')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteCourseAction:', error)
    return { error: 'Erro ao excluir curso. Tente novamente.' }
  }
}

export async function publishCourseAction(courseId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()
    
    // Verifica ownership
    const { data: course } = await supabase
      .from('courses')
      .select('teacher_id, status')
      .eq('id', courseId)
      .single()
    
    if (!course) {
      return { error: 'Curso não encontrado' }
    }
    
    const isAdmin = session.profile?.role === 'admin'
    const isOwner = course.teacher_id === session.profile?.id
    
    if (!isAdmin && !isOwner) {
      return { error: 'Você não tem permissão para publicar este curso' }
    }
    
    const { error } = await supabase
      .from('courses')
      .update({
        status: 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)
    
    if (error) {
      console.error('Error publishing course:', error)
      return { error: 'Erro ao publicar curso. Tente novamente.' }
    }
    
    revalidatePath('/teacher/courses')
    revalidatePath(`/teacher/courses/${courseId}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Error in publishCourseAction:', error)
    return { error: 'Erro ao publicar curso. Tente novamente.' }
  }
}

export async function unpublishCourseAction(courseId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()
    
    // Verifica ownership
    const { data: course } = await supabase
      .from('courses')
      .select('teacher_id, status')
      .eq('id', courseId)
      .single()
    
    if (!course) {
      return { error: 'Curso não encontrado' }
    }
    
    const isAdmin = session.profile?.role === 'admin'
    const isOwner = course.teacher_id === session.profile?.id
    
    if (!isAdmin && !isOwner) {
      return { error: 'Você não tem permissão para despublicar este curso' }
    }
    
    const { error } = await supabase
      .from('courses')
      .update({
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)
    
    if (error) {
      console.error('Error unpublishing course:', error)
      return { error: 'Erro ao despublicar curso. Tente novamente.' }
    }
    
    revalidatePath('/teacher/courses')
    revalidatePath(`/teacher/courses/${courseId}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Error in unpublishCourseAction:', error)
    return { error: 'Erro ao despublicar curso. Tente novamente.' }
  }
}

// ==================== MODULES ====================

export async function createModuleAction(
  courseId: string,
  title: string
): Promise<{ id: string } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()
    
    // Verifica ownership do curso
    const { data: course } = await supabase
      .from('courses')
      .select('teacher_id')
      .eq('id', courseId)
      .single()
    
    if (!course) {
      return { error: 'Curso não encontrado' }
    }
    
    const isAdmin = session.profile?.role === 'admin'
    const isOwner = course.teacher_id === session.profile?.id
    
    if (!isAdmin && !isOwner) {
      return { error: 'Você não tem permissão para adicionar módulos a este curso' }
    }
    
    // Obtém a ordem máxima atual
    const { data: modules } = await supabase
      .from('modules')
      .select('order')
      .eq('course_id', courseId)
      .order('order', { ascending: false })
      .limit(1)
    
    const nextOrder = (modules?.[0]?.order || 0) + 1
    
    const { data, error } = await supabase
      .from('modules')
      .insert({
        course_id: courseId,
        title: title.trim(),
        order: nextOrder,
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Error creating module:', error)
      return { error: 'Erro ao criar módulo. Tente novamente.' }
    }
    
    revalidatePath(`/teacher/courses/${courseId}/edit`)
    return { id: data.id }
  } catch (error) {
    console.error('Error in createModuleAction:', error)
    return { error: 'Erro ao criar módulo. Tente novamente.' }
  }
}

export async function updateModuleAction(
  moduleId: string,
  data: { title?: string; order?: number }
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()
    
    // Verifica ownership através do curso
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
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    
    if (data.title !== undefined) {
      updateData.title = data.title.trim()
    }
    
    if (data.order !== undefined) {
      updateData.order = data.order
    }
    
    const { error } = await supabase
      .from('modules')
      .update(updateData)
      .eq('id', moduleId)
    
    if (error) {
      console.error('Error updating module:', error)
      return { error: 'Erro ao atualizar módulo. Tente novamente.' }
    }
    
    revalidatePath(`/teacher/courses/${module.course_id}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Error in updateModuleAction:', error)
    return { error: 'Erro ao atualizar módulo. Tente novamente.' }
  }
}

export async function deleteModuleAction(moduleId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()
    
    // Verifica ownership através do curso
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
      return { error: 'Você não tem permissão para excluir este módulo' }
    }
    
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId)
    
    if (error) {
      console.error('Error deleting module:', error)
      return { error: 'Erro ao excluir módulo. Tente novamente.' }
    }
    
    revalidatePath(`/teacher/courses/${module.course_id}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Error in deleteModuleAction:', error)
    return { error: 'Erro ao excluir módulo. Tente novamente.' }
  }
}

export async function reorderModulesAction(
  courseId: string,
  moduleIds: string[]
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()
    
    // Verifica ownership
    const { data: course } = await supabase
      .from('courses')
      .select('teacher_id')
      .eq('id', courseId)
      .single()
    
    if (!course) {
      return { error: 'Curso não encontrado' }
    }
    
    const isAdmin = session.profile?.role === 'admin'
    const isOwner = course.teacher_id === session.profile?.id
    
    if (!isAdmin && !isOwner) {
      return { error: 'Você não tem permissão para reordenar módulos' }
    }
    
    // Atualiza a ordem de cada módulo
    const updates = moduleIds.map((id, index) => ({
      id,
      order: index + 1,
      updated_at: new Date().toISOString(),
    }))
    
    const { error } = await supabase
      .from('modules')
      .upsert(updates)
    
    if (error) {
      console.error('Error reordering modules:', error)
      return { error: 'Erro ao reordenar módulos. Tente novamente.' }
    }
    
    revalidatePath(`/teacher/courses/${courseId}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Error in reorderModulesAction:', error)
    return { error: 'Erro ao reordenar módulos. Tente novamente.' }
  }
}

// ==================== LESSONS ====================

export async function createLessonAction(
  moduleId: string,
  data: { title: string; video_url?: string; video_provider?: string }
): Promise<{ id: string } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()
    
    // Verifica ownership através do curso
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
      return { error: 'Você não tem permissão para adicionar aulas a este módulo' }
    }
    
    // Obtém a ordem máxima atual
    const { data: lessons } = await supabase
      .from('lessons')
      .select('order')
      .eq('module_id', moduleId)
      .order('order', { ascending: false })
      .limit(1)
    
    const nextOrder = (lessons?.[0]?.order || 0) + 1
    
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        module_id: moduleId,
        title: data.title.trim(),
        video_url: data.video_url || null,
        video_provider: data.video_provider || null,
        order: nextOrder,
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Error creating lesson:', error)
      return { error: 'Erro ao criar aula. Tente novamente.' }
    }
    
    revalidatePath(`/teacher/courses/${module.course_id}/edit`)
    return { id: lesson.id }
  } catch (error) {
    console.error('Error in createLessonAction:', error)
    return { error: 'Erro ao criar aula. Tente novamente.' }
  }
}

export async function updateLessonAction(
  lessonId: string,
  data: { title?: string; video_url?: string; video_provider?: string; order?: number }
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()
    
    // Verifica ownership através do curso
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
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    
    if (data.title !== undefined) {
      updateData.title = data.title.trim()
    }
    
    if (data.video_url !== undefined) {
      updateData.video_url = data.video_url || null
    }
    
    if (data.video_provider !== undefined) {
      updateData.video_provider = data.video_provider || null
    }
    
    if (data.order !== undefined) {
      updateData.order = data.order
    }
    
    const { error } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', lessonId)
    
    if (error) {
      console.error('Error updating lesson:', error)
      return { error: 'Erro ao atualizar aula. Tente novamente.' }
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const courseId = (lesson.modules as any)?.course_id
    revalidatePath(`/teacher/courses/${courseId}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Error in updateLessonAction:', error)
    return { error: 'Erro ao atualizar aula. Tente novamente.' }
  }
}

export async function deleteLessonAction(lessonId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()
    
    // Verifica ownership através do curso
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
      return { error: 'Você não tem permissão para excluir esta aula' }
    }
    
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)
    
    if (error) {
      console.error('Error deleting lesson:', error)
      return { error: 'Erro ao excluir aula. Tente novamente.' }
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const courseId = (lesson.modules as any)?.course_id
    revalidatePath(`/teacher/courses/${courseId}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Error in deleteLessonAction:', error)
    return { error: 'Erro ao excluir aula. Tente novamente.' }
  }
}

export async function reorderLessonsAction(
  moduleId: string,
  lessonIds: string[]
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()
    
    // Verifica ownership através do curso
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
      return { error: 'Você não tem permissão para reordenar aulas' }
    }
    
    // Atualiza a ordem de cada aula
    const updates = lessonIds.map((id, index) => ({
      id,
      order: index + 1,
      updated_at: new Date().toISOString(),
    }))
    
    const { error } = await supabase
      .from('lessons')
      .upsert(updates)
    
    if (error) {
      console.error('Error reordering lessons:', error)
      return { error: 'Erro ao reordenar aulas. Tente novamente.' }
    }
    
    revalidatePath(`/teacher/courses/${module.course_id}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Error in reorderLessonsAction:', error)
    return { error: 'Erro ao reordenar aulas. Tente novamente.' }
  }
}

// ==================== MATERIALS ====================

export async function updateLessonMaterialsAction(
  lessonId: string,
  materials: { name: string; url: string; type: string }[]
): Promise<{ success: boolean } | { error: string }> {
  try {
    const session = await requireRole(['teacher', 'admin'])
    const supabase = await createClient()
    
    // Verifica ownership através do curso
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
    
    const { error } = await supabase
      .from('lessons')
      .update({
        materials: materials,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lessonId)
    
    if (error) {
      console.error('Error updating lesson materials:', error)
      return { error: 'Erro ao atualizar materiais. Tente novamente.' }
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const courseId = (lesson.modules as any)?.course_id
    revalidatePath(`/teacher/courses/${courseId}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Error in updateLessonMaterialsAction:', error)
    return { error: 'Erro ao atualizar materiais. Tente novamente.' }
  }
}
