#!/usr/bin/env node
/**
 * BookCars + Supabase في مشروع compose واحد (-p bookcars، ملفان).
 * إن لم يوجد supabase/docker/docker-compose.yml يشغّل clone-official-docker أولاً.
 *
 * Usage (من جذر المستودع عبر npm):
 *   node __scripts/docker-compose-unified.mjs up -d --build
 *   node __scripts/docker-compose-unified.mjs --profile devtools up -d --build
 *   node __scripts/docker-compose-unified.mjs down
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

function main() {
  const passThrough = process.argv.slice(2)
  ensureSupabaseDocker()
  const args = ['compose', '-p', PROJECT, '--env-file', ENV_FILE, ...FILES, ...passThrough]
  const r = spawnSync('docker', args, {
    cwd: bookcarsRoot,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  })
  if (r.error) {
    console.error('[docker-unified] docker فشل:', r.error.message)
    process.exit(1)
  }
  process.exit(r.status ?? 0)
}

main()
