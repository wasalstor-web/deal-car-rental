#!/usr/bin/env node
/**
 * يتحقق سريعًا من أن Kong + GoTrue + PostgREST يستجيبان (محليًا).
 * Usage:
 *   npm run supabase:verify-local
 *   node __scripts/supabase/verify-supabase-local.mjs --supabase-dir "C:\\path\\to\\supabase\\docker"
 */
import path from 'node:path'
import { loadSupabaseEnv, defaultSupabaseDockerDir } from './parse-supabase-env.mjs'

function parseArgs() {
  const args = process.argv.slice(2)
  let supabaseDir = defaultSupabaseDockerDir()
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--supabase-dir' && args[i + 1]) {
      supabaseDir = path.resolve(args[i + 1])
      i += 1
    }
  }
  return { supabaseDir }
}

async function check(name, fn) {
  try {
    await fn()
    console.log(`  OK  ${name}`)
    return true
  } catch (e) {
    console.log(`  FAIL ${name}`)
    console.error(`       ${e.message || e}`)
    return false
  }
}

async function main() {
  const { supabaseDir } = parseArgs()
  const { envPath, env } = await loadSupabaseEnv(supabaseDir)
  const base = env.SUPABASE_PUBLIC_URL?.replace(/\/$/, '')
  const anon = env.ANON_KEY
  if (!base || !anon) {
    throw new Error(`Missing SUPABASE_PUBLIC_URL or ANON_KEY in:\n  ${envPath}`)
  }

  const headers = {
    apikey: anon,
    Authorization: `Bearer ${anon}`,
  }

  console.log(`[verify] Using SUPABASE_PUBLIC_URL from:\n  ${envPath}\n  ${base}\n`)

  const results = []
  results.push(
    await check('GoTrue /auth/v1/health', async () => {
      const r = await fetch(`${base}/auth/v1/health`, { headers })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
    }),
  )
  results.push(
    await check('PostgREST /rest/v1/', async () => {
      const r = await fetch(`${base}/rest/v1/`, { headers })
      if (r.status >= 500) throw new Error(`HTTP ${r.status}`)
    }),
  )

  const ok = results.every(Boolean)
  if (!ok) {
    console.log('\n[verify] Fix Kong ports / CRLF on kong-entrypoint / docker compose up -d')
    process.exit(1)
  }
  console.log('\n[verify] Supabase API gateway looks healthy.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
