import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

import config from '@payload-config'
import { getViewer } from '@/lib/viewer-auth'
import type { ApiSpec, VendorDoc } from '@/payload-types'

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const viewer = await getViewer()
  if (!viewer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await context.params
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
  if (!spec?.originalDoc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const fileDoc =
    typeof spec.originalDoc === 'object'
      ? (spec.originalDoc as VendorDoc)
      : await payload.findByID({
          collection: 'vendor-docs',
          id: spec.originalDoc,
          overrideAccess: true,
        })

  if (!fileDoc?.filename) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const filePath = path.join(process.cwd(), 'vendor-docs-uploads', fileDoc.filename)
    const body = await fs.readFile(filePath)
    const safeName = fileDoc.filename.replace(/"/g, '')

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': fileDoc.mimeType || 'application/pdf',
        'Content-Disposition': `inline; filename="${safeName}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
