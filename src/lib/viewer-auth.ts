import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@payload-config'

export type PortalViewer = {
  id: number | string
  email: string
  name?: string | null
  collection: 'viewers'
}

export async function getViewer(): Promise<PortalViewer | null> {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (user && 'collection' in user && user.collection === 'viewers') {
    return user as PortalViewer
  }

  return null
}
