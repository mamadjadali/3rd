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
        <h1>API portal</h1>
        <p>Sign in with your viewer account to open Scalar docs.</p>
        <LoginForm />
      </div>
    </div>
  )
}
