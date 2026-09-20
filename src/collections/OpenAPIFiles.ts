import type { CollectionConfig } from 'payload'

import { isAdminUser } from '../access/isAdminUser'

export const OpenAPIFiles: CollectionConfig = {
  slug: 'openapi-files',
  labels: {
    singular: 'OpenAPI File',
    plural: 'OpenAPI Files',
  },
  admin: {
    useAsTitle: 'filename',
    description: 'Private OpenAPI/Swagger uploads used by API Specs. Served only via /api/openapi.',
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
    staticDir: 'openapi-uploads',
    mimeTypes: [
      'application/json',
      'application/yaml',
      'application/x-yaml',
      'text/yaml',
      'text/x-yaml',
      'text/plain',
    ],
  },
  fields: [],
}
