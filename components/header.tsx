"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Logo } from "@/components/logo"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export function Header() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  console.log("[v0] Header - User object:", user)
  console.log("[v0] Header - User type:", user?.user_type)
  console.log("[v0] Header - Is provider check:", user?.user_type?.includes("provider"))

  const MobileMenu = () => (
    <div className="flex flex-col space-y-4 p-4">
      {user ? (
        <>
          <Button variant="ghost" size="sm" asChild className="justify-start">
            <Link href="/dashboard" onClick={() => setIsOpen(false)}>
              Dashboard
            </Link>
          </Button>
          {user && (
            <Button variant="ghost" size="sm" asChild className="justify-start">
              <Link href="/opportunities" onClick={() => setIsOpen(false)}>
                Oportunidades
              </Link>
            </Button>
          )}
          {user && (
            <Button variant="ghost" size="sm" asChild className="justify-start">
              <Link href="/profile" onClick={() => setIsOpen(false)}>
                Perfil
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild className="justify-start">
            <Link href="/chat" onClick={() => setIsOpen(false)}>
              💬 Chat
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="justify-start">
            <Link href="/schedule" onClick={() => setIsOpen(false)}>
              📅 Agenda
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="justify-start">
            <Link href="/payments" onClick={() => setIsOpen(false)}>
              💳 Pagamentos
            </Link>
          </Button>
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">Olá, {user.name}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout()
                setIsOpen(false)
              }}
              className="w-full"
            >
              Sair
            </Button>
          </div>
        </>
      ) : (
        <>
          <Button variant="ghost" size="sm" asChild className="justify-start">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              Entrar
            </Link>
          </Button>
          <Button size="sm" asChild className="w-full">
            <Link href="/signup" onClick={() => setIsOpen(false)}>
              Cadastrar
            </Link>
          </Button>
        </>
      )}
    </div>
  )

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="h-8 w-auto sm:h-10" />
          </Link>

          <nav className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                {user && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/opportunities">Oportunidades</Link>
                  </Button>
                )}
                {user && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/profile">Perfil</Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/chat">💬</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/schedule">📅</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/payments">💳</Link>
                </Button>
                <NotificationsDropdown />
                <span className="text-sm text-gray-600">Olá, {user.name}</span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Sair
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Cadastrar</Link>
                </Button>
              </div>
            )}
          </nav>

          <div className="md:hidden flex items-center space-x-2">
            {user && <NotificationsDropdown />}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <MobileMenu />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
