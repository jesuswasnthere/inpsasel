import type { Metadata } from 'next'
import Image from 'next/image'
import { LoginForm } from '@/components/forms/LoginForm'

export const metadata: Metadata = { title: 'Inicio de sesión — INPSASEL' }

export default function LoginPage() {
  return (
    <>
      {/* Encabezado de marca — igual que el HTML original */}
      <div className="flex items-center gap-4 mb-5">
        <Image
          src="https://tse3.mm.bing.net/th/id/OIP.EM3DltdiNLHzZh23cV-MYQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"
          alt="Logo INPSASEL"
          width={72}
          height={72}
          className="rounded-lg object-contain"
          unoptimized
        />
        <div>
          <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase">
            Acceso privado
          </p>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            Sistema de Registro<br />de Visitas
          </h1>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Ingrese con el usuario autorizado para continuar.
      </p>

      <LoginForm />
    </>
  )
}
