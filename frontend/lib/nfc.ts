import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

export const NFC_TOKEN_BYTES = 24
export const NFC_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function createNfcToken() {
  return randomBytes(NFC_TOKEN_BYTES).toString('base64url')
}

export function hashNfcToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function encryptionKey() {
  const secret = process.env.NFC_TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET
  if (!secret) throw new Error('NFC token encryption is not configured')
  return createHash('sha256').update(secret).digest()
}

export function encryptNfcToken(token: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), encrypted].map(value => value.toString('base64url')).join('.')
}

export function decryptNfcToken(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split('.')
  if (!ivValue || !tagValue || !encryptedValue) throw new Error('Invalid encrypted NFC token')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8')
}

export function isValidNfcToken(token: string) {
  return NFC_TOKEN_PATTERN.test(token)
}

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

export function normalizeConnectionPair(first: string, second: string) {
  return first < second
    ? { low: first, high: second, actorIsLow: true }
    : { low: second, high: first, actorIsLow: false }
}

export function hasTrustedOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true // Non-browser clients remain usable for controlled tests.
  try { return new URL(origin).host === new URL(request.url).host } catch { return false }
}

export function safePublicUrl(value: unknown) {
  if (typeof value !== 'string' || !value) return null
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null } catch { return null }
}

export function publicAppOrigin(requestUrl: string) {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (configured) {
    try {
      const url = new URL(configured)
      if (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
        return url.origin
      }
    } catch { /* Fall back to the request origin. */ }
  }
  return new URL(requestUrl).origin
}
