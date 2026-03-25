#!/usr/bin/env node
/**
 * Verify mobile/lang/en.ts and mobile/lang/ar.ts have the same property key order.
 *
 * Usage: npm run i18n:verify-mobile
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractExportConstObjectInner } from './lib/skip-literals.mjs'
import { parseLocaleProps } from './lib/parse-locale-props.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')
const LANG_DIR = path.join(ROOT, 'mobile', 'lang')

function keyList(inner) {
  return parseLocaleProps(inner).map((p) => p.key)
}

let errors = 0
const pairs = [
  ['en.ts', 'en'],
  ['ar.ts', 'ar'],
]

const inners = {}
for (const [file, binding] of pairs) {
  const fp = path.join(LANG_DIR, file)
  if (!fs.existsSync(fp)) {
    console.error(`MISSING: ${fp}`)
    errors++
    continue
  }
  const text = fs.readFileSync(fp, 'utf8')
  const inner = extractExportConstObjectInner(text, binding)
  if (!inner) {
    console.error(`MISSING export const ${binding} block: mobile/lang/${file}`)
    errors++
    continue
  }
  inners[binding] = inner
}

if (errors > 0) {
  console.error(`\nverify-mobile-lang-parity: ${errors} issue(s)`)
  process.exit(1)
}

let enKeys
let arKeys
try {
  enKeys = keyList(inners.en)
} catch (e) {
  console.error('PARSE en failed:', e.message)
  process.exit(1)
}
try {
  arKeys = keyList(inners.ar)
} catch (e) {
  console.error('PARSE ar failed:', e.message)
  process.exit(1)
}

if (enKeys.length !== arKeys.length || enKeys.some((k, i) => k !== arKeys[i])) {
  console.error('KEY MISMATCH: mobile/lang en vs ar')
  console.error(`  en (${enKeys.length}):`, enKeys.join(', '))
  console.error(`  ar (${arKeys.length}):`, arKeys.join(', '))
  process.exit(1)
}

console.log('verify-mobile-lang-parity: OK (en/ar key lists match in mobile/lang)')
