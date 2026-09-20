import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

import config from '@payload-config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const openapiDir = path.join(root, 'openapi')

const samples = [
  {
    title: 'Sample Payments',
    slug: 'sample-payments',
    filename: '01-sample-payments.openapi.yaml',
    isDefault: true,
    sortOrder: 10,
  },
  {
    title: 'Sample Notifications',
    slug: 'sample-notifications',
    filename: '02-sample-notifications.openapi.yaml',
    isDefault: false,
    sortOrder: 20,
  },
  {
    title: 'Scalar Galaxy',
    slug: 'galaxy',
    filename: '03-scalar-galaxy.json',
    isDefault: false,
    sortOrder: 30,
  },
] as const

async function main() {
  const payload = await getPayload({ config })

  for (const sample of samples) {
    const existing = await payload.find({
      collection: 'api-specs',
      where: { slug: { equals: sample.slug } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs.length > 0) {
      console.log(`skip existing: ${sample.slug}`)
      continue
    }

    const filePath = path.join(openapiDir, sample.filename)
    const buffer = await fs.readFile(filePath)
    const mimeType = sample.filename.endsWith('.json')
      ? 'application/json'
      : 'application/yaml'

    const uploaded = await payload.create({
      collection: 'openapi-files',
      data: {},
      file: {
        data: buffer,
        mimetype: mimeType,
        name: sample.filename,
        size: buffer.byteLength,
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: 'api-specs',
      data: {
        title: sample.title,
        slug: sample.slug,
        enabled: true,
        isDefault: sample.isDefault,
        sortOrder: sample.sortOrder,
        sourceType: 'upload',
        specFile: uploaded.id,
        notes: `Seeded from openapi/${sample.filename}`,
      },
      overrideAccess: true,
    })

    console.log(`seeded: ${sample.slug}`)
  }

  console.log('done')
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
