import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Viewer-authenticated Scalar portal for third-party OpenAPI docs.',
  title: 'API Portal',
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
