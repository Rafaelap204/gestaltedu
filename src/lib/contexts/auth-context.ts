'use client'

import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  user_id: string
  role: 'admin' | 'teacher' | 'student'
  name: string | null
  avatar_url: string | null
}

export interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)
