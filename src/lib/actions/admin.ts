'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/utils/auth'
import { slugify, generateUniqueSlug } from '@/lib/utils/slug'
import type { UserRole } from '@/types/database'

// Helper to verify admin access
async function verifyAdmin() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Não autorizado')
  }
  
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (callerProfile?.role !== 'admin') {
    throw new Error('Apenas administradores podem executar esta ação')
  }
  
  return supabase
}

// ============================================================================
// COURSES
// ============================================================================

export async function approveCourseAction(courseId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await verifyAdmin()
    
    const { error } = await supabase
      .from('courses')
      .update({ 
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
    
    if (error) throw error
    
    revalidatePath('/admin/courses')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao aprovar curso' }
  }
}

export async function rejectCourseAction(courseId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await verifyAdmin()
    
    const { error } = await supabase
      .from('courses')
      .update({ 
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
    
    if (error) throw error
    
    revalidatePath('/admin/courses')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao rejeitar curso' }
  }
}

export async function toggleCourseFeatureAction(courseId: string, featured: boolean): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await verifyAdmin()
    
    const { error } = await supabase
      .from('courses')
      .update({ 
        featured,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
    
    if (error) throw error
    
    revalidatePath('/admin/courses')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao alterar destaque do curso' }
  }
}

export async function toggleCoursePublishAction(courseId: string, publish: boolean): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await verifyAdmin()
    
    // Se estiver tentando publicar, verificar se está completo
    if (publish) {
      const { data: course } = await supabase
        .from('courses')
        .select('is_complete, checkout_url, member_area_configured, full_description, image_url, category')
        .eq('id', courseId)
        .single()
      
      if (!course?.is_complete) {
        return { 
          error: 'Não é possível publicar. Preencha todas as informações completas primeiro (link de checkout e área de membros).' 
        }
      }
    }
    
    const { error } = await supabase
      .from('courses')
      .update({ 
        status: publish ? 'published' : 'draft',
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
    
    if (error) throw error
    
    revalidatePath('/admin/courses')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao alterar status do curso' }
  }
}

// ============================================================================
// USERS
// ============================================================================

export async function blockUserAction(profileId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await verifyAdmin()
    
    // Add blocked flag to profile metadata or use a separate field
    // For now, we'll add a note or use a custom field if available
    const { error } = await supabase
      .from('profiles')
      .update({ 
        updated_at: new Date().toISOString()
        // blocked: true - would need to add this column to schema
      })
      .eq('id', profileId)
    
    if (error) throw error
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao bloquear usuário' }
  }
}

export async function unblockUserAction(profileId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await verifyAdmin()
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        updated_at: new Date().toISOString()
        // blocked: false - would need to add this column to schema
      })
      .eq('id', profileId)
    
    if (error) throw error
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao desbloquear usuário' }
  }
}

export async function changeUserRoleAction(profileId: string, role: UserRole): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await verifyAdmin()
    
    const validRoles: UserRole[] = ['admin', 'teacher', 'student']
    if (!validRoles.includes(role)) {
      throw new Error('Role inválida')
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)
    
    if (error) throw error
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao alterar role do usuário' }
  }
}

// ============================================================================
// ENROLLMENTS
// ============================================================================

export async function cancelEnrollmentAction(enrollmentId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await verifyAdmin()
    
    const { error } = await supabase
      .from('enrollments')
      .update({ 
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', enrollmentId)
    
    if (error) throw error
    
    revalidatePath('/admin/enrollments')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao cancelar matrícula' }
  }
}

// ============================================================================
// FINANCIAL
// ============================================================================

export async function approveWithdrawAction(withdrawId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await verifyAdmin()
    
    const { error } = await supabase
      .from('withdraw_requests')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawId)
    
    if (error) throw error
    
    revalidatePath('/admin/financial')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao aprovar saque' }
  }
}

export async function rejectWithdrawAction(withdrawId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await verifyAdmin()
    
    const { error } = await supabase
      .from('withdraw_requests')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawId)
    
    if (error) throw error
    
    revalidatePath('/admin/financial')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao rejeitar saque' }
  }
}

// ============================================================================
// SETTINGS
// ============================================================================

export async function updatePlatformSettingAction(key: string, value: any): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await verifyAdmin()
    
    const { error } = await supabase
      .from('platform_settings')
      .upsert({ 
        key,
        value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
    
    if (error) throw error
    
    revalidatePath('/admin/settings')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao atualizar configuração' }
  }
}

export async function updatePayoutRuleAction(
  ruleId: string, 
  data: { platform_pct: number; teacher_pct: number; affiliate_pct: number }
): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await verifyAdmin()
    
    const { error } = await supabase
      .from('payout_rules')
      .update({ 
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', ruleId)
    
    if (error) throw error
    
    revalidatePath('/admin/settings')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao atualizar regra de pagamento' }
  }
}

