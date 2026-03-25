/**
 * Skip string / template literal starting at index i (on opening quote).
 * Handles nested ${ ... } in templates with brace + string awareness.
 *
 * @param {string} s
 * @param {number} i
 * @returns {number} index after closing quote
 */
export function skipStringOrTemplate(s, i) {
  const q = s[i]
  if (q !== "'" && q !== '"' && q !== '`') return i

  if (q === "'" || q === '"') {
    let p = i + 1
    while (p < s.length) {
      const c = s[p]
      if (c === '\\') {
        p += 2
        continue
      }
      if (c === q) return p + 1
      p++
    }
    return p
  }

  // template literal
  let p = i + 1
  while (p < s.length) {
    const c = s[p]
    if (c === '\\') {
      p += 2
      continue
    }
    if (c === '`') return p + 1
    if (c === '$' && s[p + 1] === '{') {
      p = skipBraceExpression(s, p + 2)
      continue
    }
    p++
  }
  return p
}

/**
 * Skip from after opening `{` of ${ until matching `}`
 * @param {string} s
 * @param {number} i - index of first char inside `{`
 */
export function skipBraceExpression(s, i) {
  let depth = 1
  let p = i
  while (p < s.length && depth > 0) {
    const c = s[p]
    if (c === '\\') {
      p += 2
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      p = skipStringOrTemplate(s, p)
      continue
    }
    if (c === '{') depth++
    else if (c === '}') depth--
    p++
  }
  return p
}

/**
 * Extract inner content of `  locale: { ... }` (between outer braces, exclusive).
 *
 * @param {string} text full file
 * @param {'en' | 'ar' | 'fr' | 'es'} locale
 * @returns {string | null}
 */
export function extractLocaleInner(text, locale) {
  const marker = `  ${locale}: {`
  const start = text.indexOf(marker)
  if (start === -1) return null

  let pos = start + marker.length
  let depth = 1
  const innerStart = pos

  while (pos < text.length && depth > 0) {
    const c = text[pos]
    if (c === "'" || c === '"' || c === '`') {
      pos = skipStringOrTemplate(text, pos)
      continue
    }
    if (c === '{') {
      depth++
      pos++
      continue
    }
    if (c === '}') {
      depth--
      if (depth === 0) {
        return text.slice(innerStart, pos)
      }
      pos++
      continue
    }
    pos++
  }
  return null
}

/**
 * Extract inner content of `export const name = { ... }` (between outer braces, exclusive).
 *
 * @param {string} text full file
 * @param {string} bindingName e.g. "en" or "ar"
 * @returns {string | null}
 */
export function extractExportConstObjectInner(text, bindingName) {
  const marker = `export const ${bindingName} = {`
  const start = text.indexOf(marker)
  if (start === -1) return null

  let pos = start + marker.length
  let depth = 1
  const innerStart = pos

  while (pos < text.length && depth > 0) {
    const c = text[pos]
    if (c === "'" || c === '"' || c === '`') {
      pos = skipStringOrTemplate(text, pos)
      continue
    }
    if (c === '{') {
      depth++
      pos++
      continue
    }
    if (c === '}') {
      depth--
      if (depth === 0) {
        return text.slice(innerStart, pos)
      }
      pos++
      continue
    }
    pos++
  }
  return null
}

/**
 * @param {string} text
 * @param {'en' | 'ar' | 'fr' | 'es'} locale
 * @returns {{ start: number, end: number, inner: string } | null}
 * `start`..`end` covers `  xx: { ... },` including trailing comma.
 */
export function extractLocaleRegion(text, locale) {
  const marker = `  ${locale}: {`
  const start = text.indexOf(marker)
  if (start === -1) return null

  let pos = start + marker.length
  let depth = 1
  const innerStart = pos

  while (pos < text.length && depth > 0) {
    const c = text[pos]
    if (c === "'" || c === '"' || c === '`') {
      pos = skipStringOrTemplate(text, pos)
      continue
    }
    if (c === '{') {
      depth++
      pos++
      continue
    }
    if (c === '}') {
      depth--
      pos++
      if (depth === 0) {
        const inner = text.slice(innerStart, pos - 1)
        let endPos = pos
        while (endPos < text.length && /[\s\t\n\r]/.test(text[endPos])) endPos++
        if (text[endPos] === ',') endPos++
        return { start, end: endPos, inner }
      }
      continue
    }
    pos++
  }
  return null
}
