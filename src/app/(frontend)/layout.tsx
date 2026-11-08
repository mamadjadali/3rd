import React from 'react'
import type { Metadata } from 'next'
import './styles.css'

export const metadata: Metadata = {
  title: 'API Portal',
  description: 'Viewer-authenticated Scalar portal for third-party OpenAPI docs.',
  icons: {
    icon: [
      { url: '/brand/dwp-icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/dwp-icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/brand/dwp-icon-180.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.png',
  },
  openGraph: {
    title: 'API Portal',
    description: 'Viewer-authenticated Scalar portal for third-party OpenAPI docs.',
    images: ['/brand/dwp-logo.png'],
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
