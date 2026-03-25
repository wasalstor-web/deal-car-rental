#!/usr/bin/env node
/**
 * ينشئ مستخدمًا في GoTrue (Supabase Auth) عبر واجهة Kong — مفيد للتجربة المحلية.
 * يتطلب ENABLE_EMAIL_AUTOCONFIRM=true (أو SMTP) في supabase/docker/.env.
 *
 * Usage:
 *   npm run supabase:seed-user
 *   node __scripts/supabase/seed-local-auth-user.mjs --email you@example.com --password 'Str0ng!pass'
 *   node __scripts/supabase/seed-local-auth-user.mjs --supabase-dir "C:\\path\\to\\supabase\\docker"
 */
import path from 'node:path'
import { loadSupabaseEnv, defaultSupabaseDockerDir } from './parse-supabase-env.mjs'

const DEFAULT_EMAIL = 'dev@bookcars.local'
const DEFAULT_PASSWORD = 'BookcarsLocalDev1!'

function parseArgs() {
  const args = process.argv.slice(2)
  let supabaseDir = defaultSupabaseDockerDir()
  let email = DEFAULT_EMAIL
  let password = DEFAULT_PASSWORD
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--supabase-dir' && args[i + 1]) {
      supabaseDir = path.resolve(args[i + 1])
      i += 1
    } else if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1]
      i += 1
    } else if (args[i] === '--password' && args[i + 1]) {
      password = args[i + 1]
      i += 1
    }
  }
  return { supabaseDir, email, password }
}

async function main() {
  const { supabaseDir, email, password } = parseArgs()
  const { envPath, env } = await loadSupabaseEnv(supabaseDir)
  const base = env.SUPABASE_PUBLIC_URL?.replace(/\/$/, '')
  const anon = env.ANON_KEY
  if (!base || !anon) {
    throw new Error(`Missing SUPABASE_PUBLIC_URL or ANON_KEY in:\n  ${envPath}`)
  }

  const url = `${base}/auth/v1/signup`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify({ email, password }),
  })

  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = { raw: text }
  }

  if (res.ok) {
    console.log(`[supabase] User created (or session returned):\n  ${email}`)
    console.log(`  Sign in from BookCars web/mobile with this email/password.`)
    return
  }

  const msg = body.msg || body.message || body.error_description || text
  const already =
    typeof msg === 'string' &&
    (msg.includes('already registered') ||
      msg.includes('already been registered') ||
      msg.includes('User already registered'))
  if ((res.status === 400 || res.status === 422) && already) {
    console.log(`[supabase] User already exists:\n  ${email}`)
    console.log('  Use the same password if you created it earlier, or reset via Studio / SQL.')
    return
  }

  console.error(`[supabase] Signup failed HTTP ${res.status}:`, msg)
  process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
