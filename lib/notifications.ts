// Notification system for real-time updates
export interface Notification {
  id: string
  userId: string
  type: "proposal_received" | "proposal_accepted" | "proposal_rejected" | "status_update" | "message" | "payment"
  title: string
  message: string
  read: boolean
  createdAt: string
  relatedId?: string // ID of related request, proposal, etc.
  actionUrl?: string // URL to navigate when clicked
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: "1",
    userId: "1", // Client João
    type: "proposal_received",
    title: "Nova proposta recebida",
    message: 'Maria Santos enviou uma proposta para "Faxina completa apartamento 2 quartos"',
    read: false,
    createdAt: "2024-01-16T14:30:00Z",
    relatedId: "1",
    actionUrl: "/dashboard",
  },
  {
    id: "2",
    userId: "1",
    type: "proposal_received",
    title: "Nova proposta recebida",
    message: 'Carlos Silva enviou uma proposta para "Faxina completa apartamento 2 quartos"',
    read: false,
    createdAt: "2024-01-16T15:45:00Z",
    relatedId: "1",
    actionUrl: "/dashboard",
  },
  {
    id: "3",
    userId: "2", // Provider Maria
    type: "proposal_accepted",
    title: "Proposta aceita!",
    message: 'Sua proposta para "Faxina completa apartamento 2 quartos" foi aceita',
    read: true,
    createdAt: "2024-01-15T16:20:00Z",
    relatedId: "1",
    actionUrl: "/opportunities",
  },
  {
    id: "4",
    userId: "1",
    type: "status_update",
    title: "Serviço iniciado",
    message: 'Maria Santos iniciou o serviço "Faxina completa apartamento 2 quartos"',
    read: true,
    createdAt: "2024-01-14T09:00:00Z",
    relatedId: "1",
    actionUrl: "/dashboard",
  },
]

export const notificationService = {
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return mockNotifications
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  async getUnreadCount(userId: string): Promise<number> {
    const userNotifications = await this.getNotificationsByUser(userId)
    return userNotifications.filter((n) => !n.read).length
  },

  async markAsRead(notificationId: string): Promise<void> {
    const notification = mockNotifications.find((n) => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    mockNotifications.filter((n) => n.userId === userId).forEach((n) => (n.read = true))
  },

  async createNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    mockNotifications.push(newNotification)
    return newNotification
  },
}

// Notification type configurations
export const notificationConfig = {
  proposal_received: {
    icon: "💼",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  proposal_accepted: {
    icon: "✅",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  proposal_rejected: {
    icon: "❌",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  status_update: {
    icon: "📋",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  message: {
    icon: "💬",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  payment: {
    icon: "💳",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
}
