import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as env from '@/config/env.config'

let client: SupabaseClient | null = null

export const getSupabaseMobileClient = (): SupabaseClient | null => {
  if (!env.SUPABASE_AUTH_ENABLED) {
    return null
  }
  if (!client) {
    client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return client
}
