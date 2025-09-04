"use client"

import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

interface AuthUser extends User {
  user_type?: string
  name?: string
  phone?: string
  cpf_cnpj?: string
  company_name?: string
  fantasy_name?: string
  bio?: string
  categories?: string[]
  hourly_rate?: number
  service_rate?: number
  pricing_type?: string
  service_radius?: number
  availability?: any
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (userData: SignupData) => Promise<void>
  logout: () => Promise<void>
}

interface SignupData {
  email: string
  password: string
  metadata: {
    name: string
    phone: string
    cpf_cnpj: string
    user_type: string
    company_name?: string | null
    fantasy_name?: string | null
    bio?: string | null
    categories?: string[] | null
    hourly_rate?: number | null
    service_rate?: number | null
    pricing_type?: string | null
    service_radius?: number | null
    availability?: any | null
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null)
  const isInitialized = useRef(false)
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
  const router = useRouter()

  const checkSupabaseConfig = useCallback(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    console.log("[v0] Checking Supabase config:", { url: !!url, key: !!key })

    if (!url || !key) {
      console.warn("[v0] Supabase not configured - missing environment variables")
      setIsLoading(false)
      router.push("/configure-supabase")
      return false
    }
    return true
  }, [router])

  useEffect(() => {
    if (!checkSupabaseConfig()) {
      return
    }
  }, [checkSupabaseConfig])

  const fetchUserProfile = async (authUser: User): Promise<void> => {
    try {
      console.log("[v0] Fetching user profile for:", authUser.email)

      // Check if we're using mock client (Supabase not configured)
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

      if (!url || !key) {
        console.log("[v0] Supabase not configured, using auth user data only")
        setUser(authUser as AuthUser)
        setIsLoading(false)
        return
      }

      const { data: userData, error } = await supabase.from("users").select("*").eq("id", authUser.id).maybeSingle()

      if (error) {
        console.log("[v0] Error fetching user profile:", error.message)
        setUser(authUser as AuthUser)
      } else if (userData) {
        console.log("[v0] User profile loaded successfully")
        setUser({ ...authUser, ...userData })
      } else {
        console.log("[v0] No user profile found in database, using auth user data only")
        setUser(authUser as AuthUser)
      }
    } catch (error: any) {
      console.log("[v0] Profile fetch error:", error?.message || error)
      setUser(authUser as AuthUser)
    } finally {
      setIsLoading(false)
    }
  }

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }

    if (user) {
      inactivityTimer.current = setTimeout(() => {
        console.log("[v0] Auto logout due to 30 minutes of inactivity")
        logout()
      }, INACTIVITY_TIMEOUT)
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    const handleActivity = () => {
      resetInactivityTimer()
    }

    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, true)
    })

    resetInactivityTimer()

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity, true)
      })
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
        inactivityTimer.current = null
      }
    }
  }, [user, resetInactivityTimer])

  useEffect(() => {
    const initializeAuth = async () => {
      if (isInitialized.current) return

      console.log("[v0] Initializing auth state...")
      isInitialized.current = true

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          console.log("[v0] Found existing session for:", session.user.email)
          await fetchUserProfile(session.user)
        } else {
          console.log("[v0] No existing session found")
          setIsLoading(false)
        }
      } catch (error) {
        console.log("[v0] Auth initialization error:", error)
        setIsLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state change:", event, session?.user?.email)

      if (event === "SIGNED_IN" && session?.user) {
        await fetchUserProfile(session.user)
      } else if (event === "SIGNED_OUT") {
        console.log("[v0] User signed out")
        setUser(null)
        setIsLoading(false)
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current)
          inactivityTimer.current = null
        }
      } else if (event === "INITIAL_SESSION" && !session) {
        console.log("[v0] Initial session check complete - no session found")
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Empty dependency array to prevent re-registration

  const login = async (email: string, password: string) => {
    console.log("[v0] Starting login process for email:", email)
    setIsLoading(true)

    // Check Supabase configuration
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!url || !key) {
      console.warn("[v0] Supabase not configured - missing environment variables")
      setIsLoading(false)
      router.push("/configure-supabase")
      throw new Error("Supabase not configured")
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (
          error.message?.includes("not configured") ||
          error.message?.includes("URL") ||
          error.message?.includes("Key")
        ) {
          console.warn("[v0] Login failed due to Supabase configuration issue")
          setIsLoading(false)
          router.push("/configure-supabase")
          throw new Error("Supabase not configured")
        }

        console.log("[v0] Login error:", error)
        setIsLoading(false)
        throw error
      }

      console.log("[v0] Login successful")
      // setIsLoading(false) será chamado automaticamente pelo fetchUserProfile
    } catch (error) {
      console.log("[v0] Login error caught:", error)
      setIsLoading(false)
      throw error
    }
  }

  const signup = async (userData: SignupData) => {
    console.log("[v0] Starting signup with metadata:", userData.metadata)

    if (!checkSupabaseConfig()) {
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/signup-success`,
          data: userData.metadata,
        },
      })

      if (authError) {
        console.log("[v0] Signup failed:", authError.message)
        throw authError
      }

      console.log("[v0] Signup successful, check email for confirmation")
    } catch (error: any) {
      console.log("[v0] Signup error:", error?.message)
      throw error
    }
  }

  const logout = async () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
      inactivityTimer.current = null
    }

    setUser(null)

    if (!checkSupabaseConfig()) {
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
