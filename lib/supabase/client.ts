import { createBrowserClient } from "@supabase/ssr"

function createMockClient() {
  return {
    auth: {
      signInWithPassword: async () => ({ data: null, error: { message: "Supabase not configured" } }),
      signUp: async () => ({ data: null, error: { message: "Supabase not configured" } }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
      delete: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
    }),
  }
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Supabase environment variables missing, using mock client:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
      availableEnvVars: Object.keys(process.env).filter((key) => key.includes("SUPABASE")),
    })
    return createMockClient() as any
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
