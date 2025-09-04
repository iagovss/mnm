"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { chatService, type Conversation } from "@/lib/chat"
import Link from "next/link"

export default function ChatListPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const loadConversations = async () => {
      const userConversations = await chatService.getConversationsByUser(user.id, user.type)
      setConversations(userConversations)
      setIsLoading(false)
    }

    loadConversations()
  }, [user])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Agora"
    if (diffInMinutes < 60) return `${diffInMinutes}m`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Carregando conversas...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mensagens</h1>
            <p className="text-gray-600 mt-2">
              Converse com {user.type === "client" ? "prestadores" : "clientes"} sobre seus serviços
            </p>
          </div>
        </div>

        {conversations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma conversa ainda</h3>
              <p className="text-gray-600 mb-6">
                {user.type === "client"
                  ? "Suas conversas com prestadores aparecerão aqui após você solicitar serviços."
                  : "Suas conversas com clientes aparecerão aqui após você enviar propostas."}
              </p>
              <Button asChild>
                <Link href={user.type === "client" ? "/request" : "/opportunities"}>
                  {user.type === "client" ? "Solicitar Serviço" : "Ver Oportunidades"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <Card key={conversation.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href={`/chat/${conversation.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user.type === "client"
                              ? conversation.providerName.charAt(0)
                              : conversation.clientName.charAt(0)}
                          </span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">
                              {user.type === "client" ? conversation.providerName : conversation.clientName}
                            </h3>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-red-500 text-white">{conversation.unreadCount}</Badge>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-1">{conversation.requestTitle}</p>

                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-500 truncate">
                              {conversation.lastMessage.senderName}: {conversation.lastMessage.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(conversation.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
