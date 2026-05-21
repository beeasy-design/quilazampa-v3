import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [dogs, setDogs] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const ADMIN_EMAILS = ['pietroannella@gmail.com', 'ivanannella@gmail.com']

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setIsAdmin(ADMIN_EMAILS.includes(session.user.email))
        loadUserData(session.user.id)
      }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setIsAdmin(ADMIN_EMAILS.includes(session.user.email))
        loadUserData(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setDogs([])
        setIsAdmin(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (userId) => {
    const [{ data: prof }, { data: dogsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('dogs').select('*').eq('owner_id', userId)
    ])
    setProfile(prof)
    setDogs(dogsData || [])
  }

  const refreshDogs = async () => {
    if (!user) return
    const { data } = await supabase.from('dogs').select('*').eq('owner_id', user.id)
    setDogs(data || [])
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, dogs, isAdmin, loading, signOut, refreshDogs, loadUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