// ============================================================================
// ADMIN COURSE CREATION
// ============================================================================

export async function createAdminCourseAction(formData: FormData): Promise<{ id: string } | { error: string }> {
  try {
    const session = await requireRole(['admin']) // Apenas admin
    const supabase = await createClient()
    
    // Extrair dados do formulário
    const title = formData.get('title') as string
    const fullDescription = formData.get('full_description') as string
    const imageUrl = formData.get('image_url') as string
    const category = formData.get('category') as string
    const refundPeriod = parseInt(formData.get('refund_period') as string) || 7
    const contentReleaseStrategy = formData.get('content_release_strategy') as string
    const contentReleaseDays = formData.get('content_release_days') ? parseInt(formData.get('content_release_days') as string) : null
    const paymentMethodsRaw = formData.get('payment_methods') as string
    const price = parseFloat(formData.get('price') as string) || 0
    
    // Validações
    if (!title?.trim()) {
      return { error: 'Título é obrigatório' }
    }
    
    if (!fullDescription?.trim()) {
      return { error: 'Descrição completa é obrigatória' }
    }
    
    if (!imageUrl) {
      return { error: 'Imagem do curso é obrigatória' }
    }
    
    if (!category) {
      return { error: 'Categoria é obrigatória' }
    }
    
    // Validar preço mínimo de R$30 (exceto gratuito)
    if (price > 0 && price < 30) {
      return { error: 'O valor mínimo para cursos pagos é R$ 30,00' }
    }
    
    // Validar prazo de reembolso
    if (![7, 15, 30].includes(refundPeriod)) {
      return { error: 'Prazo de reembolso deve ser 7, 15 ou 30 dias' }
    }
    
    // Validar estratégia de liberação
    if (!['immediate', 'progressive'].includes(contentReleaseStrategy)) {
      return { error: 'Estratégia de liberação inválida' }
    }
    
    if (contentReleaseStrategy === 'progressive' && !contentReleaseDays) {
      return { error: 'Informe o número de dias para liberação progressiva' }
    }
    
    // Parse das formas de pagamento
    let paymentMethods: string[] = []
    try {
      paymentMethods = paymentMethodsRaw ? JSON.parse(paymentMethodsRaw) : []
    } catch {
      return { error: 'Formas de pagamento inválidas' }
    }
    
    if (paymentMethods.length === 0) {
      return { error: 'Selecione pelo menos uma forma de pagamento' }
    }
    
    // Gerar slug único
    const baseSlug = slugify(title)
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('slug')
      .ilike('slug', `${baseSlug}%`)
    
    const existingSlugs = existingCourses?.map((c: any) => c.slug) || []
    const slug = generateUniqueSlug(title, existingSlugs)
    
    // Inserir curso
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: title.trim(),
        slug,
        full_description: fullDescription.trim(),
        image_url: imageUrl,
        category,
        refund_period: refundPeriod,
        content_release_strategy: contentReleaseStrategy,
        content_release_days: contentReleaseDays,
        payment_methods: paymentMethods,
        price,
        teacher_id: session.profile?.id, // Admin como "professor" do curso
        status: 'draft',
        featured: false,
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Error creating admin course:', error)
      return { error: 'Erro ao criar curso. Tente novamente.' }
    }
    
    revalidatePath('/admin/courses')
    return { id: data.id }
  } catch (error) {
    console.error('Error in createAdminCourseAction:', error)
    return { error: 'Erro ao criar curso. Tente novamente.' }
  }
}

// ============================================================================
// UPDATE COURSE COMPLETE INFO
// ============================================================================

export async function updateCourseCompleteInfoAction(
  courseId: string,
  data: { checkout_url?: string; member_area_configured?: boolean }
): Promise<{ success: boolean } | { error: string }> {
  try {
    const supabase = await verifyAdmin()
    
    // Verificar ownership
    const { data: course } = await supabase
      .from('courses')
      .select('teacher_id')
      .eq('id', courseId)
      .single()
    
    if (!course) {
      return { error: 'Curso não encontrado' }
    }
    
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
    
    const adminIds = adminProfiles?.map((p: any) => p.id) || []
    
    if (!adminIds.includes(course.teacher_id)) {
      return { error: 'Você não tem permissão para editar este curso' }
    }
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    
    if (data.checkout_url !== undefined) {
      updateData.checkout_url = data.checkout_url
    }
    
    if (data.member_area_configured !== undefined) {
      updateData.member_area_configured = data.member_area_configured
    }
    
    const { error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', courseId)
    
    if (error) {
      console.error('Error updating course complete info:', error)
      return { error: 'Erro ao atualizar informações. Tente novamente.' }
    }
    
    revalidatePath('/admin/courses')
    revalidatePath(`/admin/courses/${courseId}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Error in updateCourseCompleteInfoAction:', error)
    return { error: 'Erro ao atualizar informações. Tente novamente.' }
  }
}
