"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Phone, Mail, Facebook, Chrome } from "lucide-react"
import Link from "next/link"
import { brazilianStates, getCitiesByState } from "@/lib/brazilian-locations"

const serviceCategories = [
  "Encanador",
  "Eletricista",
  "Pedreiro",
  "Pintor",
  "Marceneiro",
  "Jardineiro",
  "Faxineiro",
  "Cozinheiro",
  "Babá",
  "Cuidador de Idosos",
  "Professor Particular",
  "Personal Trainer",
  "Massagista",
  "Veterinário",
  "Técnico em Informática",
  "Mecânico",
  "Costureira",
  "Fotógrafo",
]

export default function SignupPage() {
  const searchParams = useSearchParams()
  const initialType =
    (searchParams.get("type") as "client-person" | "client-company" | "provider-person" | "provider-company") ||
    "client-person"

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    cnpj: "",
    companyName: "",
    fantasyName: "",
    password: "",
    confirmPassword: "",
    address: {
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "", // Added state field
      cep: "",
    },
    // Provider specific fields
    categories: [] as string[],
    bio: "",
    hourlyRate: "",
    serviceRate: "",
    availability: {
      monday: { available: false, start: "08:00", end: "18:00" },
      tuesday: { available: false, start: "08:00", end: "18:00" },
      wednesday: { available: false, start: "08:00", end: "18:00" },
      thursday: { available: false, start: "08:00", end: "18:00" },
      friday: { available: false, start: "08:00", end: "18:00" },
      saturday: { available: false, start: "08:00", end: "18:00" },
      sunday: { available: false, start: "08:00", end: "18:00" },
    },
    serviceRadius: "",
    bankAccount: "",
    pricingType: "hourly",
  })

  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [customCity, setCustomCity] = useState("")
  const [showCustomCity, setShowCustomCity] = useState(false)

  const [userType, setUserType] = useState<"client-person" | "client-company" | "provider-person" | "provider-company">(
    "client-person",
  )
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptNotifications, setAcceptNotifications] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1)

  const { signup } = useAuth()
  const router = useRouter()

  const isCompany = userType.includes("company")
  const isProvider = userType.includes("provider")

  const handleStateChange = (stateCode: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, state: stateCode, city: "" },
    }))
    const cities = getCitiesByState(stateCode)
    setAvailableCities(cities)
    setShowCustomCity(false)
    setCustomCity("")
  }

  const handleCityChange = (city: string) => {
    if (city === "custom") {
      setShowCustomCity(true)
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, city: "" },
      }))
    } else {
      setShowCustomCity(false)
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, city },
      }))
    }
  }

  const handleCustomCityChange = (value: string) => {
    setCustomCity(value)
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, city: value },
    }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert("Arquivo muito grande. Máximo 5MB.")
        return
      }

      if (!file.type.startsWith("image/")) {
        alert("Por favor, selecione apenas arquivos de imagem.")
        return
      }

      setProfilePhoto(file)
      const reader = new FileReader()
      reader.onload = (e) => setPhotoPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const toggleCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  const handlePhoneVerification = () => {
    setPhoneVerified(true)
    alert("Código de verificação enviado via WhatsApp!")
  }

  const handleSocialLogin = (provider: string) => {
    alert(`Login com ${provider} será implementado em breve!`)
  }

  const handleAvailabilityChange = (day: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day as keyof typeof prev.availability],
          [field]: value,
        },
      },
    }))
  }

  const validateStep1 = () => {
    const baseValidation =
      formData.name &&
      formData.email &&
      formData.phone &&
      formData.password &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      profilePhoto &&
      acceptTerms

    if (isCompany) {
      return baseValidation && formData.cnpj && formData.companyName
    } else {
      return baseValidation && formData.cpf
    }
  }

  const validateStep2 = () => {
    if (!isProvider) {
      return formData.address.street && formData.address.city && formData.address.state && formData.address.cep
    } else {
      return formData.categories.length > 0 && formData.bio && formData.address.city && formData.address.state
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return

    setIsLoading(true)
    setError("")

    try {
      console.log("[v0] Starting basic signup process...")

      const signupData = {
        email: formData.email,
        password: formData.password,
        // Store all additional data in metadata for trigger processing after email confirmation
        metadata: {
          name: formData.name,
          phone: formData.phone,
          cpf_cnpj: isCompany ? formData.cnpj : formData.cpf,
          user_type: {
            "client-person": "client_individual",
            "client-company": "client_company",
            "provider-person": "provider_individual",
            "provider-company": "provider_company",
          }[userType],
          company_name: isCompany ? formData.companyName : null,
          fantasy_name: isCompany ? formData.fantasyName : null,
          address: formData.address,
          // Provider specific fields
          bio: isProvider ? formData.bio : null,
          categories: isProvider ? formData.categories : null,
          hourly_rate: isProvider && formData.hourlyRate ? Number.parseFloat(formData.hourlyRate) : null,
          service_rate: isProvider && formData.serviceRate ? Number.parseFloat(formData.serviceRate) : null,
          pricing_type: isProvider ? formData.pricingType : null,
          service_radius: isProvider && formData.serviceRadius ? Number.parseInt(formData.serviceRadius) : null,
          availability: isProvider ? formData.availability : null,
        },
      }

      console.log("[v0] Signup data prepared:", signupData)

      await signup(signupData)

      console.log("[v0] Basic signup completed, redirecting to email confirmation")
      router.push("/auth/signup-success")
    } catch (err: any) {
      console.log("[v0] Signup error:", err)
      setError(err.message || "Erro ao criar conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>{step === 1 ? "Informações básicas" : "Complete seu perfil"}</CardDescription>

          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? "bg-primary-500" : "bg-gray-300"}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? "bg-primary-500" : "bg-gray-300"}`} />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Tipo de conta</Label>
                <RadioGroup value={userType} onValueChange={(value) => setUserType(value as typeof userType)}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="client-person" id="client-person" />
                    <Label htmlFor="client-person" className="cursor-pointer flex-1">
                      <div className="font-medium">Cliente Pessoa Física</div>
                      <div className="text-sm text-gray-600">Preciso de serviços como pessoa física</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="client-company" id="client-company" />
                    <Label htmlFor="client-company" className="cursor-pointer flex-1">
                      <div className="font-medium">Cliente Empresa</div>
                      <div className="text-sm text-gray-600">Preciso de serviços para minha empresa</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="provider-person" id="provider-person" />
                    <Label htmlFor="provider-person" className="cursor-pointer flex-1">
                      <div className="font-medium">Prestador Pessoa Física</div>
                      <div className="text-sm text-gray-600">Quero oferecer serviços como autônomo</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="provider-company" id="provider-company" />
                    <Label htmlFor="provider-company" className="cursor-pointer flex-1">
                      <div className="font-medium">Prestador Empresa</div>
                      <div className="text-sm text-gray-600">Quero oferecer serviços como empresa</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Foto de perfil *</Label>
                <div className="flex items-center space-x-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview("")
                          setProfilePhoto(null)
                          const fileInput = document.getElementById("photo-upload") as HTMLInputElement
                          if (fileInput) fileInput.value = ""
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:border-primary-400 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => {
                        const fileInput = document.getElementById("photo-upload") as HTMLInputElement
                        if (fileInput) fileInput.click()
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {profilePhoto ? "Trocar foto" : "Escolher foto"}
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG ou GIF. Máximo 5MB.</p>
                  </div>
                </div>
                {!profilePhoto && <p className="text-sm text-red-600">Foto de perfil é obrigatória</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{isCompany ? "Nome do responsável" : "Nome completo"} *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={isCompany ? "Nome do responsável" : "Seu nome completo"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              {isCompany && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Razão Social *</Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Nome da empresa"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fantasyName">Nome Fantasia</Label>
                    <Input
                      id="fantasyName"
                      type="text"
                      value={formData.fantasyName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fantasyName: e.target.value }))}
                      placeholder="Nome fantasia (opcional)"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePhoneVerification}
                      disabled={phoneVerified}
                    >
                      {phoneVerified ? "✓" : <Phone className="w-4 h-4" />}
                    </Button>
                  </div>
                  {phoneVerified && <p className="text-sm text-green-600">Telefone verificado!</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={isCompany ? "cnpj" : "cpf"}>{isCompany ? "CNPJ" : "CPF"} *</Label>
                  <Input
                    id={isCompany ? "cnpj" : "cpf"}
                    type="text"
                    value={isCompany ? formData.cnpj : formData.cpf}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [isCompany ? "cnpj" : "cpf"]: e.target.value,
                      }))
                    }
                    placeholder={isCompany ? "00.000.000/0001-00" : "000.000.000-00"}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirme sua senha"
                    required
                  />
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-sm text-red-600">Senhas não coincidem</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Ou cadastre-se com</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin("Google")}
                    className="w-full"
                  >
                    <Chrome className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin("Facebook")}
                    className="w-full"
                  >
                    <Facebook className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="outline" onClick={() => handleSocialLogin("Apple")} className="w-full">
                    <Mail className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" checked={acceptTerms} onCheckedChange={setAcceptTerms} />
                  <Label htmlFor="terms" className="text-sm leading-5">
                    Aceito os{" "}
                    <Link href="/terms" className="text-primary-600 hover:underline">
                      Termos de Uso
                    </Link>{" "}
                    e a{" "}
                    <Link href="/privacy" className="text-primary-600 hover:underline">
                      Política de Privacidade
                    </Link>{" "}
                    *
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox id="notifications" checked={acceptNotifications} onCheckedChange={setAcceptNotifications} />
                  <Label htmlFor="notifications" className="text-sm">
                    Aceito receber notificações sobre serviços e promoções
                  </Label>
                </div>
              </div>

              <Button type="button" onClick={nextStep} className="w-full" disabled={!validateStep1()}>
                Continuar
              </Button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  {userType === "client-person" ? "Endereço principal" : "Área de atuação"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="street">Rua *</Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: { ...prev.address, street: e.target.value },
                        }))
                      }
                      placeholder="Nome da rua"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={formData.address.number}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: { ...prev.address, number: e.target.value },
                        }))
                      }
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.address.neighborhood}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: { ...prev.address, neighborhood: e.target.value },
                        }))
                      }
                      placeholder="Centro"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Select value={formData.address.state} onValueChange={handleStateChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {brazilianStates.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Select
                      value={showCustomCity ? "custom" : formData.address.city}
                      onValueChange={handleCityChange}
                      disabled={!formData.address.state}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={formData.address.state ? "Selecione a cidade" : "Selecione o estado primeiro"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Outra cidade...</SelectItem>
                      </SelectContent>
                    </Select>

                    {showCustomCity && (
                      <Input
                        value={customCity}
                        onChange={(e) => handleCustomCityChange(e.target.value)}
                        placeholder="Digite o nome da cidade"
                        className="mt-2"
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      value={formData.address.cep}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: { ...prev.address, cep: e.target.value },
                        }))
                      }
                      placeholder="00000-000"
                      required
                    />
                  </div>
                </div>
              </div>

              {userType.includes("provider") && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Informações profissionais</h3>

                    <div className="space-y-2">
                      <Label>Categorias de serviço *</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                        {serviceCategories.map((category) => (
                          <div
                            key={category}
                            onClick={() => toggleCategory(category)}
                            className={`cursor-pointer p-2 text-sm rounded border transition-colors ${
                              formData.categories.includes(category)
                                ? "bg-primary-100 border-primary-500 text-primary-700"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {category}
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.categories.map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                            <button
                              type="button"
                              onClick={() => toggleCategory(category)}
                              className="ml-1 hover:text-red-600"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Descrição do serviço *</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                        placeholder="Descreva sua experiência e serviços oferecidos..."
                        rows={3}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de cobrança</Label>
                        <RadioGroup
                          value={formData.pricingType}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, pricingType: value as "hourly" | "service" }))
                          }
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="hourly" id="hourly" />
                            <Label htmlFor="hourly">Por hora</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="service" id="service" />
                            <Label htmlFor="service">Por serviço</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rate">
                          {formData.pricingType === "hourly" ? "Preço por hora" : "Preço por serviço"} (opcional)
                        </Label>
                        <Input
                          id="rate"
                          value={formData.pricingType === "hourly" ? formData.hourlyRate : formData.serviceRate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [formData.pricingType === "hourly" ? "hourlyRate" : "serviceRate"]: e.target.value,
                            }))
                          }
                          placeholder={formData.pricingType === "hourly" ? "R$ 50,00/hora" : "R$ 150,00/serviço"}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Disponibilidade/Agenda</Label>
                      <div className="space-y-3 border rounded-lg p-4">
                        {Object.entries(formData.availability).map(([day, schedule]) => {
                          const dayNames = {
                            monday: "Segunda-feira",
                            tuesday: "Terça-feira",
                            wednesday: "Quarta-feira",
                            thursday: "Quinta-feira",
                            friday: "Sexta-feira",
                            saturday: "Sábado",
                            sunday: "Domingo",
                          }

                          return (
                            <div key={day} className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2 w-32">
                                <Checkbox
                                  id={day}
                                  checked={schedule.available}
                                  onCheckedChange={(checked) => handleAvailabilityChange(day, "available", checked)}
                                />
                                <Label htmlFor={day} className="text-sm">
                                  {dayNames[day as keyof typeof dayNames]}
                                </Label>
                              </div>

                              {schedule.available && (
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="time"
                                    value={schedule.start}
                                    onChange={(e) => handleAvailabilityChange(day, "start", e.target.value)}
                                    className="w-24"
                                  />
                                  <span className="text-sm text-gray-500">às</span>
                                  <Input
                                    type="time"
                                    value={schedule.end}
                                    onChange={(e) => handleAvailabilityChange(day, "end", e.target.value)}
                                    className="w-24"
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceRadius">Raio de atendimento (km)</Label>
                      <Select
                        value={formData.serviceRadius}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, serviceRadius: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 km</SelectItem>
                          <SelectItem value="10">10 km</SelectItem>
                          <SelectItem value="20">20 km</SelectItem>
                          <SelectItem value="50">50 km</SelectItem>
                          <SelectItem value="100">100+ km</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankAccount">Conta para recebimento (PIX/Banco)</Label>
                      <Input
                        id="bankAccount"
                        value={formData.bankAccount}
                        onChange={(e) => setFormData((prev) => ({ ...prev, bankAccount: e.target.value }))}
                        placeholder="Chave PIX ou dados bancários"
                      />
                    </div>
                  </div>
                </>
              )}

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

              <div className="flex space-x-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Voltar
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading || !validateStep2()}>
                  {isLoading ? "Criando conta..." : "Criar conta"}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Já tem uma conta? </span>
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
