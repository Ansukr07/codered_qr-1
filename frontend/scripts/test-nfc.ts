import assert from 'node:assert/strict'

process.env.NFC_TOKEN_ENCRYPTION_KEY ||= 'local-nfc-test-key-that-is-never-used-in-production'

async function main() {
const { createNfcToken, decryptNfcToken, encryptNfcToken, hashNfcToken, hasTrustedOrigin, isValidNfcToken, normalizeConnectionPair, safePublicUrl } = await import('../lib/nfc')

const token = createNfcToken()
assert.equal(token.length, 32)
assert.equal(isValidNfcToken(token), true)
assert.equal(isValidNfcToken('../participant'), false)
assert.equal(decryptNfcToken(encryptNfcToken(token)), token)
assert.equal(hashNfcToken(token), hashNfcToken(token))
assert.notEqual(hashNfcToken(token), hashNfcToken(createNfcToken()))
assert.deepEqual(normalizeConnectionPair('a', 'b'), { low:'a', high:'b', actorIsLow:true })
assert.deepEqual(normalizeConnectionPair('b', 'a'), { low:'a', high:'b', actorIsLow:false })
assert.equal(safePublicUrl('javascript:alert(1)'), null)
assert.equal(safePublicUrl('https://github.com/example'), 'https://github.com/example')
assert.equal(hasTrustedOrigin(new Request('https://codered.test/api/nfc/connect', { headers:{ origin:'https://codered.test' } })), true)
assert.equal(hasTrustedOrigin(new Request('https://codered.test/api/nfc/connect', { headers:{ origin:'https://evil.test' } })), false)

console.log('NFC utility checks passed')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
