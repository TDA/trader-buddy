'use client'

import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export default function SupabaseTest() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div className="bg-gray-100 p-4 rounded-lg border">Loading...</div>
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg border">
      <h3 className="font-bold mb-2">🔐 Supabase Client Test:</h3>
      <p>Session: {session ? 'Authenticated' : 'Not authenticated (expected)'}</p>
      {session && (
        <button 
          onClick={handleSignOut}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign Out (Clear Session)
        </button>
      )}
    </div>
  )
} 