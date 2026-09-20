import type { CollectionConfig } from 'payload'

import { isAdminUser } from '../access/isAdminUser'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export const ApiSpecs: CollectionConfig = {
  slug: 'api-specs',
  labels: {
    singular: 'API Spec',
    plural: 'API Specs',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'sourceType', 'enabled', 'isDefault', 'sortOrder'],
    description: 'OpenAPI documents shown in Scalar. Optionally upload an original vendor PDF — it appears as an External documentation link in Scalar.',
  },
  access: {
    admin: ({ req: { user } }) => isAdminUser(user),
    create: ({ req: { user } }) => isAdminUser(user),
    delete: ({ req: { user } }) => isAdminUser(user),
    read: ({ req: { user } }) => isAdminUser(user),
    update: ({ req: { user } }) => isAdminUser(user),
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        if (!data.slug && data.title) {
          data.slug = slugify(String(data.title))
        } else if (data.slug) {
          data.slug = slugify(String(data.slug))
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, req, originalDoc, context }) => {
        if (!data || context?.skipDefaultHook) return data

        if (data.isDefault) {
          const existing = await req.payload.find({
            collection: 'api-specs',
            where: {
              and: [
                { isDefault: { equals: true } },
                ...(originalDoc?.id
                  ? [{ id: { not_equals: originalDoc.id } }]
                  : []),
              ],
            },
            limit: 100,
            overrideAccess: true,
          })

          for (const doc of existing.docs) {
            await req.payload.update({
              collection: 'api-specs',
              id: doc.id,
              data: { isDefault: false },
              overrideAccess: true,
              context: { skipDefaultHook: true },
            })
          }
        }

        const sourceType = data.sourceType || originalDoc?.sourceType
        if (sourceType === 'upload' && !data.specFile && !originalDoc?.specFile) {
          throw new Error('Upload an OpenAPI file when source type is Upload')
        }
        if (sourceType === 'inline' && !(data.specBody ?? originalDoc?.specBody)) {
          throw new Error('Paste an OpenAPI document when source type is Inline')
        }
        if (sourceType === 'url' && !(data.remoteUrl ?? originalDoc?.remoteUrl)) {
          throw new Error('Provide a remote URL when source type is URL')
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Used in /api/openapi/{slug}. Auto-generated from title if left empty.',
      },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Default document selected in Scalar. Only one can be default.',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first in Scalar.',
      },
    },
    {
      name: 'sourceType',
      type: 'select',
      required: true,
      defaultValue: 'upload',
      options: [
        { label: 'Upload file', value: 'upload' },
        { label: 'Paste YAML/JSON', value: 'inline' },
        { label: 'Remote URL', value: 'url' },
      ],
    },
    {
      name: 'specFile',
      type: 'upload',
      relationTo: 'openapi-files',
      admin: {
        condition: (_, siblingData) => siblingData?.sourceType === 'upload',
      },
    },
    {
      name: 'specBody',
      type: 'textarea',
      admin: {
        condition: (_, siblingData) => siblingData?.sourceType === 'inline',
        description: 'Paste full OpenAPI 3.x / Swagger YAML or JSON.',
      },
    },
    {
      name: 'remoteUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.sourceType === 'url',
        description: 'Public OpenAPI URL. Fetched server-side (avoids browser CORS).',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes (not shown in Scalar).',
      },
    },
    {
      name: 'originalDoc',
      type: 'upload',
      relationTo: 'vendor-docs',
      admin: {
        description: 'Optional original vendor PDF. Shown as an External documentation link in Scalar.',
      },
    },
    {
      name: 'originalDocLabel',
      type: 'text',
      defaultValue: 'Original vendor document',
      admin: {
        description: 'Label for the Scalar external documentation link.',
      },
    },
  ],
}
