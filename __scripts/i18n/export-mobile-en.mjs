#!/usr/bin/env node
/**
 * Export English strings from mobile/lang/en.ts to locales/mobile-en.json
 * (flat keys: "mobile/lang/en.ts::KEY"). Optional path for MT / review; keep
 * mobile/lang/ar.ts in sync manually or via your own workflow.
 *
 * Usage: npm run i18n:export-mobile
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractExportConstObjectInner } from './lib/skip-literals.mjs'
import { parseLocaleProps } from './lib/parse-locale-props.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')
const LANG_FILE = path.join(ROOT, 'mobile', 'lang', 'en.ts')
const OUT_DIR = path.join(ROOT, 'locales')
const OUT_FILE = path.join(OUT_DIR, 'mobile-en.json')
const REL_FILE = 'mobile/lang/en.ts'

function collect() {
  if (!fs.existsSync(LANG_FILE)) {
    console.warn(`skip (missing): ${REL_FILE}`)
    return {}
  }
  const text = fs.readFileSync(LANG_FILE, 'utf8')
  const inner = extractExportConstObjectInner(text, 'en')
  if (!inner) {
    console.warn(`skip (no export const en block): ${REL_FILE}`)
    return {}
  }
  let props
  try {
    props = parseLocaleProps(inner)
  } catch (e) {
    console.error(`parse failed ${REL_FILE}:`, e.message)
    return {}
  }
  /** @type {Record<string, string>} */
  const flat = {}
  for (const p of props) {
    if (p.ref || p.expr) continue
    flat[`${REL_FILE}::${p.key}`] = p.decoded
  }
  return flat
}

fs.mkdirSync(OUT_DIR, { recursive: true })
const data = collect()
const sorted = Object.keys(data)
  .sort()
  .reduce((o, k) => {
    o[k] = data[k]
    return o
  }, {})

fs.writeFileSync(OUT_FILE, JSON.stringify(sorted, null, 2), 'utf8')
console.log(`Wrote ${Object.keys(sorted).length} keys to ${path.relative(ROOT, OUT_FILE)}`)
