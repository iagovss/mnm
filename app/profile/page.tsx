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
import { Checkbox } from "@/components/ui/checkbox"
import { providerService, serviceCategories, type ProviderProfile } from "@/lib/services"

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState<Partial<ProviderProfile>>({
    name: "",
    email: "",
    phone: "",
    bio: "",
    categories: [],
    location: {
      city: "",
      state: "",
      serviceRadius: 10,
    },
    pricing: {
      hourlyRate: 0,
    },
    availability: {
      days: [],
      hours: { start: "08:00", end: "18:00" },
    },
    verified: false,
    portfolio: [],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (user.type !== "provider") {
      router.push("/")
      return
    }

    const loadProfile = async () => {
      const existingProfile = await providerService.getProviderByUserId(user.id)
      if (existingProfile) {
        setProfile(existingProfile)
      } else {
        setProfile((prev) => ({
          ...prev,
          name: user.name,
          email: user.email,
        }))
        setIsEditing(true)
      }
    }

    loadProfile()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await providerService.createOrUpdateProfile({
        ...(profile as Omit<ProviderProfile, "id" | "createdAt" | "rating" | "reviewCount" | "completedJobs">),
        userId: user!.id,
      })
      setIsEditing(false)
    } catch (err) {
      setError("Erro ao salvar perfil. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setProfile((prev) => ({
      ...prev,
      categories: checked
        ? [...(prev.categories || []), categoryId]
        : (prev.categories || []).filter((id) => id !== categoryId),
    }))
  }

  const handleDayChange = (day: string, checked: boolean) => {
    setProfile((prev) => ({
      ...prev,
      availability: {
        ...prev.availability!,
        days: checked
          ? [...(prev.availability?.days || []), day]
          : (prev.availability?.days || []).filter((d) => d !== day),
      },
    }))
  }

  const weekDays = [
    { id: "monday", label: "Segunda-feira" },
    { id: "tuesday", label: "Terça-feira" },
    { id: "wednesday", label: "Quarta-feira" },
    { id: "thursday", label: "Quinta-feira" },
    { id: "friday", label: "Sexta-feira" },
    { id: "saturday", label: "Sábado" },
    { id: "sunday", label: "Domingo" },
  ]

  if (!user || user.type !== "provider") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
            <p className="text-gray-600 mt-2">Gerencie suas informações profissionais e disponibilidade</p>
          </div>

          {!isEditing && <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Profissionais</CardTitle>
            <CardDescription>Complete seu perfil para receber mais oportunidades de trabalho</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Descrição Profissional</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Descreva sua experiência, especialidades e diferenciais..."
                  rows={4}
                  disabled={!isEditing}
                  required
                />
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Categorias de Serviço</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {serviceCategories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={category.id}
                        checked={(profile.categories || []).includes(category.id)}
                        onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                        disabled={!isEditing}
                      />
                      <Label htmlFor={category.id} className="cursor-pointer text-sm">
                        {category.icon} {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Localização e Área de Atendimento</Label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={profile.location?.city}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          location: { ...prev.location!, city: e.target.value },
                        }))
                      }
                      placeholder="São Paulo"
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={profile.location?.state}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          location: { ...prev.location!, state: e.target.value },
                        }))
                      }
                      placeholder="SP"
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="radius">Raio de Atendimento (km)</Label>
                    <Input
                      id="radius"
                      type="number"
                      value={profile.location?.serviceRadius}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          location: { ...prev.location!, serviceRadius: Number.parseInt(e.target.value) },
                        }))
                      }
                      disabled={!isEditing}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Valor por Hora (R$)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={profile.pricing?.hourlyRate}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      pricing: { ...prev.pricing!, hourlyRate: Number.parseInt(e.target.value) },
                    }))
                  }
                  placeholder="50"
                  disabled={!isEditing}
                  required
                />
              </div>

              {/* Availability */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Disponibilidade</Label>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Dias da Semana</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {weekDays.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.id}
                          checked={(profile.availability?.days || []).includes(day.id)}
                          onCheckedChange={(checked) => handleDayChange(day.id, checked as boolean)}
                          disabled={!isEditing}
                        />
                        <Label htmlFor={day.id} className="cursor-pointer text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Horário de Início</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={profile.availability?.hours?.start}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          availability: {
                            ...prev.availability!,
                            hours: { ...prev.availability!.hours!, start: e.target.value },
                          },
                        }))
                      }
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">Horário de Término</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={profile.availability?.hours?.end}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          availability: {
                            ...prev.availability!,
                            hours: { ...prev.availability!.hours!, end: e.target.value },
                          },
                        }))
                      }
                      disabled={!isEditing}
                      required
                    />
                  </div>
                </div>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

              {isEditing && (
                <div className="flex space-x-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Salvando..." : "Salvar Perfil"}
                  </Button>

                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
