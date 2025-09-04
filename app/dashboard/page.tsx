"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const serviceCategories = [
  { id: "4c7ec384-38d3-4d71-b5f0-45ccfbcdf6fd", name: "Eletricista", icon: "⚡" },
  { id: "8f2a1b3c-5d6e-7f8g-9h0i-1j2k3l4m5n6o", name: "Encanador", icon: "🔧" },
  { id: "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6", name: "Limpeza", icon: "🧹" },
  { id: "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7", name: "Jardinagem", icon: "🌱" },
  { id: "c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8", name: "Pintura", icon: "🎨" },
  { id: "d4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9", name: "Marcenaria", icon: "🪚" },
  { id: "e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0", name: "Pet Care", icon: "🐕" },
  { id: "f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1", name: "Aulas Particulares", icon: "📚" },
]

type ServiceRequest = {
  id: string
  client_id: string
  category_id: string
  title: string
  description: string
  location: string
  budget_min: number
  budget_max: number
  urgency: "low" | "medium" | "high"
  status: "open" | "proposals" | "assigned" | "in-progress" | "completed" | "cancelled"
  scheduled_date: string
  created_at: string
  updated_at: string
}

type Proposal = {
  id: string
  request_id: string
  provider_id: string
  provider_name: string
  price: number
  status: "pending" | "accepted" | "rejected"
  created_at: string
}

