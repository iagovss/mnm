"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { chatService, scheduleService, type ChatMessage, type Conversation } from "@/lib/chat"

export default function ChatPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  // Scheduling state
  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
  })
  const [isScheduling, setIsScheduling] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const loadConversation = async () => {
      const conv = await chatService.getConversationById(conversationId)
      if (!conv) {
        router.push("/chat")
        return
      }

      setConversation(conv)
      const msgs = await chatService.getMessagesByConversation(conversationId)
      setMessages(msgs)
      setIsLoading(false)
    }

    loadConversation()
  }, [user, conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !conversation) return

    setIsSending(true)

    try {
      const message = await chatService.sendMessage({
        conversationId,
        senderId: user.id,
        senderName: user.name,
        senderType: user.type,
        message: newMessage.trim(),
        messageType: "text",
      })

      setMessages((prev) => [...prev, message])
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !conversation || user.type !== "provider") return

    setIsScheduling(true)

    try {
      await scheduleService.createScheduleSlot({
        conversationId,
        providerId: user.id,
        clientId: conversation.clientId,
        date: scheduleForm.date,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        notes: scheduleForm.notes,
      })

      // Reload messages to show the scheduling message
      const msgs = await chatService.getMessagesByConversation(conversationId)
      setMessages(msgs)

      setScheduleForm({ date: "", startTime: "", endTime: "", notes: "" })
    } catch (error) {
      console.error("Error creating schedule:", error)
    } finally {
      setIsScheduling(false)
    }
  }

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Carregando conversa...</div>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Conversa não encontrada</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {user.type === "client" ? conversation.providerName : conversation.clientName}
                </CardTitle>
                <p className="text-sm text-gray-600">{conversation.requestTitle}</p>
              </div>

              <div className="flex space-x-2">
                {user.type === "provider" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        📅 Agendar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Propor Agendamento</DialogTitle>
                        <DialogDescription>Sugira uma data e horário para o serviço</DialogDescription>
                      </DialogHeader>

                      <form onSubmit={handleScheduleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Data</Label>
                          <Input
                            id="date"
                            type="date"
                            value={scheduleForm.date}
                            onChange={(e) => setScheduleForm((prev) => ({ ...prev, date: e.target.value }))}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="startTime">Início</Label>
                            <Input
                              id="startTime"
                              type="time"
                              value={scheduleForm.startTime}
                              onChange={(e) => setScheduleForm((prev) => ({ ...prev, startTime: e.target.value }))}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="endTime">Término</Label>
                            <Input
                              id="endTime"
                              type="time"
                              value={scheduleForm.endTime}
                              onChange={(e) => setScheduleForm((prev) => ({ ...prev, endTime: e.target.value }))}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Observações</Label>
                          <Input
                            id="notes"
                            value={scheduleForm.notes}
                            onChange={(e) => setScheduleForm((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Materiais necessários, instruções especiais..."
                          />
                        </div>

                        <Button type="submit" className="w-full" disabled={isScheduling}>
                          {isScheduling ? "Agendando..." : "Propor Agendamento"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}

                <Button variant="outline" size="sm" asChild>
                  <a href="/chat">← Voltar</a>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === user.id
                      ? "bg-primary-500 text-white"
                      : message.messageType === "scheduling"
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        : "bg-gray-200 text-gray-900"
                  }`}
                >
                  {message.messageType === "scheduling" && (
                    <div className="text-xs font-medium mb-1">📅 Agendamento</div>
                  )}

                  <p className="text-sm">{message.message}</p>

                  <div
                    className={`text-xs mt-1 ${message.senderId === user.id ? "text-primary-100" : "text-gray-500"}`}
                  >
                    {formatMessageTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1"
                disabled={isSending}
              />
              <Button type="submit" disabled={isSending || !newMessage.trim()}>
                {isSending ? "Enviando..." : "Enviar"}
              </Button>
            </form>
          </div>
        </Card>
      </main>
    </div>
  )
}
