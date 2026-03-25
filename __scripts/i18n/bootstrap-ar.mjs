#!/usr/bin/env node
/**
 * Create locales/bookcars-ar.json from bookcars-en.json if missing (or with --force).
 * Edit Arabic values, then run apply-ar.mjs.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')
const EN = path.join(ROOT, 'locales', 'bookcars-en.json')
const AR = path.join(ROOT, 'locales', 'bookcars-ar.json')
const force = process.argv.includes('--force')

if (!fs.existsSync(EN)) {
  console.error('Run npm run i18n:export first.')
  process.exit(1)
}
if (fs.existsSync(AR) && !force) {
  console.log('bookcars-ar.json already exists. Use --force to overwrite.')
  process.exit(0)
}
fs.mkdirSync(path.dirname(AR), { recursive: true })
fs.copyFileSync(EN, AR)
console.log(`Created ${path.relative(ROOT, AR)} (copy of English). Translate values, then run i18n:apply-ar.`)
