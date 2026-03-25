/**
 * Shared helpers for supabase/docker/.env — used by sync / seed / verify scripts.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { homedir } from 'node:os'

export function defaultSupabaseDockerDir() {
  return path.join(homedir(), 'supabase', 'docker')
}

export function parseEnv(text) {
  const out = {}
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    let v = t.slice(eq + 1)
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    out[k] = v
  }
  return out
}

export async function loadSupabaseEnv(dockerDir) {
  const envPath = path.join(dockerDir, '.env')
  const raw = await fs.readFile(envPath, 'utf8')
  return { envPath, env: parseEnv(raw) }
}
