export const AVATARS = [
  { key: 'byte', name: 'Byte', face: '🤖', color: '#5eead4' },
  { key: 'nova', name: 'Nova', face: '🧑‍🚀', color: '#a78bfa' },
  { key: 'ember', name: 'Ember', face: '🧙', color: '#fb7185' },
  { key: 'pixel', name: 'Pixel', face: '🥷', color: '#60a5fa' },
  { key: 'sage', name: 'Sage', face: '🧝', color: '#86efac' },
  { key: 'bolt', name: 'Bolt', face: '🦸', color: '#facc15' },
] as const

export const avatarFor = (key?: string | null) =>
  AVATARS.find((avatar) => avatar.key === key) || AVATARS[0]

export function safeUrl(value: unknown, hosts?: string[]) {
  if (!value) return null
  try {
    const url = new URL(String(value).trim())
    if (!['http:', 'https:'].includes(url.protocol)) return null
    if (hosts && !hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) return null
    return url.toString().slice(0, 500)
  } catch {
    return null
  }
}

