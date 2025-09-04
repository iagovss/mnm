"use client"

import { useEffect } from "react"
import { useState } from "react"
import type React from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { serviceCategories } from "@/lib/services"

export default function OpportunitiesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const hasRedirected = useRef(false)
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [filteredOpportunities, setFilteredOpportunities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [proposalForm, setProposalForm] = useState({
    price: "",
    estimatedDuration: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    location: "",
    minBudget: "",
    maxBudget: "",
    dateFrom: "",
    dateTo: "",
    urgency: "",
  })

  useEffect(() => {
    if (authLoading) {
      console.log("[v0] OpportunitiesPage - Auth still loading, waiting...")
      return
    }

    console.log("[v0] OpportunitiesPage - User:", user)
    console.log("[v0] OpportunitiesPage - User type:", user?.user_type)
    console.log("[v0] OpportunitiesPage - User email:", user?.email)

    if (!user) {
      console.log("[v0] OpportunitiesPage - No user, redirecting to login")
      if (!hasRedirected.current) {
        hasRedirected.current = true
        router.push("/login")
      }
      return
    }

    console.log("[v0] OpportunitiesPage - User authenticated, loading opportunities")

    hasRedirected.current = false

    const loadOpportunities = async () => {
      try {
        console.log("[v0] OpportunitiesPage - Loading opportunities for provider")

        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const { data: userProfile, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()

        if (userError) {
          console.error("[v0] OpportunitiesPage - Error fetching user profile:", userError)
        }

        console.log("[v0] OpportunitiesPage - User profile from database:", userProfile)

        const { data: serviceRequests, error: requestsError } = await supabase
          .from("service_requests")
          .select(`
            *,
            users!service_requests_client_id_fkey (
              name,
              phone
            )
          `)
          .eq("status", "open")
          .neq("client_id", user.id)

        if (requestsError) {
          console.error("[v0] OpportunitiesPage - Error fetching service requests:", requestsError)
          setOpportunities([])
          setIsLoading(false)
          return
        }

        console.log("[v0] OpportunitiesPage - Filtered service requests (excluding user's own):", serviceRequests)

        const transformedRequests =
          serviceRequests?.map((req: any) => ({
            id: req.id,
            title: req.title,
            description: req.description,
            categoryId: req.category_id,
            clientId: req.client_id,
            clientName: req.users?.name || "Cliente",
            location: req.location || "Localização não informada",
            budget: {
              min: req.budget_min || 0,
              max: req.budget_max || 0,
            },
            preferredDate: req.scheduled_date || new Date().toISOString(),
            urgency: req.urgency || "medium",
            status: req.status,
            createdAt: req.created_at,
          })) || []

        setOpportunities(transformedRequests)
        setFilteredOpportunities(transformedRequests) // Initialize filtered opportunities
        console.log("[v0] OpportunitiesPage - Final opportunities:", transformedRequests)
      } catch (error) {
        console.error("[v0] OpportunitiesPage - Error loading opportunities:", error)
        setOpportunities([])
        setFilteredOpportunities([])
      }

      setIsLoading(false)
    }

    loadOpportunities()
  }, [user, router, authLoading])

  useEffect(() => {
    let filtered = [...opportunities]

    if (filters.search) {
      filtered = filtered.filter(
        (opp) =>
          opp.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          opp.description.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    if (filters.category) {
      filtered = filtered.filter((opp) => opp.categoryId === filters.category)
    }

    if (filters.location) {
      filtered = filtered.filter((opp) => opp.location.toLowerCase().includes(filters.location.toLowerCase()))
    }

    if (filters.minBudget) {
      filtered = filtered.filter((opp) => opp.budget.max >= Number(filters.minBudget))
    }

    if (filters.maxBudget) {
      filtered = filtered.filter((opp) => opp.budget.min <= Number(filters.maxBudget))
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((opp) => new Date(opp.preferredDate) >= new Date(filters.dateFrom))
    }

    if (filters.dateTo) {
      filtered = filtered.filter((opp) => new Date(opp.preferredDate) <= new Date(filters.dateTo))
    }

    if (filters.urgency) {
      filtered = filtered.filter((opp) => opp.urgency === filters.urgency)
    }

    setFilteredOpportunities(filtered)
  }, [opportunities, filters])

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest || !user) return

    setIsSubmitting(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data: providerProfile, error: providerError } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (providerError || !providerProfile) {
        throw new Error("Provider profile not found")
      }

      const { error: proposalError } = await supabase.from("proposals").insert({
        request_id: selectedRequest.id,
        provider_id: providerProfile.id,
        provider_name: providerProfile.business_name || user.name,
        provider_rating: providerProfile.rating || 0,
        price: Number.parseFloat(proposalForm.price),
        estimated_duration: proposalForm.estimatedDuration,
        message: proposalForm.message,
        status: "pending",
      })

      if (proposalError) {
        throw proposalError
      }

      setOpportunities((prev) => prev.filter((opp) => opp.id !== selectedRequest.id))
      setSelectedRequest(null)
      setProposalForm({ price: "", estimatedDuration: "", message: "" })
    } catch (error) {
      console.error("Error submitting proposal:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = serviceCategories.find((cat) => cat.id === categoryId)
    return category ? category.name : categoryId
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = serviceCategories.find((cat) => cat.id === categoryId)
    return category ? category.icon : "📋"
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      location: "",
      minBudget: "",
      maxBudget: "",
      dateFrom: "",
      dateTo: "",
      urgency: "",
    })
  }

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter((value) => value !== "").length
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {authLoading ? "Verificando autenticação..." : "Carregando oportunidades..."}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Oportunidades de Trabalho</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Encontre trabalhos que combinam com seu perfil e envie propostas
            </p>
          </div>
        </div>

        {filteredOpportunities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {opportunities.length === 0 ? "Nenhuma oportunidade disponível" : "Nenhuma oportunidade encontrada"}
              </h3>
              <p className="text-gray-600 mb-6">
                {opportunities.length === 0
                  ? "No momento não há solicitações de serviço abertas. Novas oportunidades aparecerão aqui quando clientes criarem solicitações."
                  : "Tente ajustar os filtros para encontrar mais oportunidades."}
              </p>
              <div className="space-y-2">
                {opportunities.length === 0 ? (
                  <Button asChild>
                    <a href="/profile">Ver Meu Perfil</a>
                  </Button>
                ) : (
                  <Button onClick={clearFilters}>Limpar Filtros</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {filteredOpportunities.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
                    <div className="flex items-start space-x-3">
                      <div className="text-xl sm:text-2xl flex-shrink-0">{getCategoryIcon(request.categoryId)}</div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg leading-tight">{request.title}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {getCategoryName(request.categoryId)} • {request.location.split(",")[0]}
                        </CardDescription>
                      </div>
                    </div>

                    <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm whitespace-nowrap">
                      R$ {request.budget.min} - R$ {request.budget.max}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-gray-600 mb-4 text-sm sm:text-base leading-relaxed">{request.description}</p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center gap-1">📍 {request.location.split(",")[0]}</span>
                      <span className="flex items-center gap-1">
                        📅 {new Date(request.preferredDate).toLocaleDateString("pt-BR")}
                      </span>
                      <Badge
                        className={`text-xs ${
                          request.urgency === "high"
                            ? "bg-red-100 text-red-800"
                            : request.urgency === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {request.urgency === "high" ? "Alta" : request.urgency === "medium" ? "Média" : "Baixa"}{" "}
                        urgência
                      </Badge>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button onClick={() => setSelectedRequest(request)} className="w-full sm:w-auto">
                          Enviar Proposta
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md mx-4 sm:mx-auto">
                        <DialogHeader>
                          <DialogTitle>Enviar Proposta</DialogTitle>
                          <DialogDescription>{selectedRequest?.title}</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmitProposal} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="price">Preço (R$)</Label>
                            <Input
                              id="price"
                              type="number"
                              value={proposalForm.price}
                              onChange={(e) => setProposalForm((prev) => ({ ...prev, price: e.target.value }))}
                              placeholder="150"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="duration">Tempo Estimado</Label>
                            <Input
                              id="duration"
                              value={proposalForm.estimatedDuration}
                              onChange={(e) =>
                                setProposalForm((prev) => ({ ...prev, estimatedDuration: e.target.value }))
                              }
                              placeholder="2-3 horas"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="message">Mensagem</Label>
                            <Textarea
                              id="message"
                              value={proposalForm.message}
                              onChange={(e) => setProposalForm((prev) => ({ ...prev, message: e.target.value }))}
                              placeholder="Descreva sua experiência e como você pode ajudar..."
                              rows={3}
                              required
                            />
                          </div>

                          <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Enviando..." : "Enviar Proposta"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              🔍 Filtros
              {getActiveFiltersCount() > 0 && (
                <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Filtros de Pesquisa</DialogTitle>
              <DialogDescription>
                Use os filtros abaixo para encontrar as oportunidades ideais para você
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Título ou descrição..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Tipo de Serviço</Label>
                <select
                  id="category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  {serviceCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  placeholder="Cidade, estado..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgência</Label>
                <select
                  id="urgency"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.urgency}
                  onChange={(e) => handleFilterChange("urgency", e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minBudget">Orçamento Mínimo</Label>
                <Input
                  id="minBudget"
                  type="number"
                  placeholder="R$ 0"
                  value={filters.minBudget}
                  onChange={(e) => handleFilterChange("minBudget", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxBudget">Orçamento Máximo</Label>
                <Input
                  id="maxBudget"
                  type="number"
                  placeholder="R$ 1000"
                  value={filters.maxBudget}
                  onChange={(e) => handleFilterChange("maxBudget", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFrom">Data Inicial</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTo">Data Final</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button variant="outline" onClick={clearFilters} className="flex-1 bg-transparent">
                Limpar Filtros
              </Button>
              <Button onClick={() => setIsFilterModalOpen(false)} className="flex-1">
                Aplicar Filtros
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {getActiveFiltersCount() > 0 && (
          <Button variant="ghost" onClick={clearFilters} className="text-sm text-gray-600">
            Limpar filtros
          </Button>
        )}

        <div className="text-sm text-gray-600">
          {filteredOpportunities.length} oportunidade{filteredOpportunities.length !== 1 ? "s" : ""} encontrada
          {filteredOpportunities.length !== 1 ? "s" : ""}
        </div>
      </main>
    </div>
  )
}
