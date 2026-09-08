import assert from 'node:assert/strict'

process.env.NFC_TOKEN_ENCRYPTION_KEY ||= 'local-nfc-test-key-that-is-never-used-in-production'

async function main() {
const { createNfcToken, decryptNfcToken, encryptNfcToken, hashNfcToken, hasTrustedOrigin, isValidNfcToken, isValidUuid, normalizeConnectionPair, publicAppOrigin, safePublicUrl } = await import('../lib/nfc')

const token = createNfcToken()
assert.equal(token.length, 32)
assert.equal(isValidNfcToken(token), true)
assert.equal(isValidNfcToken('../participant'), false)
assert.equal(isValidUuid('719e88eb-14b4-4070-9ad1-f979cd25caf6'), true)
assert.equal(isValidUuid('--------not-a-real-uuid---------'), false)
assert.equal(decryptNfcToken(encryptNfcToken(token)), token)
assert.equal(hashNfcToken(token), hashNfcToken(token))
assert.notEqual(hashNfcToken(token), hashNfcToken(createNfcToken()))
assert.deepEqual(normalizeConnectionPair('a', 'b'), { low:'a', high:'b', actorIsLow:true })
assert.deepEqual(normalizeConnectionPair('b', 'a'), { low:'a', high:'b', actorIsLow:false })
assert.equal(safePublicUrl('javascript:alert(1)'), null)
assert.equal(safePublicUrl('https://github.com/example'), 'https://github.com/example')
assert.equal(hasTrustedOrigin(new Request('https://codered.test/api/nfc/connect', { headers:{ origin:'https://codered.test' } })), true)
assert.equal(hasTrustedOrigin(new Request('https://codered.test/api/nfc/connect', { headers:{ origin:'https://evil.test' } })), false)
process.env.NEXT_PUBLIC_BASE_URL = 'https://portal.codered.test/path'
assert.equal(publicAppOrigin('https://preview.vercel.app/api/nfc/my-tag'), 'https://portal.codered.test')

console.log('NFC utility checks passed')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
