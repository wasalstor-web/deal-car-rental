import { createClient, SupabaseClient } from '@supabase/supabase-js'
import env from '@/config/env.config'

let client: SupabaseClient | null = null

/**
 * Supabase browser client (anon key). Only when URL + anon key are set.
 */
export const getSupabaseBrowserClient = (): SupabaseClient | null => {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
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
