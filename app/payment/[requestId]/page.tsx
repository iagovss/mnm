"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { paymentService, type PaymentMethod, type PaymentIntent } from "@/lib/payments"
import { serviceRequestService, type ServiceRequest } from "@/lib/services"

export default function PaymentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const requestId = params.requestId as string

  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string>("")
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (user.type !== "client") {
      router.push("/")
      return
    }

    const loadData = async () => {
      const serviceRequest = await serviceRequestService.getRequestById(requestId)
      if (!serviceRequest || serviceRequest.clientId !== user.id) {
        router.push("/dashboard")
        return
      }

      const userPaymentMethods = await paymentService.getPaymentMethodsByUser(user.id)
      const defaultMethod = userPaymentMethods.find((m) => m.isDefault)

      setRequest(serviceRequest)
      setPaymentMethods(userPaymentMethods)
      setSelectedMethod(defaultMethod?.id || "")
      setIsLoading(false)
    }

    loadData()
  }, [user, requestId])

  const handleCreatePaymentIntent = async () => {
    if (!request || !user) return

    try {
      // For demo purposes, use the max budget as the payment amount
      const intent = await paymentService.createPaymentIntent({
        requestId: request.id,
        clientId: user.id,
        providerId: "2", // Mock provider ID
        amount: request.budget.max,
        description: request.title,
      })

      setPaymentIntent(intent)
    } catch (error) {
      console.error("Error creating payment intent:", error)
    }
  }

  const handleConfirmPayment = async () => {
    if (!paymentIntent || !selectedMethod) return

    setIsProcessing(true)

    try {
      await paymentService.confirmPaymentIntent(paymentIntent.id, selectedMethod)

      // Update request status
      await serviceRequestService.updateRequestStatus(requestId, "completed")

      router.push("/payments?success=true")
    } catch (error) {
      console.error("Error confirming payment:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Carregando informações de pagamento...</div>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Solicitação não encontrada</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Finalizar Pagamento</CardTitle>
            <CardDescription>Complete o pagamento para o serviço solicitado</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Service Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resumo do Serviço</h3>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">{request.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {request.location.city}, {request.location.state}
                </p>
              </div>
            </div>

            <Separator />

            {/* Payment Amount */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Valor do Pagamento</h3>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Valor do serviço</span>
                  <span>{formatCurrency(request.budget.max)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Taxa da plataforma (10%)</span>
                  <span>{formatCurrency(request.budget.max * 0.1)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(request.budget.max)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment Methods */}
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">💳</div>
                <h3 className="text-lg font-semibold mb-2">Nenhum método de pagamento</h3>
                <p className="text-gray-600 mb-4">Você precisa adicionar um método de pagamento primeiro</p>
                <Button asChild>
                  <a href="/payments">Adicionar Método de Pagamento</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Método de Pagamento</h3>

                <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-6 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-xs font-bold">{method.brand}</span>
                            </div>
                            <span>
                              {method.brand} ****{method.last4}
                            </span>
                          </div>
                          {method.isDefault && <span className="text-xs bg-gray-100 px-2 py-1 rounded">Padrão</span>}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Action Buttons */}
            {paymentMethods.length > 0 && (
              <div className="space-y-4">
                {!paymentIntent ? (
                  <Button onClick={handleCreatePaymentIntent} className="w-full" disabled={!selectedMethod}>
                    Continuar para Pagamento
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900">Pagamento Autorizado</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Clique em "Confirmar Pagamento" para processar a transação
                      </p>
                    </div>

                    <Button onClick={handleConfirmPayment} className="w-full" disabled={isProcessing}>
                      {isProcessing ? "Processando..." : `Confirmar Pagamento ${formatCurrency(request.budget.max)}`}
                    </Button>
                  </div>
                )}

                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <a href="/dashboard">Cancelar</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
