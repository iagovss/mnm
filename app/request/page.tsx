"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MapPin } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { brazilianStates, getCitiesByState } from "@/lib/brazilian-locations"

export default function RequestServicePage() {
  const { user } = useAuth()
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [formData, setFormData] = useState({
    categoryId: "",
    title: "",
    description: "",
    address: "",
    city: "",
    state: "",
    customCity: "",
    minBudget: "",
    maxBudget: "",
    urgency: "medium" as "low" | "medium" | "high",
    preferredDate: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [serviceCategories, setServiceCategories] = useState<any[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase.from("service_categories").select("*").order("name")

      if (data && !error) {
        setServiceCategories(data)
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    if (formData.state) {
      const cities = getCitiesByState(formData.state)
      setAvailableCities(cities)
      // Reset city when state changes
      setFormData((prev) => ({ ...prev, city: "", customCity: "" }))
    }
  }, [formData.state])

  const getCurrentLocation = () => {
    setIsGettingLocation(true)

    if (!navigator.geolocation) {
      setError("Geolocalização não é suportada neste navegador")
      setIsGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          // Use reverse geocoding to get address (using a free service)
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`,
          )

          if (response.ok) {
            const data = await response.json()
            setFormData((prev) => ({
              ...prev,
              address: `${data.locality || ""}, ${data.principalSubdivision || ""}`,
              city: data.city || data.locality || "",
              state: data.principalSubdivisionCode || "",
            }))
          }
        } catch (err) {
          console.error("Erro ao obter localização:", err)
          setError("Erro ao obter sua localização")
        } finally {
          setIsGettingLocation(false)
        }
      },
      (error) => {
        console.error("Geolocation error:", error)
        setError("Não foi possível obter sua localização")
        setIsGettingLocation(false)
      },
    )
  }

  if (!user) {
    router.push("/login")
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Redirecionando para login...</div>
        </div>
      </div>
    )
  }

  if (user.user_type && !user.user_type.includes("client")) {
    router.push("/dashboard")
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Acesso restrito a clientes. Redirecionando...</div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("[v0] Creating service request with data:", formData)

      const finalCity = formData.city === "Outra cidade..." ? formData.customCity : formData.city

      const { data, error } = await supabase
        .from("service_requests")
        .insert({
          client_id: user.id,
          category_id: formData.categoryId,
          title: formData.title,
          description: formData.description,
          location: `${formData.address}, ${finalCity}, ${formData.state}`,
          budget_min: Number.parseInt(formData.minBudget),
          budget_max: Number.parseInt(formData.maxBudget),
          urgency: formData.urgency,
          scheduled_date: formData.preferredDate ? new Date(formData.preferredDate).toISOString() : null,
          status: "open",
        })
        .select()

      if (error) {
        console.error("[v0] Error creating service request:", error)
        throw error
      }

      console.log("[v0] Service request created successfully:", data)
      router.push("/dashboard")
    } catch (err) {
      console.error("[v0] Service request creation failed:", err)
      setError("Erro ao criar solicitação. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCategory = serviceCategories.find((cat) => cat.id === formData.categoryId)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Solicitar Serviço</CardTitle>
            <CardDescription>
              Descreva o serviço que você precisa e receba propostas de profissionais qualificados
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoria do Serviço</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center space-x-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Título do Serviço</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Faxina completa apartamento 2 quartos"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição Detalhada</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva em detalhes o que você precisa..."
                  rows={4}
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Localização</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="flex items-center space-x-2 bg-transparent"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>{isGettingLocation ? "Obtendo..." : "Usar minha localização"}</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, número, bairro"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {brazilianStates.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name} ({state.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, city: value }))}
                      disabled={!formData.state}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={formData.state ? "Selecione a cidade" : "Selecione o estado primeiro"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                        <SelectItem value="Outra cidade...">Outra cidade...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.city === "Outra cidade..." && (
                  <div className="space-y-2">
                    <Label htmlFor="customCity">Digite o nome da cidade</Label>
                    <Input
                      id="customCity"
                      value={formData.customCity}
                      onChange={(e) => setFormData((prev) => ({ ...prev, customCity: e.target.value }))}
                      placeholder="Nome da cidade"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Budget */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Orçamento (R$)</Label>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minBudget">Mínimo</Label>
                    <Input
                      id="minBudget"
                      type="number"
                      value={formData.minBudget}
                      onChange={(e) => setFormData((prev) => ({ ...prev, minBudget: e.target.value }))}
                      placeholder="100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxBudget">Máximo</Label>
                    <Input
                      id="maxBudget"
                      type="number"
                      value={formData.maxBudget}
                      onChange={(e) => setFormData((prev) => ({ ...prev, maxBudget: e.target.value }))}
                      placeholder="200"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Urgency */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Urgência</Label>
                <RadioGroup
                  value={formData.urgency}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, urgency: value as any }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="cursor-pointer">
                      Baixa - Posso aguardar alguns dias
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="cursor-pointer">
                      Média - Preciso em 1-2 dias
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high" className="cursor-pointer">
                      Alta - Preciso hoje ou amanhã
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Preferred Date */}
              <div className="space-y-2">
                <Label htmlFor="preferredDate">Data Preferida</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, preferredDate: e.target.value }))}
                  required
                />
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Criando solicitação..." : "Solicitar Serviço"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
