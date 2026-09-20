import { ApiReference } from '@scalar/nextjs-api-reference'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

import config from '@payload-config'
import { getViewer } from '@/lib/viewer-auth'

const SCALAR_CDN = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.67.0'

export async function GET(request: Request) {
  const viewer = await getViewer()
  if (!viewer) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'api-specs',
    where: { enabled: { equals: true } },
    sort: 'sortOrder',
    limit: 100,
    overrideAccess: true,
  })

  if (docs.length === 0) {
    return new NextResponse(
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>API Portal</title>
    <style>
      body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #f5f5f5; display: grid; place-items: center; min-height: 100vh; margin: 0; }
      main { max-width: 32rem; text-align: center; }
      a { color: #93c5fd; }
    </style>
  </head>
  <body>
    <main>
      <h1>No API specs yet</h1>
      <p>An admin needs to add an enabled document under <strong>API Specs</strong> in the admin panel.</p>
      <p><a href="/admin/collections/api-specs">Open admin</a> · <a href="/login">Viewer sign in</a></p>
    </main>
  </body>
</html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'private, no-store',
        },
      },
    )
  }

  const sources = docs.map((doc) => ({
    title: doc.title,
    slug: doc.slug,
    url: `/api/openapi/${doc.slug}`,
    default: Boolean(doc.isDefault),
  }))

  // Ensure at least one default if none flagged
  if (!sources.some((source) => source.default) && sources[0]) {
    sources[0].default = true
  }

  return ApiReference({
    theme: 'default',
    pageTitle: 'Third-party APIs',
    cdn: SCALAR_CDN,
    sources,
  })()
}
