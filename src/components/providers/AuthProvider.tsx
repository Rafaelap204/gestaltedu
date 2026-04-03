'use client'

import { useEffect, useState, useMemo, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuthContext, type UserProfile } from '@/lib/contexts/auth-context'
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Create client lazily to avoid build-time issues
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null
    return createClient()
  }, [])

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, role, name, avatar_url')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data as UserProfile
  }

  // Sign out function
  const signOut = async () => {
    if (!supabase) return
    
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    window.location.href = '/login'
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        const userProfile = await fetchProfile(session.user.id)
        setProfile(userProfile)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          setUser(session.user)
          const userProfile = await fetchProfile(session.user.id)
          setProfile(userProfile)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const value = {
    user,
    profile,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
