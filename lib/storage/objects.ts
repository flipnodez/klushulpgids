import 'server-only'

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  type ObjectCannedACL,
} from '@aws-sdk/client-s3'

import { env } from '@/lib/env'

/**
 * S3-compatible object storage client. Werkt met Scaleway, Exoscale, OVHcloud,
 * AWS S3 — provider-agnostisch via env vars.
 *
 * **Veiligheidsmodel:** geen bucket-policy nodig. Per upload zetten wij
 * `ACL: 'public-read'` zodat alleen objecten die wij bewust uploaden
 * publiek leesbaar zijn. Andere objecten (bv. toekomstig: privé documenten)
 * kunnen we standaard laten op private.
 *
 * **Naming:** `tradespeople/{tradespersonId}/{photoId}.{ext}`
 */

let _client: S3Client | null = null

function getClient(): S3Client {
  if (_client) return _client
  if (
    !env.STORAGE_ENDPOINT ||
    !env.STORAGE_REGION ||
    !env.STORAGE_ACCESS_KEY ||
    !env.STORAGE_SECRET_KEY
  ) {
    throw new Error(
      'Object storage is niet geconfigureerd. Controleer STORAGE_ENDPOINT/REGION/ACCESS_KEY/SECRET_KEY env vars.',
    )
  }
  _client = new S3Client({
    region: env.STORAGE_REGION,
    endpoint: env.STORAGE_ENDPOINT,
    credentials: {
      accessKeyId: env.STORAGE_ACCESS_KEY,
      secretAccessKey: env.STORAGE_SECRET_KEY,
    },
    forcePathStyle: false,
  })
  return _client
}

function getBucket(): string {
  const bucket = env.STORAGE_BUCKET_NAME
  if (!bucket) throw new Error('STORAGE_BUCKET_NAME niet gezet')
  return bucket
}

export type PutObjectInput = {
  key: string
  body: Buffer | Uint8Array
  contentType: string
  /** Default: 'public-read' — voor profielfoto's. Overschrijf met 'private' voor bv. interne documenten. */
  acl?: ObjectCannedACL
}

export async function putObject({
  key,
  body,
  contentType,
  acl = 'public-read',
}: PutObjectInput): Promise<{ key: string; publicUrl: string }> {
  const bucket = getBucket()
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: acl,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )
  return { key, publicUrl: publicUrlFor(key) }
}

export async function deleteObject(key: string): Promise<void> {
  const bucket = getBucket()
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

export function publicUrlFor(key: string): string {
  const endpoint = env.STORAGE_ENDPOINT?.replace(/\/$/, '') ?? ''
  const bucket = env.STORAGE_BUCKET_NAME ?? ''
  // Path-style URL — werkt met Scaleway als bucket-onderdeel van path
  // Scaleway accepteert ook virtual-hosted style: https://<bucket>.s3.<region>.scw.cloud
  // We gebruiken de virtual-hosted variant — dan is `endpoint` de S3-endpoint zonder bucket
  // Scaleway endpoint: https://s3.nl-ams.scw.cloud → public URL voor object:
  // https://<bucket>.s3.nl-ams.scw.cloud/<key>
  const host = endpoint.replace(/^https?:\/\//, '')
  return `https://${bucket}.${host}/${encodeURI(key)}`
}
