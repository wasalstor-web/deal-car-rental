#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseEnv } from "./supabase/parse-supabase-env.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bookcarsRoot = path.resolve(__dirname, "..")
const hostingerEnv = path.join(bookcarsRoot, "deploy", "hostinger", ".env")
const secretsEnv = path.join(bookcarsRoot, "deploy", "hostinger", "secrets", "backend.env")
const supabaseEnv = path.join(bookcarsRoot, "supabase", "docker", ".env")
const supabaseCompose = path.join(bookcarsRoot, "supabase", "docker", "docker-compose.yml")
const cloneScript = path.join(__dirname, "supabase", "clone-official-docker.mjs")

const FILES = ["-f", "docker-compose.yml", "-f", "supabase/docker/docker-compose.yml", "-f", "infra/docker-compose.supabase-bookcars.override.yml", "-f", "deploy/hostinger/docker-compose.traefik-overlay.yml"]

function ensureSupabaseDocker() {
  if (fs.existsSync(supabaseCompose)) return
  console.log("[hostinger] cloning supabase/docker …")
  const r = spawnSync(process.execPath, [cloneScript], { cwd: bookcarsRoot, stdio: "inherit", env: process.env })
  if (r.error) throw r.error
  if (r.status !== 0) process.exit(r.status ?? 1)
}

function readProjectName() {
  if (!fs.existsSync(hostingerEnv)) {
    console.error("[hostinger] missing", hostingerEnv)
    process.exit(1)
  }
  if (!fs.existsSync(secretsEnv)) {
    console.error("[hostinger] missing", secretsEnv)
    process.exit(1)
  }
  if (!fs.existsSync(supabaseEnv)) {
    console.error("[hostinger] missing supabase/docker/.env")
    process.exit(1)
  }
  const env = parseEnv(fs.readFileSync(hostingerEnv, "utf8"))
  const p = env.COMPOSE_PROJECT_NAME
  if (!p || !String(p).trim()) {
    console.error("[hostinger] set COMPOSE_PROJECT_NAME in deploy/hostinger/.env")
    process.exit(1)
  }
  return String(p).trim()
}

/** فشل مبكراً عند `up` إن واجهة الواجهة الأمامية تُبنى بدون Supabase عام */
function validateHostingerEnvForComposeUp(passThrough) {
  const wantsUp = passThrough.some((a) => a === "up")
  if (!wantsUp) return
  const env = parseEnv(fs.readFileSync(hostingerEnv, "utf8"))
  const pub = String(env.SUPABASE_PUBLIC_URL ?? "").trim()
  const anon = String(env.SUPABASE_ANON_KEY ?? "").trim()
  const fqdn = String(env.SUPABASE_FQDN ?? "").trim()
  if (!pub) {
    console.error("[hostinger] set SUPABASE_PUBLIC_URL in deploy/hostinger/.env (e.g. https://<SUPABASE_FQDN>)")
    process.exit(1)
  }
  if (!anon) {
    console.error("[hostinger] set SUPABASE_ANON_KEY (copy ANON_KEY from supabase/docker/.env)")
    process.exit(1)
  }
  if (!fqdn) {
    console.error("[hostinger] set SUPABASE_FQDN for Kong Traefik router (hostname only, no scheme)")
    process.exit(1)
  }
}

const passThrough = process.argv.slice(2)
ensureSupabaseDocker()
const project = readProjectName()
validateHostingerEnvForComposeUp(passThrough)
const args = ["compose", "-p", project, "--env-file", "supabase/docker/.env", "--env-file", "deploy/hostinger/.env", ...FILES, ...passThrough]
console.log("[hostinger] docker", args.join(" "))
const r = spawnSync("docker", args, { cwd: bookcarsRoot, stdio: "inherit", env: process.env, shell: process.platform === "win32" })
if (r.error) {
  console.error("[hostinger]", r.error.message)
  process.exit(1)
}
process.exit(r.status ?? 0)
