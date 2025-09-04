import type React from "react"
import type { Metadata } from "next"
import { AuthProvider } from "@/hooks/use-auth"
import { NotificationProvider } from "@/hooks/use-notifications"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mão na Massa - Conectando você aos melhores profissionais",
  description: "Plataforma que conecta clientes a prestadores de serviços qualificados em tempo real.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="antialiased">
      <body>
        <AuthProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
