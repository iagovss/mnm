"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { serviceRequestService, type ServiceRequest, serviceCategories } from "@/lib/services"
import Link from "next/link"
import { ArrowLeft, MapPin, Calendar, DollarSign, Clock, User } from "lucide-react"

const statusLabels = {
  open: "Aberto",
  proposals: "Com Propostas",
  assigned: "Atribuído",
  "in-progress": "Em Andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
}

const statusColors = {
  open: "bg-blue-100 text-blue-800",
  proposals: "bg-yellow-100 text-yellow-800",
  assigned: "bg-purple-100 text-purple-800",
  "in-progress": "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
}

const urgencyLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
}

const urgencyColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
}

export default function RequestDetailsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const loadRequest = async () => {
      try {
        const requestData = await serviceRequestService.getRequestById(params.id)
        if (!requestData) {
          router.push("/dashboard")
          return
        }

        // Check if user owns this request
        if (requestData.clientId !== user.id && !user.user_type?.includes("provider")) {
          router.push("/dashboard")
          return
        }

        setRequest(requestData)
      } catch (error) {
        console.error("Error loading request:", error)
        router.push("/dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    loadRequest()
  }, [user, params.id, router])

  const getCategoryName = (categoryId: string) => {
    const category = serviceCategories.find((cat) => cat.id === categoryId)
    return category ? category.name : categoryId
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = serviceCategories.find((cat) => cat.id === categoryId)
    return category ? category.icon : "📋"
  }

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Solicitação não encontrada</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{getCategoryIcon(request.categoryId)}</div>
                  <div>
                    <CardTitle className="text-2xl">{request.title}</CardTitle>
                    <CardDescription className="text-lg">{getCategoryName(request.categoryId)}</CardDescription>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge className={urgencyColors[request.urgency]}>{urgencyLabels[request.urgency]}</Badge>
                  <Badge className={statusColors[request.status]}>{statusLabels[request.status]}</Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle>Descrição do Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Location & Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Localização e Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Endereço</h4>
                  <p className="text-gray-600">
                    {request.location.address}, {request.location.city} - {request.location.state}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Data Preferida
                  </h4>
                  <p className="text-gray-600">
                    {new Date(request.preferredDate).toLocaleDateString("pt-BR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Horário Preferido
                  </h4>
                  <p className="text-gray-600">{request.preferredTime}</p>
                </div>
              </CardContent>
            </Card>

            {/* Budget & Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Orçamento e Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Orçamento</h4>
                  <p className="text-gray-600">
                    R$ {request.budget.min.toLocaleString()} - R$ {request.budget.max.toLocaleString()}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    Solicitante
                  </h4>
                  <p className="text-gray-600">{request.clientName}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Criado em</h4>
                  <p className="text-gray-600">{new Date(request.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                {request.status === "in-progress" && request.clientId === user.id && (
                  <Button asChild>
                    <Link href={`/payment/${request.id}`}>Pagar Serviço</Link>
                  </Button>
                )}

                {request.clientId === user.id && (
                  <Button variant="outline" asChild>
                    <Link href={`/chat?request=${request.id}`}>Ver Conversas</Link>
                  </Button>
                )}

                {user.user_type?.includes("provider") && request.status === "open" && (
                  <Button asChild>
                    <Link href={`/opportunities?request=${request.id}`}>Enviar Proposta</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
