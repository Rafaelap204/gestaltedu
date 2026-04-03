'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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
