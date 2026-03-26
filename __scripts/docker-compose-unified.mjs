#!/usr/bin/env node
/**
 * BookCars + Supabase في مشروع compose واحد (-p bookcars، ملفان).
 * إن لم يوجد supabase/docker/docker-compose.yml يشغّل clone-official-docker أولاً.
 *
 * Usage (من جذر المستودع عبر npm):
 *   node __scripts/docker-compose-unified.mjs up -d --build
 *   node __scripts/docker-compose-unified.mjs --profile devtools up -d --build
 *   node __scripts/docker-compose-unified.mjs down
 *
 * عند `up -d`: إن فشل التشغيل أو بقي Kong في حالة created (تأخر analytics/studio)،
 * ننتظر ثم نعيد `up -d` مرة واحدة — انظر `compose-kong-retry.mjs`.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runComposeWithOptionalKongRetry } from './compose-kong-retry.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bookcarsRoot = path.resolve(__dirname, '..')
const supabaseCompose = path.join(bookcarsRoot, 'supabase', 'docker', 'docker-compose.yml')
const cloneScript = path.join(__dirname, 'supabase', 'clone-official-docker.mjs')

const PROJECT = 'bookcars'
/** من جذر المستودع: متغيرات الاستبدال لملف Supabase لا تُحمّل من supabase/docker/.env إلا بهذا */
const ENV_FILE = 'supabase/docker/.env'
const FILES = [
  '-f',
  'docker-compose.yml',
  '-f',
  'supabase/docker/docker-compose.yml',
  '-f',
  'infra/docker-compose.supabase-bookcars.override.yml',
]

function ensureSupabaseDocker() {
  if (fs.existsSync(supabaseCompose)) return
  console.log(
    '[docker-unified] لا يوجد supabase/docker — جاري npm run supabase:clone-docker (مرة واحدة)…',
  )
  const r = spawnSync(process.execPath, [cloneScript], {
    cwd: bookcarsRoot,
    stdio: 'inherit',
    env: process.env,
  })
  if (r.error) throw r.error
  if (r.status !== 0) process.exit(r.status ?? 1)
  if (!fs.existsSync(supabaseCompose)) {
    console.error('[docker-unified] فشل: لم يُنشأ', supabaseCompose)
    process.exit(1)
  }
}

function runCompose(passThrough) {
  return spawnSync(
    'docker',
    ['compose', '-p', PROJECT, '--env-file', ENV_FILE, ...FILES, ...passThrough],
    {
      cwd: bookcarsRoot,
      stdio: 'inherit',
      env: process.env,
      shell: process.platform === 'win32',
    },
  )
}

async function main() {
  const passThrough = process.argv.slice(2)
  ensureSupabaseDocker()
  const { r, spawnError } = await runComposeWithOptionalKongRetry({
    bookcarsRoot,
    passThrough,
    logPrefix: '[docker-unified]',
    runCompose: () => runCompose(passThrough),
  })
  if (spawnError) {
    console.error('[docker-unified] docker فشل:', spawnError.message)
    process.exit(1)
  }
  process.exit(r.status ?? 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
