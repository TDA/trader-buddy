import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vaknedbumrdikktgjqvm.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

if (!supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}) 