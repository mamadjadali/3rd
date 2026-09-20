import type { CollectionConfig } from 'payload'

const isAdmin = (user: { collection?: string } | null | undefined): boolean =>
  Boolean(user && user.collection === 'users')

export const Viewers: CollectionConfig = {
  slug: 'viewers',
  labels: {
    singular: 'Viewer',
    plural: 'Viewers',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'updatedAt'],
    description: 'Portal users who can view and try third-party APIs in Scalar.',
  },
  auth: true,
  access: {
    admin: ({ req: { user } }) => isAdmin(user),
    create: ({ req: { user } }) => isAdmin(user),
    delete: ({ req: { user } }) => isAdmin(user),
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (user?.collection === 'viewers') {
        return {
          id: {
            equals: user.id,
          },
        }
      }
      return false
    },
    update: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (user?.collection === 'viewers') {
        return {
          id: {
            equals: user.id,
          },
        }
      }
      return false
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
}
