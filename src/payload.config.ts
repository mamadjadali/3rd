import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Viewers } from './collections/Viewers'
import { OpenAPIFiles } from './collections/OpenAPIFiles'
import { VendorDocs } from './collections/VendorDocs'
import { ApiSpecs } from './collections/ApiSpecs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' — DWP',
      icons: [
        {
          rel: 'icon',
          type: 'image/png',
          url: '/brand/dwp-icon-32.png',
        },
        {
          rel: 'apple-touch-icon',
          type: 'image/png',
          url: '/brand/dwp-icon-180.png',
        },
      ],
      openGraph: {
        images: [
          {
            url: '/brand/dwp-logo.png',
          },
        ],
      },
    },
    components: {
      graphics: {
        Logo: '/components/brand/Logo#Logo',
        Icon: '/components/brand/Icon#Icon',
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Viewers, OpenAPIFiles, VendorDocs, ApiSpecs],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [],
})
