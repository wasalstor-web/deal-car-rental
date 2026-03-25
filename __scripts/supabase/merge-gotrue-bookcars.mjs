#!/usr/bin/env node
/**
 * يحدّث supabase/docker/.env ليتوافق مع واجهة BookCars على المنفذ 13080.
 * على Windows: يمكن تطبيع أسطر LF لملف kong-entrypoint.sh (يمنع فشل Kong بسبب CRLF).
 * Usage:
 *   node __scripts/supabase/merge-gotrue-bookcars.mjs
 *   node __scripts/supabase/merge-gotrue-bookcars.mjs --dir "C:\\path\\to\\supabase\\docker"
 *   node __scripts/supabase/merge-gotrue-bookcars.mjs --fix-kong-lf   # فرض تطبيع LF (kong + pooler.exs على Windows)
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { homedir } from 'node:os'

const BOOKCARS_SITE = 'http://localhost:13080'
const KEYS = {
  SITE_URL: BOOKCARS_SITE,
  ADDITIONAL_REDIRECT_URLS: BOOKCARS_SITE,
}

function parseArgs() {
  const args = process.argv.slice(2)
  let dir = path.join(homedir(), 'supabase', 'docker')
  let fixKongLf = args.includes('--fix-kong-lf')
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--dir' && args[i + 1]) {
      dir = path.resolve(args[i + 1])
      i += 1
    }
  }
  return { dir, fixKongLf }
}

/** Kong entrypoint must be LF-only inside the Linux container; CRLF breaks shebang execution. */
async function normalizeKongEntrypointLf(dockerDir) {
  const shPath = path.join(dockerDir, 'volumes', 'api', 'kong-entrypoint.sh')
  let raw
  try {
    raw = await fs.readFile(shPath)
  } catch (e) {
    if (e && e.code === 'ENOENT') {
      console.warn(`[supabase] kong-entrypoint.sh not found (skip LF fix):\n  ${shPath}`)
      return
    }
    throw e
  }
  if (!raw.includes(0x0d)) return
  const normalized = raw.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  await fs.writeFile(shPath, normalized, 'utf8')
  console.log(`[supabase] Normalized LF in kong-entrypoint.sh:\n  ${shPath}`)
}

/** Supavisor pooler reads pooler.exs as Elixir; CRLF causes SyntaxError in container. */
async function normalizePoolerExsLf(dockerDir) {
  const exsPath = path.join(dockerDir, 'volumes', 'pooler', 'pooler.exs')
  let raw
  try {
    raw = await fs.readFile(exsPath)
  } catch (e) {
    if (e && e.code === 'ENOENT') {
      console.warn(`[supabase] pooler.exs not found (skip LF fix):\n  ${exsPath}`)
      return
    }
    throw e
  }
  if (!raw.includes(0x0d)) return
  const normalized = raw.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  await fs.writeFile(exsPath, normalized, 'utf8')
  console.log(`[supabase] Normalized LF in pooler.exs:\n  ${exsPath}`)
}

function upsertEnvLines(content, pairs) {
  const lines = content.split(/\r?\n/)
  const keys = new Set(Object.keys(pairs))
  const kept = lines.filter((line) => {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(line.trim())
    return !(m && keys.has(m[1]))
  })
  const block = [
    '',
    '# BookCars (auto) — merged by merge-gotrue-bookcars.mjs',
    ...Object.entries(pairs).map(([k, v]) => `${k}=${v}`),
  ]
  return [...kept, ...block].join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

async function fetchOfficialEnvExample() {
  const url = 'https://raw.githubusercontent.com/supabase/supabase/master/docker/.env.example'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch .env.example: ${res.status}`)
  return res.text()
}

async function main() {
  const { dir, fixKongLf } = parseArgs()
  const envPath = path.join(dir, '.env')

  await fs.mkdir(dir, { recursive: true })

  let content
  try {
    content = await fs.readFile(envPath, 'utf8')
  } catch {
    console.log(`Creating ${envPath} from official Supabase .env.example …`)
    content = await fetchOfficialEnvExample()
    await fs.writeFile(envPath, content, 'utf8')
  }

  const next = upsertEnvLines(content, KEYS)
  await fs.writeFile(envPath, next, 'utf8')
  console.log(`Updated GoTrue-related keys in:\n  ${envPath}`)
  console.log(`  SITE_URL=${KEYS.SITE_URL}`)
  console.log(`  ADDITIONAL_REDIRECT_URLS=${KEYS.ADDITIONAL_REDIRECT_URLS}`)

  if (fixKongLf || process.platform === 'win32') {
    await normalizeKongEntrypointLf(dir)
    await normalizePoolerExsLf(dir)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
