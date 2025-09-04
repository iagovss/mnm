// Chat and messaging system
export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderType: "client" | "provider"
  message: string
  timestamp: string
  read: boolean
  messageType: "text" | "scheduling" | "system"
}

export interface Conversation {
  id: string
  requestId: string
  clientId: string
  providerId: string
  clientName: string
  providerName: string
  requestTitle: string
  status: "active" | "archived"
  lastMessage?: ChatMessage
  unreadCount: number
  createdAt: string
}

export interface ScheduleSlot {
  id: string
  conversationId: string
  providerId: string
  clientId: string
  date: string
  startTime: string
  endTime: string
  status: "proposed" | "confirmed" | "completed" | "cancelled"
  notes?: string
  createdAt: string
}

// Mock data
const mockConversations: Conversation[] = [
  {
    id: "1",
    requestId: "1",
    clientId: "1",
    providerId: "2",
    clientName: "João Silva",
    providerName: "Maria Santos",
    requestTitle: "Faxina completa apartamento 2 quartos",
    status: "active",
    unreadCount: 2,
    createdAt: "2024-01-16T10:00:00Z",
  },
]

const mockMessages: ChatMessage[] = [
  {
    id: "1",
    conversationId: "1",
    senderId: "2",
    senderName: "Maria Santos",
    senderType: "provider",
    message:
      "Olá! Vi sua solicitação de faxina. Posso fazer o serviço amanhã pela manhã. Que horário seria melhor para você?",
    timestamp: "2024-01-16T10:30:00Z",
    read: false,
    messageType: "text",
  },
  {
    id: "2",
    conversationId: "1",
    senderId: "1",
    senderName: "João Silva",
    senderType: "client",
    message: "Oi Maria! Que bom que você pode ajudar. Amanhã de manhã seria perfeito. Pode ser às 9h?",
    timestamp: "2024-01-16T11:00:00Z",
    read: true,
    messageType: "text",
  },
  {
    id: "3",
    conversationId: "1",
    senderId: "2",
    senderName: "Maria Santos",
    senderType: "provider",
    message: "Perfeito! Às 9h está confirmado. Vou levar todos os materiais necessários.",
    timestamp: "2024-01-16T11:15:00Z",
    read: false,
    messageType: "text",
  },
]

const mockScheduleSlots: ScheduleSlot[] = [
  {
    id: "1",
    conversationId: "1",
    providerId: "2",
    clientId: "1",
    date: "2024-01-17",
    startTime: "09:00",
    endTime: "12:00",
    status: "confirmed",
    notes: "Faxina completa - levar materiais",
    createdAt: "2024-01-16T11:15:00Z",
  },
]

export const chatService = {
  async getConversationsByUser(userId: string, userType: "client" | "provider"): Promise<Conversation[]> {
    return mockConversations
      .filter((conv) => (userType === "client" ? conv.clientId === userId : conv.providerId === userId))
      .map((conv) => ({
        ...conv,
        lastMessage: mockMessages
          .filter((msg) => msg.conversationId === conv.id)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0],
      }))
  },

  async getConversationById(conversationId: string): Promise<Conversation | null> {
    const conversation = mockConversations.find((conv) => conv.id === conversationId)
    if (!conversation) return null

    return {
      ...conversation,
      lastMessage: mockMessages
        .filter((msg) => msg.conversationId === conversationId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0],
    }
  },

  async getMessagesByConversation(conversationId: string): Promise<ChatMessage[]> {
    return mockMessages
      .filter((msg) => msg.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  },

  async sendMessage(message: Omit<ChatMessage, "id" | "timestamp" | "read">): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    }

    mockMessages.push(newMessage)

    // Create notification for recipient
    const conversation = mockConversations.find((conv) => conv.id === message.conversationId)
    if (conversation) {
      const recipientId = message.senderId === conversation.clientId ? conversation.providerId : conversation.clientId
      const { notificationService } = await import("./notifications")

      await notificationService.createNotification({
        userId: recipientId,
        type: "message",
        title: "Nova mensagem",
        message: `${message.senderName}: ${message.message.substring(0, 50)}${message.message.length > 50 ? "..." : ""}`,
        read: false,
        relatedId: conversation.id,
        actionUrl: `/chat/${conversation.id}`,
      })
    }

    return newMessage
  },

  async createConversation(requestId: string, clientId: string, providerId: string): Promise<Conversation> {
    // Check if conversation already exists
    const existing = mockConversations.find(
      (conv) => conv.requestId === requestId && conv.clientId === clientId && conv.providerId === providerId,
    )

    if (existing) return existing

    const newConversation: Conversation = {
      id: Date.now().toString(),
      requestId,
      clientId,
      providerId,
      clientName: "Cliente", // Would get from user service
      providerName: "Prestador", // Would get from user service
      requestTitle: "Serviço", // Would get from request service
      status: "active",
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    }

    mockConversations.push(newConversation)
    return newConversation
  },
}

export const scheduleService = {
  async getSchedulesByUser(userId: string, userType: "client" | "provider"): Promise<ScheduleSlot[]> {
    return mockScheduleSlots.filter((slot) =>
      userType === "client" ? slot.clientId === userId : slot.providerId === userId,
    )
  },

  async createScheduleSlot(slot: Omit<ScheduleSlot, "id" | "createdAt" | "status">): Promise<ScheduleSlot> {
    const newSlot: ScheduleSlot = {
      ...slot,
      id: Date.now().toString(),
      status: "proposed",
      createdAt: new Date().toISOString(),
    }

    mockScheduleSlots.push(newSlot)

    // Send system message about scheduling
    await chatService.sendMessage({
      conversationId: slot.conversationId,
      senderId: slot.providerId,
      senderName: "Sistema",
      senderType: "provider",
      message: `Agendamento proposto: ${new Date(slot.date).toLocaleDateString("pt-BR")} às ${slot.startTime}`,
      messageType: "scheduling",
    })

    return newSlot
  },

  async updateScheduleStatus(scheduleId: string, status: ScheduleSlot["status"]): Promise<void> {
    const schedule = mockScheduleSlots.find((slot) => slot.id === scheduleId)
    if (schedule) {
      schedule.status = status
    }
  },
}
