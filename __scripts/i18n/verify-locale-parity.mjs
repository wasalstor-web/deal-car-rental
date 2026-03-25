#!/usr/bin/env node
/**
 * Verify every frontend/src/lang and admin/src/lang *.ts file has matching
 * property key order between `en` and `ar` blocks (same structure for apply-ar).
 *
 * Usage: node __scripts/i18n/verify-locale-parity.mjs
 * Or:    npm run i18n:verify
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractLocaleInner } from './lib/skip-literals.mjs'
import { parseLocaleProps } from './lib/parse-locale-props.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')

const LANG_DIRS = [
  path.join(ROOT, 'frontend', 'src', 'lang'),
  path.join(ROOT, 'admin', 'src', 'lang'),
]

function toPosix(p) {
  return p.split(path.sep).join('/')
}

function keyList(inner) {
  return parseLocaleProps(inner).map((p) => p.key)
}

let errors = 0

for (const dir of LANG_DIRS) {
  if (!fs.existsSync(dir)) continue
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.ts')) continue
    const filePath = path.join(dir, name)
    const relFile = toPosix(path.relative(ROOT, filePath))
    const text = fs.readFileSync(filePath, 'utf8')
    const enInner = extractLocaleInner(text, 'en')
    if (!enInner) continue
    const arInner = extractLocaleInner(text, 'ar')
    if (!arInner) {
      console.error(`MISSING ar block: ${relFile}`)
      errors++
      continue
    }
    let enKeys
    let arKeys
    try {
      enKeys = keyList(enInner)
    } catch (e) {
      console.error(`PARSE en failed ${relFile}:`, e.message)
      errors++
      continue
    }
    try {
      arKeys = keyList(arInner)
    } catch (e) {
      console.error(`PARSE ar failed ${relFile}:`, e.message)
      errors++
      continue
    }
    if (enKeys.length !== arKeys.length || enKeys.some((k, i) => k !== arKeys[i])) {
      console.error(`KEY MISMATCH: ${relFile}`)
      console.error(`  en (${enKeys.length}):`, enKeys.join(', '))
      console.error(`  ar (${arKeys.length}):`, arKeys.join(', '))
      errors++
    }
  }
}

if (errors > 0) {
  console.error(`\nverify-locale-parity: ${errors} issue(s)`)
  process.exit(1)
}
console.log('verify-locale-parity: OK (en/ar key lists match in all lang files with an en block)')
