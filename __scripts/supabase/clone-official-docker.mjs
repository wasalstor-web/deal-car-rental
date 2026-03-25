#!/usr/bin/env node
/**
 * يحمّل مجلد Docker الرسمي لـ Supabase داخل المستودع: supabase/docker/
 * ثم يحدّث supabase/docker/.env ليتوافق مع منافذ BookCars (merge-gotrue + fragment).
 *
 * يتطلب: git في PATH
 *
 * Usage (من جذر المستودع):
 *   npm run supabase:clone-docker
 *   node __scripts/supabase/clone-official-docker.mjs --force
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bookcarsRoot = path.resolve(__dirname, '..', '..')
const destDocker = path.join(bookcarsRoot, 'supabase', 'docker')

function parseArgs() {
  const force = process.argv.includes('--force')
  return { force }
}

async function main() {
  const { force } = parseArgs()
  const compose = path.join(destDocker, 'docker-compose.yml')
  if (fs.existsSync(compose) && !force) {
    console.log(
      '[supabase:clone] supabase/docker موجود بالفعل. للاستبدال: npm run supabase:clone-docker -- --force',
    )
    return
  }

  const tmp = path.join(os.tmpdir(), `supabase-upstream-${Date.now()}`)
  console.log('[supabase:clone] git clone (depth 1) …')
  const clone = spawnSync(
    'git',
    ['clone', '--depth', '1', 'https://github.com/supabase/supabase.git', tmp],
    { stdio: 'inherit', cwd: bookcarsRoot },
  )
  if (clone.error) throw clone.error
  if (clone.status !== 0) process.exit(clone.status ?? 1)

  const srcDocker = path.join(tmp, 'docker')
  if (!fs.existsSync(path.join(srcDocker, 'docker-compose.yml'))) {
    await fsPromises.rm(tmp, { recursive: true, force: true })
    throw new Error(`Missing docker-compose in clone: ${srcDocker}`)
  }

  await fsPromises.rm(destDocker, { recursive: true, force: true })
  await fsPromises.mkdir(path.join(bookcarsRoot, 'supabase'), { recursive: true })
  await fsPromises.cp(srcDocker, destDocker, { recursive: true })
  await fsPromises.rm(tmp, { recursive: true, force: true })
  console.log('[supabase:clone] copied →', destDocker)

  const envFile = path.join(destDocker, '.env')
  const envExample = path.join(destDocker, '.env.example')
  if (!fs.existsSync(envFile) && fs.existsSync(envExample)) {
    await fsPromises.copyFile(envExample, envFile)
    console.log('[supabase:clone] created .env from .env.example')
  }

  const mergeScript = path.join(__dirname, 'merge-gotrue-bookcars.mjs')
  console.log('[supabase:clone] merge BookCars ports + GoTrue + LF fixes …')
  const merge = spawnSync(process.execPath, [mergeScript, '--dir', destDocker, '--fix-kong-lf'], {
    stdio: 'inherit',
    cwd: bookcarsRoot,
    env: process.env,
  })
  if (merge.status !== 0) process.exit(merge.status ?? 1)

  console.log(`
[supabase:clone] تم.

الخطوات التالية (من جذر المستودع):
  1) انسخ env إن لزم: backend/.env.docker.example → backend/.env.docker و frontend/.env.docker.example → frontend/.env.docker
  2) npm run supabase:sync-bookcars
  3) npm run docker:up:supabase

Kong محلياً: http://localhost:8010 (راجع infra/supabase-bookcars-stack.fragment.env)
`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
