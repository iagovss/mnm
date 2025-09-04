"use client"

import { useEffect, useState, useRef } from "react"
import type React from "react"
import { createBrowserClient } from "@supabase/ssr"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { serviceCategories } from "@/lib/services"
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  User,
  Star,
  AlertCircle,
  TrendingUp,
  Briefcase,
  Home,
  Wrench,
  Palette,
  Car,
  Heart,
  GraduationCap,
  Users,
  Building,
  Zap,
  Camera,
  Music,
  Gamepad2,
  Plane,
  ShoppingBag,
  Utensils,
  Dumbbell,
  Leaf,
  Shield,
  X,
  Check,
} from "lucide-react"

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
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Oportunidades de Trabalho
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Encontre trabalhos que combinam com seu perfil e envie propostas personalizadas
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Total de Oportunidades</p>
                    <p className="text-2xl font-bold text-blue-900">{opportunities.length}</p>
                  </div>
                  <div className="p-3 bg-blue-200 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">Filtradas</p>
                    <p className="text-2xl font-bold text-green-900">{filteredOpportunities.length}</p>
                  </div>
                  <div className="p-3 bg-green-200 rounded-full">
                    <Search className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Filtros Ativos</p>
                    <p className="text-2xl font-bold text-purple-900">{getActiveFiltersCount()}</p>
                  </div>
                  <div className="p-3 bg-purple-200 rounded-full">
                    <Filter className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Bar */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Buscar por título, descrição ou categoria..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-3">
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                    <SelectTrigger className="w-[180px] h-12">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {serviceCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.urgency} onValueChange={(value) => handleFilterChange("urgency", value)}>
                    <SelectTrigger className="w-[140px] h-12">
                      <SelectValue placeholder="Urgência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="high">🔴 Alta</SelectItem>
                      <SelectItem value="medium">🟡 Média</SelectItem>
                      <SelectItem value="low">🟢 Baixa</SelectItem>
                    </SelectContent>
                  </Select>

                  <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-12 px-4">
                        <Filter className="h-4 w-4 mr-2" />
                        Mais Filtros
                        {getActiveFiltersCount() > 0 && (
                          <Badge className="ml-2 bg-blue-500 text-white">
                            {getActiveFiltersCount()}
                          </Badge>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Filtros Avançados</DialogTitle>
                        <DialogDescription>
                          Refine sua busca com filtros específicos
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
                        <div className="space-y-2">
                          <Label htmlFor="location">📍 Localização</Label>
                          <Input
                            id="location"
                            placeholder="Cidade, estado..."
                            value={filters.location}
                            onChange={(e) => handleFilterChange("location", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="minBudget">💰 Orçamento Mínimo</Label>
                          <Input
                            id="minBudget"
                            type="number"
                            placeholder="R$ 0"
                            value={filters.minBudget}
                            onChange={(e) => handleFilterChange("minBudget", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maxBudget">💰 Orçamento Máximo</Label>
                          <Input
                            id="maxBudget"
                            type="number"
                            placeholder="R$ 1000"
                            value={filters.maxBudget}
                            onChange={(e) => handleFilterChange("maxBudget", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dateFrom">📅 Data Inicial</Label>
                          <Input
                            id="dateFrom"
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dateTo">📅 Data Final</Label>
                          <Input
                            id="dateTo"
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-6 border-t">
                        <Button variant="outline" onClick={clearFilters} className="flex-1">
                          Limpar Filtros
                        </Button>
                        <Button onClick={() => setIsFilterModalOpen(false)} className="flex-1">
                          Aplicar Filtros
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {getActiveFiltersCount() > 0 && (
                    <Button variant="ghost" onClick={clearFilters} className="h-12 text-gray-600">
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {filteredOpportunities.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="text-center py-16">
              <div className="text-8xl mb-6 opacity-50">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {opportunities.length === 0 ? "Nenhuma oportunidade disponível" : "Nenhuma oportunidade encontrada"}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                {opportunities.length === 0
                  ? "No momento não há solicitações de serviço abertas. Novas oportunidades aparecerão aqui quando clientes criarem solicitações."
                  : "Tente ajustar os filtros para encontrar mais oportunidades que combinem com seu perfil."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {opportunities.length === 0 ? (
                  <>
                    <Button asChild size="lg">
                      <a href="/profile">Ver Meu Perfil</a>
                    </Button>
                    <Button variant="outline" asChild size="lg">
                      <a href="/dashboard">Voltar ao Dashboard</a>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={clearFilters} size="lg">Limpar Filtros</Button>
                    <Button variant="outline" onClick={() => setIsFilterModalOpen(true)} size="lg">
                      Ajustar Filtros
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {filteredOpportunities.length} oportunidade{filteredOpportunities.length !== 1 ? "s" : ""} encontrada{filteredOpportunities.length !== 1 ? "s" : ""}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                Atualizado agora
              </div>
            </div>
            {/* Opportunities Grid */}
            <div className="grid gap-6">
              {filteredOpportunities.map((request) => (
                <Card key={request.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 hover:border-l-blue-600">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-3 bg-blue-50 rounded-xl flex-shrink-0">
                          <div className="text-2xl">{getCategoryIcon(request.categoryId)}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                            {request.title}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                              <span className="text-blue-600 font-medium">{getCategoryName(request.categoryId)}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {request.location.split(",")[0]}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {new Date(request.preferredDate).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed line-clamp-3">{request.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 lg:min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <Badge className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1">
                            R$ {request.budget.min} - R$ {request.budget.max}
                          </Badge>
                        </div>
                        <Badge
                          className={`text-sm font-medium px-3 py-1 ${
                            request.urgency === "high"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : request.urgency === "medium"
                                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {request.urgency === "high" ? "🔴 Alta" : request.urgency === "medium" ? "🟡 Média" : "🟢 Baixa"} urgência
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {request.clientName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Postado {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            onClick={() => setSelectedRequest(request)} 
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
                            size="lg"
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Enviar Proposta
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg mx-4 sm:mx-auto">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Enviar Proposta</DialogTitle>
                            <DialogDescription className="text-gray-600">
                              {selectedRequest?.title}
                            </DialogDescription>
                          </DialogHeader>

                          <form onSubmit={handleSubmitProposal} className="space-y-6 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="price" className="text-sm font-medium">💰 Preço (R$)</Label>
                                <Input
                                  id="price"
                                  type="number"
                                  value={proposalForm.price}
                                  onChange={(e) => setProposalForm((prev) => ({ ...prev, price: e.target.value }))}
                                  placeholder="150"
                                  className="h-11"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="duration" className="text-sm font-medium">⏱️ Tempo Estimado</Label>
                                <Input
                                  id="duration"
                                  value={proposalForm.estimatedDuration}
                                  onChange={(e) =>
                                    setProposalForm((prev) => ({ ...prev, estimatedDuration: e.target.value }))
                                  }
                                  placeholder="2-3 horas"
                                  className="h-11"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="message" className="text-sm font-medium">💬 Mensagem</Label>
                              <Textarea
                                id="message"
                                value={proposalForm.message}
                                onChange={(e) => setProposalForm((prev) => ({ ...prev, message: e.target.value }))}
                                placeholder="Descreva sua experiência, como você pode ajudar e por que é a melhor escolha para este trabalho..."
                                rows={4}
                                className="resize-none"
                                required
                              />
                            </div>

                            <Button 
                              type="submit" 
                              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium" 
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Enviando...
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4" />
                                  Enviar Proposta
                                </div>
                              )}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Filtros Avançados
              {getActiveFiltersCount() > 0 && (
                <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Filtros de Pesquisa</DialogTitle>
              <DialogDescription className="text-gray-600">
                Use os filtros abaixo para encontrar as oportunidades ideais para você
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
              <div className="space-y-3">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Título ou descrição..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">Tipo de Serviço</Label>
                <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    {serviceCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">Local</Label>
                <Input
                  id="location"
                  placeholder="Cidade, estado..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="urgency" className="text-sm font-medium text-gray-700">Urgência</Label>
                <Select value={filters.urgency} onValueChange={(value) => handleFilterChange("urgency", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="minBudget" className="text-sm font-medium text-gray-700">Orçamento Mínimo</Label>
                <Input
                  id="minBudget"
                  type="number"
                  placeholder="R$ 0"
                  value={filters.minBudget}
                  onChange={(e) => handleFilterChange("minBudget", e.target.value)}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="maxBudget" className="text-sm font-medium text-gray-700">Orçamento Máximo</Label>
                <Input
                  id="maxBudget"
                  type="number"
                  placeholder="R$ 1000"
                  value={filters.maxBudget}
                  onChange={(e) => handleFilterChange("maxBudget", e.target.value)}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="dateFrom" className="text-sm font-medium text-gray-700">Data Inicial</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="dateTo" className="text-sm font-medium text-gray-700">Data Final</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <Button variant="outline" onClick={clearFilters} className="flex-1 bg-transparent hover:bg-gray-50">
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
              <Button onClick={() => setIsFilterModalOpen(false)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Check className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {getActiveFiltersCount() > 0 && (
          <Button variant="ghost" onClick={clearFilters} className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50">
            <X className="h-4 w-4 mr-1" />
            Limpar filtros ({getActiveFiltersCount()})
          </Button>
        )}

        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
          <Search className="h-4 w-4 inline mr-1" />
          {filteredOpportunities.length} oportunidade{filteredOpportunities.length !== 1 ? "s" : ""} encontrada
          {filteredOpportunities.length !== 1 ? "s" : ""}
        </div>
      </main>
    </div>
  )
}
