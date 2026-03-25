import { skipStringOrTemplate } from './skip-literals.mjs'

/**
 * Parse non-string value (e.g. env.WEBSITE_NAME, fn()) until top-level `,`
 *
 * @param {string} inner
 * @param {number} i
 */
function parseExpression(inner, i) {
  const start = i
  let depthParen = 0
  let depthBracket = 0
  let depthBrace = 0

  while (i < inner.length) {
    const c = inner[i]
    if (c === "'" || c === '"' || c === '`') {
      i = skipStringOrTemplate(inner, i)
      continue
    }
    if (c === '(') depthParen++
    else if (c === ')') depthParen--
    else if (c === '[') depthBracket++
    else if (c === ']') depthBracket--
    else if (c === '{') depthBrace++
    else if (c === '}') depthBrace--
    else if (c === ',' && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
      break
    }
    i++
  }
  return { raw: inner.slice(start, i).trim(), nextIndex: i }
}

/**
 * Decode a single- or double-quoted TS string value (no surrounding quotes).
 *
 * @param {string} raw including quotes
 */
function decodeQuoted(raw) {
  const q = raw[0]
  let inner = raw.slice(1, -1)
  if (q === "'") {
    inner = inner.replace(/\\'/g, "'").replace(/\\\\/g, '\\')
  } else {
    inner = inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  }
  return inner
}

/**
 * Read one value starting at i (after ':'). Returns { raw, decoded, isTemplate, nextIndex }
 *
 * @param {string} inner
 * @param {number} i
 */
function parseValue(inner, i) {
  while (i < inner.length && /[\s\t]/.test(inner[i])) i++
  if (i >= inner.length) throw new Error('Unexpected end in parseValue')

  const c = inner[i]
  if (c === "'" || c === '"') {
    const start = i
    const end = skipStringOrTemplate(inner, i)
    const raw = inner.slice(start, end)
    return {
      raw,
      decoded: decodeQuoted(raw),
      isTemplate: false,
      expr: false,
      nextIndex: end,
    }
  }
  if (c === '`') {
    const start = i
    const end = skipStringOrTemplate(inner, i)
    const raw = inner.slice(start, end)
    const decoded = raw.slice(1, -1).replace(/\\`/g, '`').replace(/\\\$\{/g, '${')
    return {
      raw,
      decoded,
      isTemplate: true,
      expr: false,
      nextIndex: end,
    }
  }
  const ex = parseExpression(inner, i)
  return {
    raw: ex.raw,
    decoded: ex.raw,
    isTemplate: false,
    expr: true,
    nextIndex: ex.nextIndex,
  }
}

/**
 * Parse property list inside locale block inner (between `{` `}` exclusive).
 *
 * @returns {{ key: string, ref?: true, decoded?: string, isTemplate?: boolean, raw?: string, expr?: boolean }[]}
 */
export function parseLocaleProps(inner) {
  const props = []
  let i = 0

  while (i < inner.length) {
    while (i < inner.length && /[\s,\n\r]/.test(inner[i])) i++
    if (i >= inner.length) break

    const keyMatch = /^([A-Za-z_][a-zA-Z0-9_]*)/.exec(inner.slice(i))
    if (!keyMatch) break

    const key = keyMatch[1]
    i += key.length

    while (i < inner.length && /[\s\t]/.test(inner[i])) i++

    if (i < inner.length && inner[i] === ',') {
      props.push({ key, ref: true })
      i++
      continue
    }

    if (i >= inner.length || inner[i] !== ':') {
      throw new Error(`Expected : or , after key ${key} at offset ${i}`)
    }
    i++

    const val = parseValue(inner, i)
    i = val.nextIndex

    props.push({
      key,
      decoded: val.decoded,
      isTemplate: val.isTemplate,
      raw: val.raw,
      expr: val.expr,
    })

    while (i < inner.length && /[\s\t]/.test(inner[i])) i++
    if (i < inner.length && inner[i] === ',') i++
  }

  return props
}
