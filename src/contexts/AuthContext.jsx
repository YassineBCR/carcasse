import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const loadProfile = async (userId) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
    if (error) {
      console.error(error)
      setProfile(null)
      return
    }
    setProfile(data ?? null)
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return
    }

    let alive = true

    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (!alive) return
        setSession(data.session ?? null)
        if (data.session?.user?.id) {
          await loadProfile(data.session.user.id)
        }
        setLoading(false)
      })
      .catch((error) => {
        console.error("Erreur de connexion Supabase:", error)
        setLoading(false) 
      })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession ?? null)
      if (currentSession?.user?.id) {
        await loadProfile(currentSession.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = async ({ email, password }) => {
    if (!supabase) throw new Error('Supabase non configure')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async ({ email, password, nom, prenom, telephone }) => {
    if (!supabase) throw new Error('Supabase non configure')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nom, prenom, telephone },
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile: () => (session?.user?.id ? loadProfile(session.user.id) : Promise.resolve()),
      isSupabaseConfigured,
    }),
    [session, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used in AuthProvider')
  return ctx
}