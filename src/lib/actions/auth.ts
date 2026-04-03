'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

// Sign out action
export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// Update profile action
export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Não autorizado')
  }
  
  const name = formData.get('name') as string
  const avatarUrl = formData.get('avatar_url') as string | null
  
  if (!name || name.trim().length === 0) {
    throw new Error('Nome é obrigatório')
  }
  
  // Update profile - user can only update their own profile
  const { error } = await supabase
    .from('profiles')
    .update({
      name: name.trim(),
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
  
  if (error) {
    throw new Error('Erro ao atualizar perfil')
  }
  
  revalidatePath('/app/settings')
  revalidatePath('/app')
  
  return { success: true }
}

// Change password action
export async function changePasswordAction(formData: FormData) {
  const supabase = await createClient()
  
  const currentPassword = formData.get('current_password') as string
  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string
  
  // Validate inputs
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new Error('Todos os campos são obrigatórios')
  }
  
  if (newPassword.length < 6) {
    throw new Error('A nova senha deve ter pelo menos 6 caracteres')
  }
  
  if (newPassword !== confirmPassword) {
    throw new Error('As senhas não coincidem')
  }
  
  // Update password using Supabase
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  
  if (error) {
    throw new Error('Erro ao alterar senha')
  }
  
  return { success: true }
}

// Promote user action (admin only)
export async function promoteUserAction(userId: string, newRole: UserRole) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Não autorizado')
  }
  
  // Verify caller is admin
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (callerProfile?.role !== 'admin') {
    throw new Error('Apenas administradores podem alterar roles')
  }
  
  // Validate role
  const validRoles: UserRole[] = ['admin', 'teacher', 'student']
  if (!validRoles.includes(newRole)) {
    throw new Error('Role inválida')
  }
  
  // Update user role
  const { error } = await supabase
    .from('profiles')
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
  
  if (error) {
    throw new Error('Erro ao atualizar role do usuário')
  }
  
  revalidatePath('/admin/users')
  
  return { success: true }
}

// Delete user account (admin only)
export async function deleteUserAction(userId: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Não autorizado')
  }
  
  // Verify caller is admin
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (callerProfile?.role !== 'admin') {
    throw new Error('Apenas administradores podem excluir usuários')
  }
  
  // Prevent self-deletion
  if (userId === user.id) {
    throw new Error('Não é possível excluir sua própria conta')
  }
  
  // Delete profile (cascade will handle related data)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('user_id', userId)
  
  if (error) {
    throw new Error('Erro ao excluir usuário')
  }
  
  revalidatePath('/admin/users')
  
  return { success: true }
}
