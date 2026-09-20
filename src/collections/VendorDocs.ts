import type { CollectionConfig } from 'payload'

import { isAdminUser } from '../access/isAdminUser'

export const VendorDocs: CollectionConfig = {
  slug: 'vendor-docs',
  labels: {
    singular: 'Vendor Doc',
    plural: 'Vendor Docs',
  },
  admin: {
    useAsTitle: 'filename',
    description: 'Private vendor PDFs linked from API Specs / Scalar. Served only via /api/vendor-docs.',
    hidden: ({ user }) => !isAdminUser(user),
  },
  access: {
    admin: ({ req: { user } }) => isAdminUser(user),
    create: ({ req: { user } }) => isAdminUser(user),
    delete: ({ req: { user } }) => isAdminUser(user),
    read: ({ req: { user } }) => isAdminUser(user),
    update: ({ req: { user } }) => isAdminUser(user),
  },
  upload: {
    staticDir: 'vendor-docs-uploads',
    mimeTypes: ['application/pdf'],
  },
  fields: [],
}
