/**
 * إعادة محاولة `docker compose up -d` عند فشل أول تشغيل أو بقاء Kong في `created`
 * (سلسلة depends: analytics → studio → kong في compose الرسمي).
 */
import { spawnSync } from 'node:child_process'

/** يطابق `container_name` في infra/docker-compose.supabase-bookcars.override.yml */
export const KONG_CONTAINER_BOOKCARS = 'bookcars-supabase-kong'
export const UP_DETACHED_RETRY_MS = 15_000

export function wantsUpDetached(argv) {
  return argv.includes('up') && argv.includes('-d')
}

export function kongContainerStatus(containerName, bookcarsRoot) {
  const out = spawnSync(
    'docker',
    ['inspect', '-f', '{{.State.Status}}', containerName],
    {
      cwd: bookcarsRoot,
      encoding: 'utf8',
      env: process.env,
      shell: process.platform === 'win32',
    },
  )
  if (out.error || out.status !== 0) return null
  return out.stdout.trim()
}

/**
 * @param {object} p
 * @param {string} p.bookcarsRoot
 * @param {string[]} p.passThrough
 * @param {() => import('node:child_process').SpawnSyncReturns} p.runCompose
 * @param {string} p.logPrefix
 */
export async function runComposeWithOptionalKongRetry(p) {
  const { bookcarsRoot, passThrough, runCompose, logPrefix } = p
  let r = runCompose()
  if (r.error) {
    return { r, spawnError: r.error }
  }
  if (wantsUpDetached(passThrough)) {
    const kongSt = kongContainerStatus(KONG_CONTAINER_BOOKCARS, bookcarsRoot)
    const needsRetry = r.status !== 0 || kongSt === 'created'
    if (needsRetry) {
      console.log(
        `${logPrefix} إعادة محاولة up -d بعد ${UP_DETACHED_RETRY_MS / 1000}s (Kong/analytics/studio)…`,
      )
      await new Promise((resolve) => setTimeout(resolve, UP_DETACHED_RETRY_MS))
      r = runCompose()
      if (r.error) {
        return { r, spawnError: r.error }
      }
    }
  }
  return { r, spawnError: null }
}
