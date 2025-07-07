'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('AuthCallback: Starting authentication process...')
      
      try {
        // Handle the magic link callback
        const { data, error } = await supabase.auth.getSession()
        
        console.log('AuthCallback: Session check result:', { 
          hasSession: !!data.session, 
          error: error?.message 
        })
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/login?error=auth_failed')
          return
        }

        if (data.session) {
          console.log('AuthCallback: Successfully authenticated, redirecting to dashboard')
          router.push('/dashboard')
        } else {
          console.log('AuthCallback: No session found, redirecting to login')
          router.push('/login')
        }
      } catch (err) {
        console.error('AuthCallback: Unexpected error:', err)
        router.push('/login?error=auth_failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Processing authentication...</h2>
        <p className="text-gray-600">Please wait while we sign you in.</p>
        <p className="text-sm text-gray-500 mt-2">Check the console for debugging info.</p>
      </div>
    </div>
  )
} 