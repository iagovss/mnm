"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { paymentService, type Transaction, type PaymentMethod } from "@/lib/payments"

const statusLabels = {
  pending: "Pendente",
  processing: "Processando",
  completed: "Concluído",
  failed: "Falhou",
  refunded: "Reembolsado",
  disputed: "Disputado",
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
  disputed: "bg-orange-100 text-orange-800",
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Add payment method form
  const [paymentForm, setPaymentForm] = useState({
    type: "credit_card" as "credit_card" | "debit_card" | "pix",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    holderName: "",
  })
  const [isAddingPayment, setIsAddingPayment] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const loadData = async () => {
      const userTransactions = await paymentService.getTransactionsByUser(user.id, user.type)
      const userPaymentMethods = await paymentService.getPaymentMethodsByUser(user.id)

      setTransactions(userTransactions)
      setPaymentMethods(userPaymentMethods)
      setIsLoading(false)
    }

    loadData()
  }, [user])

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsAddingPayment(true)

    try {
      const last4 = paymentForm.cardNumber.slice(-4)
      const brand = paymentForm.cardNumber.startsWith("4")
        ? "Visa"
        : paymentForm.cardNumber.startsWith("5")
          ? "Mastercard"
          : "Card"

      await paymentService.addPaymentMethod({
        userId: user.id,
        type: paymentForm.type,
        last4,
        brand,
        expiryMonth: Number.parseInt(paymentForm.expiryMonth),
        expiryYear: Number.parseInt(paymentForm.expiryYear),
        isDefault: paymentMethods.length === 0,
      })

      // Reload payment methods
      const updatedMethods = await paymentService.getPaymentMethodsByUser(user.id)
      setPaymentMethods(updatedMethods)

      // Reset form
      setPaymentForm({
        type: "credit_card",
        cardNumber: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
        holderName: "",
      })
    } catch (error) {
      console.error("Error adding payment method:", error)
    } finally {
      setIsAddingPayment(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Carregando informações de pagamento...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pagamentos</h1>
            <p className="text-gray-600 mt-2">
              Gerencie seus{" "}
              {user.type === "client" ? "pagamentos e métodos de pagamento" : "recebimentos e histórico financeiro"}
            </p>
          </div>
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="transactions">{user.type === "client" ? "Pagamentos" : "Recebimentos"}</TabsTrigger>
            {user.type === "client" && <TabsTrigger value="methods">Métodos de Pagamento</TabsTrigger>}
          </TabsList>

          <TabsContent value="transactions">
            {transactions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">💳</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma transação ainda</h3>
                  <p className="text-gray-600">
                    {user.type === "client"
                      ? "Seus pagamentos aparecerão aqui após contratar serviços."
                      : "Seus recebimentos aparecerão aqui após completar serviços."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{transaction.description}</CardTitle>
                          <CardDescription>
                            {formatDate(transaction.createdAt)} • {transaction.paymentMethod}
                          </CardDescription>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {user.type === "client"
                              ? formatCurrency(transaction.amount)
                              : formatCurrency(transaction.netAmount)}
                          </div>
                          <Badge className={statusColors[transaction.status]}>{statusLabels[transaction.status]}</Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">ID da Transação</span>
                          <p className="font-mono">{transaction.id}</p>
                        </div>

                        {user.type === "client" && (
                          <div>
                            <span className="text-gray-500">Taxa da Plataforma</span>
                            <p>{formatCurrency(transaction.fee)}</p>
                          </div>
                        )}

                        {user.type === "provider" && (
                          <div>
                            <span className="text-gray-500">Valor Bruto</span>
                            <p>{formatCurrency(transaction.amount)}</p>
                          </div>
                        )}

                        {transaction.completedAt && (
                          <div>
                            <span className="text-gray-500">Concluído em</span>
                            <p>{formatDate(transaction.completedAt)}</p>
                          </div>
                        )}

                        {transaction.failureReason && (
                          <div>
                            <span className="text-gray-500">Motivo da Falha</span>
                            <p className="text-red-600">{transaction.failureReason}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {user.type === "client" && (
            <TabsContent value="methods">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Métodos de Pagamento</CardTitle>
                        <CardDescription>Gerencie seus cartões e métodos de pagamento</CardDescription>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>Adicionar Método</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar Método de Pagamento</DialogTitle>
                            <DialogDescription>Adicione um novo cartão ou método de pagamento</DialogDescription>
                          </DialogHeader>

                          <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="type">Tipo</Label>
                              <Select
                                value={paymentForm.type}
                                onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, type: value as any }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                                  <SelectItem value="pix">PIX</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {(paymentForm.type === "credit_card" || paymentForm.type === "debit_card") && (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="holderName">Nome do Portador</Label>
                                  <Input
                                    id="holderName"
                                    value={paymentForm.holderName}
                                    onChange={(e) =>
                                      setPaymentForm((prev) => ({ ...prev, holderName: e.target.value }))
                                    }
                                    placeholder="Nome como no cartão"
                                    required
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="cardNumber">Número do Cartão</Label>
                                  <Input
                                    id="cardNumber"
                                    value={paymentForm.cardNumber}
                                    onChange={(e) =>
                                      setPaymentForm((prev) => ({ ...prev, cardNumber: e.target.value }))
                                    }
                                    placeholder="1234 5678 9012 3456"
                                    maxLength={19}
                                    required
                                  />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="expiryMonth">Mês</Label>
                                    <Select
                                      value={paymentForm.expiryMonth}
                                      onValueChange={(value) =>
                                        setPaymentForm((prev) => ({ ...prev, expiryMonth: value }))
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="MM" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => (
                                          <SelectItem key={i + 1} value={(i + 1).toString().padStart(2, "0")}>
                                            {(i + 1).toString().padStart(2, "0")}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="expiryYear">Ano</Label>
                                    <Select
                                      value={paymentForm.expiryYear}
                                      onValueChange={(value) =>
                                        setPaymentForm((prev) => ({ ...prev, expiryYear: value }))
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="AAAA" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 10 }, (_, i) => {
                                          const year = new Date().getFullYear() + i
                                          return (
                                            <SelectItem key={year} value={year.toString()}>
                                              {year}
                                            </SelectItem>
                                          )
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="cvv">CVV</Label>
                                    <Input
                                      id="cvv"
                                      value={paymentForm.cvv}
                                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, cvv: e.target.value }))}
                                      placeholder="123"
                                      maxLength={4}
                                      required
                                    />
                                  </div>
                                </div>
                              </>
                            )}

                            <Button type="submit" className="w-full" disabled={isAddingPayment}>
                              {isAddingPayment ? "Adicionando..." : "Adicionar Método"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {paymentMethods.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">💳</div>
                        <p className="text-gray-600">Nenhum método de pagamento cadastrado</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {paymentMethods.map((method) => (
                          <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-xs font-bold">{method.brand}</span>
                              </div>

                              <div>
                                <p className="font-medium">
                                  {method.brand} ****{method.last4}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Expira em {method.expiryMonth?.toString().padStart(2, "0")}/{method.expiryYear}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {method.isDefault && <Badge variant="secondary">Padrão</Badge>}

                              {!method.isDefault && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => paymentService.setDefaultPaymentMethod(method.id, user.id)}
                                >
                                  Tornar Padrão
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