type Statistics = {
  totalProposals: number
  pendingProposals: number
  acceptedProposals: number
  rejectedProposals: number
  completedJobs: number
  totalEarnings: number
  averageRating: number
  activeRequests: number
}

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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [statistics, setStatistics] = useState<Statistics>({
    totalProposals: 0,
    pendingProposals: 0,
    acceptedProposals: 0,
    rejectedProposals: 0,
    completedJobs: 0,
    totalEarnings: 0,
    averageRating: 4.8,
    activeRequests: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const loadData = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      if (user.user_type?.includes("client")) {
        try {
          console.log("[v0] Loading service requests for client:", user.id)

          const { data: userRequests, error } = await supabase
            .from("service_requests")
            .select("*")
            .eq("client_id", user.id)
            .order("created_at", { ascending: false })

          if (error) {
            console.error("[v0] Error loading service requests:", error)
            setRequests([])
          } else {
            console.log("[v0] Service requests loaded successfully:", userRequests)
            setRequests(userRequests || [])

            const stats = {
              totalProposals: 0,
              pendingProposals: 0,
              acceptedProposals: 0,
              rejectedProposals: 0,
              completedJobs: userRequests?.filter((r) => r.status === "completed").length || 0,
              totalEarnings: 0,
              averageRating: 4.8,
              activeRequests:
                userRequests?.filter((r) => ["open", "proposals", "assigned", "in-progress"].includes(r.status))
                  .length || 0,
            }
            setStatistics(stats)
          }
        } catch (error) {
          console.error("[v0] Error loading service requests:", error)
          setRequests([])
        }
      } else if (user.user_type?.includes("provider")) {
        try {
          const { data: userProposals, error: proposalsError } = await supabase
            .from("proposals")
            .select("*")
            .eq("provider_id", user.id)
            .order("created_at", { ascending: false })

          if (proposalsError) {
            console.error("[v0] Error loading proposals:", proposalsError)
          } else {
            setProposals(userProposals || [])

            const stats = {
              totalProposals: userProposals?.length || 0,
              pendingProposals: userProposals?.filter((p) => p.status === "pending").length || 0,
              acceptedProposals: userProposals?.filter((p) => p.status === "accepted").length || 0,
              rejectedProposals: userProposals?.filter((p) => p.status === "rejected").length || 0,
              completedJobs: userProposals?.filter((p) => p.status === "accepted").length || 0,
              totalEarnings:
                userProposals?.filter((p) => p.status === "accepted").reduce((sum, p) => sum + p.price, 0) || 0,
              averageRating: 4.8,
              activeRequests: 0,
            }
            setStatistics(stats)
          }
        } catch (error) {
          console.error("[v0] Error loading provider data:", error)
        }
      }
      setIsLoading(false)
    }

    loadData()
  }, [user])

  const getCategoryName = (categoryId: string) => {
    const category = serviceCategories.find((cat) => cat.id === categoryId)
    return category ? category.name : categoryId
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = serviceCategories.find((cat) => cat.id === categoryId)
    return category ? category.icon : "📋"
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    )
  }

  const isClient = user.user_type?.includes("client")
  const isProvider = user.user_type?.includes("provider")

  const proposalStatusData = [
    { name: "Pendentes", value: statistics.pendingProposals, color: "#FFBB28" },
    { name: "Aceitas", value: statistics.acceptedProposals, color: "#00C49F" },
    { name: "Rejeitadas", value: statistics.rejectedProposals, color: "#FF8042" },
  ]

  const monthlyData = [
    { month: "Jan", propostas: 12, ganhos: 2400 },
    { month: "Fev", propostas: 19, ganhos: 3200 },
    { month: "Mar", propostas: 15, ganhos: 2800 },
    { month: "Abr", propostas: 22, ganhos: 4100 },
    { month: "Mai", propostas: 18, ganhos: 3600 },
    { month: "Jun", propostas: 25, ganhos: 4800 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isClient ? "Dashboard do Cliente" : "Dashboard do Prestador"}
            </h1>
            <p className="text-gray-600 mt-2">
              {isClient ? "Gerencie suas solicitações de serviço" : "Acompanhe suas propostas e ganhos"}
            </p>
          </div>

          {isClient && (
            <Button asChild>
              <Link href="/request">Nova Solicitação</Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isProvider ? "Propostas Enviadas" : "Solicitações Ativas"}
              </CardTitle>
              <div className="text-2xl">📊</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isProvider ? statistics.totalProposals : statistics.activeRequests}
              </div>
              <p className="text-xs text-muted-foreground">
                {isProvider ? "Total de propostas enviadas" : "Solicitações em andamento"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isProvider ? "Propostas Pendentes" : "Serviços Concluídos"}
              </CardTitle>
              <div className="text-2xl">{isProvider ? "⏳" : "✅"}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isProvider ? statistics.pendingProposals : statistics.completedJobs}
              </div>
              <p className="text-xs text-muted-foreground">
                {isProvider ? "Aguardando resposta" : "Serviços finalizados"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isProvider ? "Trabalhos Aceitos" : "Avaliação Média"}
              </CardTitle>
              <div className="text-2xl">{isProvider ? "🎯" : "⭐"}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isProvider ? statistics.acceptedProposals : statistics.averageRating.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                {isProvider ? "Propostas aceitas" : "Baseado em avaliações"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{isProvider ? "Ganhos Totais" : "Gasto Total"}</CardTitle>
              <div className="text-2xl">💰</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {statistics.totalEarnings.toLocaleString("pt-BR")}</div>
              <p className="text-xs text-muted-foreground">
                {isProvider ? "Receita acumulada" : "Investimento em serviços"}
              </p>
            </CardContent>
          </Card>
        </div>

        {isProvider && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Status das Propostas</CardTitle>
                <CardDescription>Distribuição das suas propostas por status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={proposalStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {proposalStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Desempenho Mensal</CardTitle>
                <CardDescription>Propostas enviadas e ganhos por mês</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="propostas" fill="#8884d8" name="Propostas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {isClient && (
          <>
            {requests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma solicitação ainda</h3>
                  <p className="text-gray-600 mb-6">
                    Crie sua primeira solicitação de serviço e receba propostas de profissionais qualificados.
                  </p>
                  <Button asChild>
                    <Link href="/request">Criar Primeira Solicitação</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {requests.map((request) => (
                  <Card key={request.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{getCategoryIcon(request.category_id)}</div>
                          <div>
                            <CardTitle className="text-lg">{request.title}</CardTitle>
                            <CardDescription>
                              {getCategoryName(request.category_id)} • {request.location.split(",")[0]}
                            </CardDescription>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge className={urgencyColors[request.urgency]}>{urgencyLabels[request.urgency]}</Badge>
                          <Badge className={statusColors[request.status]}>{statusLabels[request.status]}</Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <p className="text-gray-600 mb-4 line-clamp-2">{request.description}</p>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>
                            Orçamento: R$ {request.budget_min} - R$ {request.budget_max}
                          </span>
                          <span>Data: {new Date(request.scheduled_date).toLocaleDateString("pt-BR")}</span>
                        </div>

                        <div className="flex space-x-2">
                          {request.status === "in-progress" && (
                            <Button size="sm" asChild>
                              <Link href={`/payment/${request.id}`}>Pagar Serviço</Link>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/request/${request.id}`}>Ver Detalhes</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {isProvider && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🔨</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Bem-vindo, Prestador!</h3>
              <p className="text-gray-600 mb-6">Complete seu perfil e comece a receber oportunidades de trabalho.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/profile">Completar Perfil</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/opportunities">Ver Oportunidades</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
