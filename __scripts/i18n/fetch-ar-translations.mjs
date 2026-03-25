#!/usr/bin/env node
/**
 * Build locales/bookcars-ar.json from bookcars-en.json using Google
 * Translate (unofficial gtx client). Preserves ${...} via ⟦n⟧ placeholders.
 *
 * Usage: node __scripts/i18n/fetch-ar-translations.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')
const EN_PATH = path.join(ROOT, 'locales', 'bookcars-en.json')
const AR_PATH = path.join(ROOT, 'locales', 'bookcars-ar.json')

const DELAY_MS = Number(process.env.GT_DELAY_MS || 120)
const MAX_CHUNK = Number(process.env.GT_MAX_CHUNK || 3500)

/** @param {string} s */
function maskInterpolations(s) {
  const ph = []
  let out = ''
  let i = 0
  while (i < s.length) {
    if (s[i] === '$' && s[i + 1] === '{') {
      let depth = 1
      let j = i + 2
      while (j < s.length && depth > 0) {
        const c = s[j]
        if (c === '{') depth++
        else if (c === '}') depth--
        j++
      }
      ph.push(s.slice(i, j))
      out += `⟦${ph.length - 1}⟧`
      i = j
    } else {
      out += s[i]
      i++
    }
  }
  return { masked: out, ph }
}

/** @param {string} masked @param {string[]} ph */
function restoreInterpolations(masked, ph) {
  return masked.replace(/⟦(\d+)⟧/g, (_, n) => ph[Number.parseInt(n, 10)] ?? '')
}

/** @param {string} s */
function chunkText(s) {
  if (s.length <= MAX_CHUNK) return [s]
  const parts = []
  let buf = ''
  for (const line of s.split('\n')) {
    const add = buf ? `${buf}\n${line}` : line
    if (add.length > MAX_CHUNK) {
      if (buf) parts.push(buf)
      if (line.length > MAX_CHUNK) {
        for (let k = 0; k < line.length; k += MAX_CHUNK) {
          parts.push(line.slice(k, k + MAX_CHUNK))
        }
        buf = ''
      } else {
        buf = line
      }
    } else {
      buf = add
    }
  }
  if (buf) parts.push(buf)
  return parts
}

/**
 * @param {string} piece
 * @returns {Promise<string>}
 */
async function translateChunk(piece) {
  if (!piece) return ''
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(piece)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data?.[0])) throw new Error('Bad response shape')
  return data[0].map((x) => (Array.isArray(x) ? x[0] : '')).join('')
}

/**
 * @param {string} text
 * @returns {Promise<string>}
 */
async function translateLine(text) {
  const { masked, ph } = maskInterpolations(text)
  if (!masked.replace(/⟦\d+⟧/g, '').trim()) return text

  const chunks = chunkText(masked)
  const out = []
  for (const ch of chunks) {
    out.push(await translateChunk(ch))
    await sleep(DELAY_MS)
  }
  return restoreInterpolations(out.join('\n'), ph)
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'))
const keys = Object.keys(en).sort()
const ar = {}
let done = 0

console.log(`Translating ${keys.length} keys (Google gtx, ${MAX_CHUNK} chars/chunk) …`)

for (const k of keys) {
  const v = en[k]
  try {
    ar[k] = await translateLine(v)
  } catch (e) {
    console.error(`FAIL ${k}:`, e.message)
    ar[k] = v
  }
  done++
  if (done % 20 === 0) console.log(`  … ${done}/${keys.length}`)
}

fs.writeFileSync(AR_PATH, JSON.stringify(ar, null, 2), 'utf8')
console.log(`Wrote ${path.relative(ROOT, AR_PATH)}`)
