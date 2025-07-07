'use client'

import { useAuth } from '../context/AuthContext'

export default function SupabaseTest() {
  const { user, session, loading, signOut } = useAuth()

  if (loading) {
    return <div className="bg-gray-100 p-4 rounded-lg border">Loading...</div>
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg border">
      <h3 className="font-bold mb-2">🔐 AuthContext Test:</h3>
      <p>Session: {session ? 'Authenticated' : 'Not authenticated (expected)'}</p>
      <p>User: {user ? user.email : 'None'}</p>
      {session && (
        <button 
          onClick={signOut}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign Out (Clear Session)
        </button>
      )}
    </div>
  )
} 