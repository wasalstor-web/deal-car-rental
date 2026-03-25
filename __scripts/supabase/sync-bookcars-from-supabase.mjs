#!/usr/bin/env node
/**
 * يقرأ supabase/docker/.env ويحدّث ملفات BookCars المحلية لتطابق JWT وANON وعنوان Kong.
 * Usage:
 *   node __scripts/supabase/sync-bookcars-from-supabase.mjs
 *   node __scripts/supabase/sync-bookcars-from-supabase.mjs --supabase-dir "C:\\path\\to\\supabase\\docker"
 *   node __scripts/supabase/sync-bookcars-from-supabase.mjs --bookcars-root "C:\\path\\to\\bookcars"
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadSupabaseEnv, defaultSupabaseDockerDir } from './parse-supabase-env.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseArgs() {
  const args = process.argv.slice(2)
  let supabaseDir = defaultSupabaseDockerDir()
  let bookcarsRoot = path.resolve(__dirname, '..', '..')
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--supabase-dir' && args[i + 1]) {
      supabaseDir = path.resolve(args[i + 1])
      i += 1
    } else if (args[i] === '--bookcars-root' && args[i + 1]) {
      bookcarsRoot = path.resolve(args[i + 1])
      i += 1
    }
  }
  return { supabaseDir, bookcarsRoot }
}

const SYNC_MARKER = '# — synced from supabase/docker/.env (sync-bookcars-from-supabase.mjs)'

function stripOldSyncFooter(content) {
  const idx = content.indexOf(SYNC_MARKER)
  if (idx === -1) return content
  return content.slice(0, idx).trimEnd() + '\n'
}

function upsertEnvLines(content, pairs) {
  const base = stripOldSyncFooter(content)
  const lines = base.split(/\r?\n/)
  const keys = new Set(Object.keys(pairs))
  const kept = lines.filter((line) => {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(line.trim())
    return !(m && keys.has(m[1]))
  })
  const block = [
    '',
    SYNC_MARKER,
    ...Object.entries(pairs).map(([k, v]) => `${k}=${v}`),
  ]
  return [...kept, ...block].join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

/** Android emulator reaches host via 10.0.2.2 */
function emulatorSupabaseUrl(publicUrl) {
  try {
    const u = new URL(publicUrl.trim())
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      u.hostname = '10.0.2.2'
    }
    return u.toString().replace(/\/$/, '')
  } catch {
    return publicUrl
  }
}

async function main() {
  const { supabaseDir, bookcarsRoot } = parseArgs()
  const { envPath, env } = await loadSupabaseEnv(supabaseDir)

  const jwt = env.JWT_SECRET
  const anon = env.ANON_KEY
  const pub = env.SUPABASE_PUBLIC_URL

  if (!jwt || !anon || !pub) {
    throw new Error(
      `Missing JWT_SECRET, ANON_KEY, or SUPABASE_PUBLIC_URL in:\n  ${envPath}`,
    )
  }

  const paths = {
    backend: path.join(bookcarsRoot, 'backend', '.env.docker'),
    frontend: path.join(bookcarsRoot, 'frontend', '.env.docker'),
    mobile: path.join(bookcarsRoot, 'mobile', '.env'),
  }

  for (const p of Object.values(paths)) {
    try {
      await fs.access(p)
    } catch {
      throw new Error(`BookCars env file missing (create from *.example):\n  ${p}`)
    }
  }

  const be = await fs.readFile(paths.backend, 'utf8')
  await fs.writeFile(
    paths.backend,
    upsertEnvLines(be, { BC_SUPABASE_JWT_SECRET: jwt }),
    'utf8',
  )

  const fe = await fs.readFile(paths.frontend, 'utf8')
  await fs.writeFile(
    paths.frontend,
    upsertEnvLines(fe, {
      VITE_BC_SUPABASE_URL: pub.replace(/\/$/, ''),
      VITE_BC_SUPABASE_ANON_KEY: anon,
    }),
    'utf8',
  )

  const mob = await fs.readFile(paths.mobile, 'utf8')
  await fs.writeFile(
    paths.mobile,
    upsertEnvLines(mob, {
      BC_SUPABASE_URL: emulatorSupabaseUrl(pub),
      BC_SUPABASE_ANON_KEY: anon,
    }),
    'utf8',
  )

  console.log('[bookcars] Synced from Supabase docker .env:')
  console.log(`  ${envPath}`)
  console.log(`  → ${paths.backend} (BC_SUPABASE_JWT_SECRET)`)
  console.log(`  → ${paths.frontend} (VITE_BC_SUPABASE_*)`)
  console.log(`  → ${paths.mobile} (BC_SUPABASE_* ; emulator URL from SUPABASE_PUBLIC_URL)`)
  console.log('')
  console.log('Next: restart backend if running: docker compose restart bc-backend')
  console.log('      rebuild web if Docker: docker compose build bc-frontend && docker compose up -d bc-frontend')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
