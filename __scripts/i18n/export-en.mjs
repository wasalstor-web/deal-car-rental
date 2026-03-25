#!/usr/bin/env node
/**
 * Export all English UI strings from frontend/src/lang and admin/src/lang
 * into locales/bookcars-en.json (flat keys: "relative/path.ts::KEY").
 *
 * Use this file with DeepL / Crowdin / manual translation, then run apply-ar.mjs
 * after saving translations to locales/bookcars-ar.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractLocaleInner } from './lib/skip-literals.mjs'
import { parseLocaleProps } from './lib/parse-locale-props.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')
const OUT_DIR = path.join(ROOT, 'locales')
const OUT_FILE = path.join(OUT_DIR, 'bookcars-en.json')

const LANG_DIRS = [
  path.join(ROOT, 'frontend', 'src', 'lang'),
  path.join(ROOT, 'admin', 'src', 'lang'),
]

function toPosix(p) {
  return p.split(path.sep).join('/')
}

function collect() {
  /** @type {Record<string, string>} */
  const flat = {}

  for (const dir of LANG_DIRS) {
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.ts')) continue
      const filePath = path.join(dir, name)
      const relFile = toPosix(path.relative(ROOT, filePath))
      const text = fs.readFileSync(filePath, 'utf8')
      const inner = extractLocaleInner(text, 'en')
      if (!inner) {
        console.warn(`skip (no en block): ${relFile}`)
        continue
      }
      let props
      try {
        props = parseLocaleProps(inner)
      } catch (e) {
        console.warn(`parse failed ${relFile}:`, e.message)
        continue
      }
      for (const p of props) {
        if (p.ref || p.expr) continue
        const ck = `${relFile}::${p.key}`
        flat[ck] = p.decoded
      }
    }
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
