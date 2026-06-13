// Layout para rutas de autenticación: sin sidebar, centrado verticalmente.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo institucional */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-wide">INPSASEL</h1>
          <p className="mt-1 text-brand-100 text-sm">Sistema de Gestión de Visitas</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
