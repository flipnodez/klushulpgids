// Geen `import 'server-only'` hier: dit bestand wordt ook in scripts (tsx)
// gebruikt buiten Next.js. Browser-import is sowieso onmogelijk doordat
// `node:crypto` niet bundlebaar is.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

/**
 * Symmetric field-level encryption + email hashing.
 *
 * - encrypt/decrypt: AES-256-GCM, output is "ivHex:tagHex:ciphertextHex".
 *   Gebruikt voor PII die we wel moeten kunnen tonen aan de eigenaar (email).
 * - hashEmail: sha256 lowercase+trim, voor unique-lookups en dedup zonder
 *   plaintext op te slaan.
 *
 * ENCRYPTION_KEY moet 64 hex chars (= 32 bytes) zijn, gegenereerd met:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * ⚠ Verlies van ENCRYPTION_KEY = data permanent onleesbaar. Zet altijd in
 * Scalingo env vars en bewaar back-up in een password manager.
 */

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12 // GCM-aanbevolen IV-lengte (12 bytes / 96 bits)

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex) throw new Error('ENCRYPTION_KEY is not set')
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('ENCRYPTION_KEY must be 64 hex chars (32 bytes)')
  }
  return Buffer.from(hex, 'hex')
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${ciphertext.toString('hex')}`
}

export function decrypt(payload: string): string {
  if (!payload || !payload.includes(':')) return payload
  const parts = payload.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format')
  }
  const [ivHex, tagHex, ciphertextHex] = parts as [string, string, string]
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ])
  return plaintext.toString('utf8')
}

/**
 * Stable, deterministic hash voor email-lookups & dedup.
 * Lowercase + trim om varianten van hetzelfde adres te matchen.
 */
export function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

/** Generieke sha256-hash voor IP-adressen, sessions, etc. */
export function hashSha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}
