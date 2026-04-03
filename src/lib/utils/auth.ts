import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

export interface SessionData {
  user: {
    id: string
    email: string
  }
  profile: {
    id: string
    user_id: string
    role: UserRole
    name: string | null
    avatar_url: string | null
  } | null
}

// Get current session (user + profile) - server-side
export async function getSession(): Promise<SessionData | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, user_id, role, name, avatar_url')
    .eq('user_id', user.id)
    .single()
  
  return {
    user: {
      id: user.id,
      email: user.email!,
    },
    profile: profile as SessionData['profile'],
  }
}

// Require authentication - redirect to login if not authenticated
export async function requireAuth(redirectPath?: string): Promise<SessionData> {
  const session = await getSession()
  
  if (!session) {
    const loginUrl = redirectPath 
      ? `/login?redirect=${encodeURIComponent(redirectPath)}`
      : '/login'
    redirect(loginUrl)
  }
  
  return session
}

// Require specific role - redirect if not authorized
export async function requireRole(
  role: UserRole | UserRole[],
  redirectPath: string = '/app'
): Promise<SessionData> {
  const session = await requireAuth()
  
  const allowedRoles = Array.isArray(role) ? role : [role]
  const userRole = session.profile?.role
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    redirect(`${redirectPath}?error=unauthorized`)
  }
  
  return session
}

// Check if user has specific role
export async function hasRole(role: UserRole | UserRole[]): Promise<boolean> {
  const session = await getSession()
  
  if (!session?.profile?.role) {
    return false
  }
  
  const allowedRoles = Array.isArray(role) ? role : [role]
  return allowedRoles.includes(session.profile.role)
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin')
}

// Check if user is teacher or admin
export async function isTeacherOrAdmin(): Promise<boolean> {
  return hasRole(['teacher', 'admin'])
}
