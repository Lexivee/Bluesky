export function pluralize(n: number, base: string, plural?: string): string {
  if (n === 1) {
    return base
  }
  if (plural) {
    return plural
  }
  return base + 's'
}

export function enforceLen(
  str: string,
  len: number,
  ellipsis = false,
  mode: 'end' | 'middle' = 'end',
): string {
  str = str || ''
  if (str.length > len) {
    if (mode === 'end') {
      return str.slice(0, len) + (ellipsis ? '…' : '')
    } else if (mode === 'middle') {
      const half = Math.floor(len / 2)
      return str.slice(0, half) + '…' + str.slice(-half)
    }
  }
  return str
}

// https://stackoverflow.com/a/52171480
export function toHashCode(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)

  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

export function countLines(str: string | undefined): number {
  if (!str) return 0
  return str.match(/\n/g)?.length ?? 0
}

// Augments search query with additional syntax like `from:me`
export function augmentSearchQuery(query: string, {did}: {did?: string}) {
  // Don't do anything if there's no DID
  if (!did) {
    return query
  }

  // We don't want to replace substrings that are being "quoted" because those
  // are exact string matches, so what we'll do here is to split them apart

  // Even-indexed strings are unquoted, odd-indexed strings are quoted
  const splits = query.split(/("(?:[^"\\]|\\.)*")/g)

  return splits
    .map((str, idx) => {
      if (idx % 2 === 0) {
        return str.replaceAll(/(^|\s)from:me(\s|$)/g, `$1${did}$2`)
      }

      return str
    })
    .join('')
}
