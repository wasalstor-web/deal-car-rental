#!/usr/bin/env node
/**
 * Apply locales/bookcars-ar.json onto admin/src/lang/*.ts and frontend/src/lang/*.ts
 * by rebuilding each `ar: { ... }` block from the English structure + Arabic strings.
 *
 * Prerequisite: run export-en.mjs, copy bookcars-en.json to bookcars-ar.json,
 * translate values (or use MT), then run this script.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractLocaleInner, extractLocaleRegion, skipBraceExpression } from './lib/skip-literals.mjs'
import { parseLocaleProps } from './lib/parse-locale-props.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')
const AR_FILE = path.join(ROOT, 'locales', 'bookcars-ar.json')

const LANG_DIRS = [
  path.join(ROOT, 'frontend', 'src', 'lang'),
  path.join(ROOT, 'admin', 'src', 'lang'),
]

function toPosix(p) {
  return p.split(path.sep).join('/')
}

function escapeSingleQuoted(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

/**
 * Encode template body for embedding inside a generated outer `...` literal.
 * Escapes only static (non-${}) spans; copies each ${...} verbatim so nested
 * template literals inside expressions stay valid.
 */
function escapeOuterTemplateBody(decoded) {
  let out = ''
  let i = 0
  while (i < decoded.length) {
    if (decoded[i] === '$' && decoded[i + 1] === '{') {
      const end = skipBraceExpression(decoded, i + 2)
      out += decoded.slice(i, end)
      i = end
      continue
    }
    const c = decoded[i]
    if (c === '\\') {
      out += '\\\\'
      i++
      if (i < decoded.length) {
        out += decoded[i]
        i++
      }
      continue
    }
    if (c === '`') {
      out += '\\`'
      i++
      continue
    }
    out += c
    i++
  }
  return out
}

function formatValue(decoded, isTemplate) {
  if (isTemplate) return `\`${escapeOuterTemplateBody(decoded)}\``
  return `'${escapeSingleQuoted(decoded)}'`
}

function buildArInner(enProps, relFile, arMap) {
  const lines = []
  for (const p of enProps) {
    if (p.ref) {
      lines.push(`    ${p.key},`)
      continue
    }
    if (p.expr) {
      lines.push(`    ${p.key}: ${p.raw},`)
      continue
    }
    const ck = `${relFile}::${p.key}`
    let value = arMap[ck]
    if (value === undefined || value === null) {
      value = p.decoded
    }
    if (p.isTemplate) {
      if (String(value) === p.decoded) {
        lines.push(`    ${p.key}: ${p.raw},`)
      } else {
        lines.push(`    ${p.key}: ${formatValue(String(value), true)},`)
      }
      continue
    }
    const tmpl = typeof value === 'string' && value.includes('${')
    lines.push(`    ${p.key}: ${formatValue(String(value), tmpl)},`)
  }
  return `\n${lines.join('\n')}\n`
}

if (!fs.existsSync(AR_FILE)) {
  console.error(`Missing ${path.relative(ROOT, AR_FILE)} — copy bookcars-en.json and translate, or run export first.`)
  process.exit(1)
}

const arMap = JSON.parse(fs.readFileSync(AR_FILE, 'utf8'))
let updated = 0

for (const dir of LANG_DIRS) {
  if (!fs.existsSync(dir)) continue
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.ts')) continue
    const filePath = path.join(dir, name)
    const relFile = toPosix(path.relative(ROOT, filePath))
    let text = fs.readFileSync(filePath, 'utf8')
    const enInner = extractLocaleInner(text, 'en')
    if (!enInner) continue
    let enProps
    try {
      enProps = parseLocaleProps(enInner)
    } catch {
      continue
    }
    const innerAr = buildArInner(enProps, relFile, arMap)
    const region = extractLocaleRegion(text, 'ar')
    if (!region) {
      console.warn(`No ar block: ${relFile}`)
      continue
    }
    const marker = '  ar: {'
    const next = text.slice(0, region.start) + marker + innerAr + '\n  },' + text.slice(region.end)
    fs.writeFileSync(filePath, next, 'utf8')
    updated++
  }
}

console.log(`Updated ${updated} lang files from bookcars-ar.json`)
