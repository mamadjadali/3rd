import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

import config from '@payload-config'
import { getViewer } from '@/lib/viewer-auth'
import type { ApiSpec, OpenapiFile } from '@/payload-types'

const REMOTE_TIMEOUT_MS = 15_000
const REMOTE_MAX_BYTES = 5 * 1024 * 1024

type OpenApiDoc = Record<string, unknown> & {
  info?: Record<string, unknown> & {
    'x-scalar-links'?: Array<{ name: string; url: string }>
  }
  externalDocs?: { description?: string; url: string }
}

function contentTypeFor(filenameOrBody: string): string {
  const lower = filenameOrBody.trimStart().slice(0, 1)
  if (filenameOrBody.endsWith('.json') || lower === '{' || lower === '[') {
    return 'application/json; charset=utf-8'
  }
  return 'application/yaml; charset=utf-8'
}

function privateResponse(body: string | Buffer, contentType: string) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, no-store',
    },
  })
}

function injectVendorDocLink(raw: string, spec: ApiSpec): string {
  if (!spec.originalDoc) return raw

  const label = spec.originalDocLabel || 'Original vendor document'
  const url = `/api/vendor-docs/${spec.slug}`
  const trimmed = raw.trimStart()
  const isJson = trimmed.startsWith('{') || trimmed.startsWith('[')

  let doc: OpenApiDoc
  try {
    doc = (isJson ? JSON.parse(raw) : parseYaml(raw)) as OpenApiDoc
  } catch {
    return raw
  }

  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    return raw
  }

  doc.externalDocs = {
    description: label,
    url,
  }

  const info = { ...(doc.info || {}) }
  const existingLinks = Array.isArray(info['x-scalar-links'])
    ? info['x-scalar-links']
    : []
  info['x-scalar-links'] = [
    ...existingLinks.filter((link) => link?.url !== url),
    { name: label, url },
  ]
  doc.info = info

  return isJson ? JSON.stringify(doc, null, 2) : stringifyYaml(doc)
}

function maybeInject(body: string | Buffer, contentType: string, spec: ApiSpec): {
  body: string | Buffer
  contentType: string
} {
  if (!spec.originalDoc) {
    return { body, contentType }
  }

  const text = typeof body === 'string' ? body : body.toString('utf8')
  const injected = injectVendorDocLink(text, spec)
  const nextType = contentType.includes('json') || injected.trimStart().startsWith('{')
    ? contentType.includes('json')
      ? contentType
      : 'application/json; charset=utf-8'
    : contentType.includes('yaml') || contentType.includes('yml')
      ? contentType
      : contentTypeFor(injected)

  return { body: injected, contentType: nextType }
}

async function resolveUploadBody(fileRef: string | OpenapiFile): Promise<{ body: Buffer; contentType: string }> {
  const payload = await getPayload({ config })
  const fileDoc =
    typeof fileRef === 'object'
      ? fileRef
      : await payload.findByID({
          collection: 'openapi-files',
          id: fileRef,
          overrideAccess: true,
        })

  if (!fileDoc?.filename) {
    throw new Error('Missing upload file')
  }

  const filePath = path.join(process.cwd(), 'openapi-uploads', fileDoc.filename)
  const body = await fs.readFile(filePath)
  const contentType =
    fileDoc.mimeType || contentTypeFor(fileDoc.filename)

  return { body, contentType: `${contentType}; charset=utf-8`.replace(/; charset=utf-8; charset=utf-8/, '; charset=utf-8') }
}

async function resolveRemoteBody(url: string): Promise<{ body: Buffer; contentType: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { Accept: 'application/json, application/yaml, text/yaml, */*' },
    })

    if (!response.ok) {
      throw new Error(`Remote OpenAPI fetch failed (${response.status})`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength > REMOTE_MAX_BYTES) {
      throw new Error('Remote OpenAPI document exceeds size limit')
    }

    const headerType = response.headers.get('content-type') || contentTypeFor(url)
    return { body: buffer, contentType: headerType }
  } finally {
    clearTimeout(timer)
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string[] }> },
) {
  const viewer = await getViewer()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug: slugParts } = await context.params
  const slug = slugParts.join('/')

  if (!slug || slug.includes('..') || path.isAbsolute(slug)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'api-specs',
    where: {
      and: [{ slug: { equals: slug } }, { enabled: { equals: true } }],
    },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })

  const spec = result.docs[0] as ApiSpec | undefined
  if (!spec) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    if (spec.sourceType === 'inline') {
      if (!spec.specBody) {
        return NextResponse.json({ error: 'Spec body missing' }, { status: 404 })
      }
      const { body, contentType } = maybeInject(
        spec.specBody,
        contentTypeFor(spec.specBody),
        spec,
      )
      return privateResponse(body, contentType)
    }

    if (spec.sourceType === 'url') {
      if (!spec.remoteUrl) {
        return NextResponse.json({ error: 'Remote URL missing' }, { status: 404 })
      }
      const resolved = await resolveRemoteBody(spec.remoteUrl)
      const { body, contentType } = maybeInject(resolved.body, resolved.contentType, spec)
      return privateResponse(body, contentType)
    }

    // upload
    if (!spec.specFile) {
      return NextResponse.json({ error: 'Spec file missing' }, { status: 404 })
    }
    const resolved = await resolveUploadBody(spec.specFile as string | OpenapiFile)
    const { body, contentType } = maybeInject(resolved.body, resolved.contentType, spec)
    return privateResponse(body, contentType)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load spec'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
