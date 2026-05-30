import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigError =
  !supabaseUrl || !supabasePublishableKey
    ? 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your .env.local file.'
    : ''

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabasePublishableKey)
