#!/usr/bin/env node
/**
 * بعد تعديل supabase/docker/.env: تحقق → مزامنة ملفات BookCars → إعادة تشغيل الحاويات.
 *
 * Usage (من جذر المستودع):
 *   npm run supabase:apply-docker
 *   node __scripts/supabase/apply-supabase-to-docker.mjs --supabase-dir "C:\\path\\to\\supabase\\docker"
 *   node __scripts/supabase/apply-supabase-to-docker.mjs --no-frontend-rebuild
 *   node __scripts/supabase/apply-supabase-to-docker.mjs --no-docker
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultBookcarsRoot = path.resolve(__dirname, '..', '..')

const COMPOSE_PROJECT = 'bookcars'

function unifiedComposePrefix(bookcarsRoot) {
  const supa = path.join(bookcarsRoot, 'supabase', 'docker', 'docker-compose.yml')
  if (!fs.existsSync(supa)) return []
  return [
    '-p',
    COMPOSE_PROJECT,
    '--env-file',
    'supabase/docker/.env',
    '-f',
    'docker-compose.yml',
    '-f',
    'supabase/docker/docker-compose.yml',
    '-f',
    'infra/docker-compose.supabase-bookcars.override.yml',
  ]
}

function parseArgs() {
  const args = process.argv.slice(2)
  let supabaseDir = null
  let bookcarsRoot = defaultBookcarsRoot
  let skipVerify = false
  let skipSync = false
  let noDocker = false
  let noFrontendRebuild = false
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i]
    if (a === '--supabase-dir' && args[i + 1]) {
      supabaseDir = path.resolve(args[i + 1])
      i += 1
    } else if (a === '--bookcars-root' && args[i + 1]) {
      bookcarsRoot = path.resolve(args[i + 1])
      i += 1
    } else if (a === '--skip-verify') {
      skipVerify = true
    } else if (a === '--skip-sync') {
      skipSync = true
    } else if (a === '--no-docker') {
      noDocker = true
    } else if (a === '--no-frontend-rebuild') {
      noFrontendRebuild = true
    }
  }
  return {
    supabaseDir,
    bookcarsRoot,
    skipVerify,
    skipSync,
    noDocker,
    noFrontendRebuild,
  }
}

function runNode(scriptName, argv, cwd) {
  const script = path.join(__dirname, scriptName)
  const r = spawnSync(process.execPath, [script, ...argv], {
    stdio: 'inherit',
    cwd,
    env: process.env,
  })
  if (r.error) throw r.error
  if (r.status !== 0) process.exit(r.status ?? 1)
}

function dockerCompose(bookcarsRoot, composeArgs) {
  const prefix = unifiedComposePrefix(bookcarsRoot)
  const r = spawnSync('docker', ['compose', ...prefix, ...composeArgs], {
    cwd: bookcarsRoot,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  })
  if (r.error) {
    console.error(
      '[apply] Docker failed — is Docker running? Tried: docker compose',
      composeArgs.join(' '),
    )
    throw r.error
  }
  if (r.status !== 0) process.exit(r.status ?? 1)
}

async function main() {
  const {
    supabaseDir,
    bookcarsRoot,
    skipVerify,
    skipSync,
    noDocker,
    noFrontendRebuild,
  } = parseArgs()

  const supaArgs = supabaseDir ? ['--supabase-dir', supabaseDir] : []
  const syncArgs = [...supaArgs, '--bookcars-root', bookcarsRoot]

  console.log('[apply] BookCars root:', bookcarsRoot)
  if (!skipVerify) {
    console.log('\n[apply] 1/3 verify Supabase gateway…')
    runNode('verify-supabase-local.mjs', supaArgs, bookcarsRoot)
  }
  if (!skipSync) {
    console.log('\n[apply] 2/3 sync .env.docker / mobile/.env …')
    runNode('sync-bookcars-from-supabase.mjs', syncArgs, bookcarsRoot)
  }
  if (noDocker) {
    console.log('\n[apply] --no-docker: skip container restarts.')
    return
  }
  console.log('\n[apply] 3/3 Docker: restart backend …')
  dockerCompose(bookcarsRoot, ['restart', 'bc-backend'])
  if (!noFrontendRebuild) {
    console.log('\n[apply] Docker: build + up bc-frontend (VITE_* baked in) …')
    dockerCompose(bookcarsRoot, ['build', 'bc-frontend'])
    dockerCompose(bookcarsRoot, ['up', '-d', 'bc-frontend'])
  } else {
    console.log(
      '\n[apply] --no-frontend-rebuild: restart bc-frontend (VITE_* يتطلب build إن تغيّرت).',
    )
    dockerCompose(bookcarsRoot, ['restart', 'bc-frontend'])
  }
  console.log('\n[apply] Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
