// Payment processing and transaction management
export interface PaymentMethod {
  id: string
  userId: string
  type: "credit_card" | "debit_card" | "pix" | "bank_transfer"
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
  createdAt: string
}

export interface Transaction {
  id: string
  requestId: string
  clientId: string
  providerId: string
  amount: number
  fee: number // Platform fee
  netAmount: number // Amount provider receives
  status: "pending" | "processing" | "completed" | "failed" | "refunded" | "disputed"
  paymentMethod: string
  description: string
  createdAt: string
  completedAt?: string
  failureReason?: string
}

export interface PaymentIntent {
  id: string
  requestId: string
  clientId: string
  providerId: string
  amount: number
  description: string
  status: "created" | "confirmed" | "cancelled"
  expiresAt: string
  createdAt: string
}

// Mock payment methods
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "1",
    userId: "1",
    type: "credit_card",
    last4: "4242",
    brand: "Visa",
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
    createdAt: "2024-01-10T10:00:00Z",
  },
]

// Mock transactions
const mockTransactions: Transaction[] = [
  {
    id: "1",
    requestId: "1",
    clientId: "1",
    providerId: "2",
    amount: 200,
    fee: 20, // 10% platform fee
    netAmount: 180,
    status: "completed",
    paymentMethod: "Visa ****4242",
    description: "Faxina completa apartamento 2 quartos",
    createdAt: "2024-01-17T12:00:00Z",
    completedAt: "2024-01-17T15:30:00Z",
  },
]

const mockPaymentIntents: PaymentIntent[] = []

export const paymentService = {
  // Payment Methods
  async getPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]> {
    return mockPaymentMethods.filter((method) => method.userId === userId)
  },

  async addPaymentMethod(method: Omit<PaymentMethod, "id" | "createdAt">): Promise<PaymentMethod> {
    const newMethod: PaymentMethod = {
      ...method,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    // If this is the first payment method, make it default
    const userMethods = mockPaymentMethods.filter((m) => m.userId === method.userId)
    if (userMethods.length === 0) {
      newMethod.isDefault = true
    }

    mockPaymentMethods.push(newMethod)
    return newMethod
  },

  async setDefaultPaymentMethod(methodId: string, userId: string): Promise<void> {
    // Remove default from all user methods
    mockPaymentMethods.filter((method) => method.userId === userId).forEach((method) => (method.isDefault = false))

    // Set new default
    const method = mockPaymentMethods.find((m) => m.id === methodId)
    if (method) {
      method.isDefault = true
    }
  },

  // Payment Intents
  async createPaymentIntent(
    intent: Omit<PaymentIntent, "id" | "status" | "createdAt" | "expiresAt">,
  ): Promise<PaymentIntent> {
    const newIntent: PaymentIntent = {
      ...intent,
      id: Date.now().toString(),
      status: "created",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    }

    mockPaymentIntents.push(newIntent)
    return newIntent
  },

  async confirmPaymentIntent(intentId: string, paymentMethodId: string): Promise<Transaction> {
    const intent = mockPaymentIntents.find((i) => i.id === intentId)
    if (!intent) throw new Error("Payment intent not found")

    const paymentMethod = mockPaymentMethods.find((m) => m.id === paymentMethodId)
    if (!paymentMethod) throw new Error("Payment method not found")

    // Calculate platform fee (10%)
    const fee = Math.round(intent.amount * 0.1)
    const netAmount = intent.amount - fee

    const transaction: Transaction = {
      id: Date.now().toString(),
      requestId: intent.requestId,
      clientId: intent.clientId,
      providerId: intent.providerId,
      amount: intent.amount,
      fee,
      netAmount,
      status: "processing",
      paymentMethod: `${paymentMethod.brand} ****${paymentMethod.last4}`,
      description: intent.description,
      createdAt: new Date().toISOString(),
    }

    mockTransactions.push(transaction)

    // Update intent status
    intent.status = "confirmed"

    // Simulate processing delay
    setTimeout(async () => {
      transaction.status = "completed"
      transaction.completedAt = new Date().toISOString()

      // Create notifications
      const { notificationService } = await import("./notifications")

      await notificationService.createNotification({
        userId: intent.clientId,
        type: "payment",
        title: "Pagamento processado",
        message: `Pagamento de R$ ${intent.amount} foi processado com sucesso`,
        read: false,
        relatedId: intent.requestId,
        actionUrl: "/payments",
      })

      await notificationService.createNotification({
        userId: intent.providerId,
        type: "payment",
        title: "Pagamento recebido",
        message: `Você recebeu R$ ${netAmount} pelo serviço "${intent.description}"`,
        read: false,
        relatedId: intent.requestId,
        actionUrl: "/payments",
      })
    }, 2000)

    return transaction
  },

  // Transactions
  async getTransactionsByUser(userId: string, userType: "client" | "provider"): Promise<Transaction[]> {
    return mockTransactions
      .filter((transaction) =>
        userType === "client" ? transaction.clientId === userId : transaction.providerId === userId,
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    return mockTransactions.find((t) => t.id === transactionId) || null
  },

  // Platform Analytics
  async getPlatformStats(): Promise<{
    totalTransactions: number
    totalVolume: number
    totalFees: number
    averageTransaction: number
  }> {
    const completedTransactions = mockTransactions.filter((t) => t.status === "completed")
    const totalVolume = completedTransactions.reduce((sum, t) => sum + t.amount, 0)
    const totalFees = completedTransactions.reduce((sum, t) => sum + t.fee, 0)

    return {
      totalTransactions: completedTransactions.length,
      totalVolume,
      totalFees,
      averageTransaction: completedTransactions.length > 0 ? totalVolume / completedTransactions.length : 0,
    }
  },
}
