import { redirect } from 'next/navigation'
import React from 'react'

import { getViewer } from '@/lib/viewer-auth'

import { LoginForm } from './LoginForm'

export default async function LoginPage() {
  const viewer = await getViewer()
  if (viewer) {
    redirect('/scalar')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="DWP"
          className="login-logo"
          height={36}
          src="/brand/dwp-logo.png"
          width={96}
        />
        <h1>API portal</h1>
        <LoginForm />
      </div>
    </div>
  )
}
