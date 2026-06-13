import type { Metadata } from 'next'
import { LoginForm } from '@/components/forms/LoginForm'

export const metadata: Metadata = { title: 'Iniciar sesión — INPSASEL' }

export default function LoginPage() {
  return (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Iniciar sesión</h2>
      <LoginForm />
    </>
  )
}
