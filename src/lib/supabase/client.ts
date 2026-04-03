import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Return a mock client during build/static generation
    // This will be replaced with the real client at runtime
    return {
      auth: {
        signInWithPassword: async () => ({ error: null, data: { user: null, session: null } }),
        signUp: async () => ({ error: null, data: { user: null, session: null } }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        resetPasswordForEmail: async () => ({ error: null, data: {} }),
        updateUser: async () => ({ error: null, data: { user: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
          }),
          order: () => ({
            limit: () => ({
              single: async () => ({ data: null, error: null }),
            }),
          }),
        }),
        insert: async () => ({ data: null, error: null }),
        update: async () => ({ data: null, error: null }),
        delete: async () => ({ data: null, error: null }),
        upsert: async () => ({ data: null, error: null }),
      }),
    } as unknown as ReturnType<typeof createBrowserClient>
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
