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
import { Upload, X, Phone, Mail, Facebook, Chrome, User, Building, Briefcase, Heart, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle, Sparkles } from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-blue-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-500/30 to-blue-700/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-300/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <Card className="relative backdrop-blur-sm bg-white/90 border-0 shadow-2xl w-full max-w-2xl">
        <CardHeader className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
              Criar Conta
            </CardTitle>
            <CardDescription className="text-blue-600 text-lg">
              {step === 1 ? "Informações básicas" : "Complete seu perfil"}
            </CardDescription>
          </div>

          <div className="flex justify-center mt-4">
            <div className="flex space-x-3">
              <div className={`w-4 h-4 rounded-full transition-all duration-300 ${step >= 1 ? "bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg" : "bg-gray-300"}`} />
              <div className={`w-4 h-4 rounded-full transition-all duration-300 ${step >= 2 ? "bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg" : "bg-gray-300"}`} />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Tipo de conta</Label>
                <RadioGroup value={userType} onValueChange={(value) => setUserType(value as typeof userType)}>
                  <div className="flex items-center space-x-3 p-4 border-2 border-blue-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 cursor-pointer">
                    <RadioGroupItem value="client-person" id="client-person" className="border-blue-300" />
                    <User className="w-5 h-5 text-blue-600" />
                    <Label htmlFor="client-person" className="cursor-pointer flex-1">
                      <div className="font-semibold text-gray-900">Cliente Pessoa Física</div>
                      <div className="text-sm text-blue-600">Preciso de serviços como pessoa física</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border-2 border-blue-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 cursor-pointer">
                    <RadioGroupItem value="client-company" id="client-company" className="border-blue-300" />
                    <Building className="w-5 h-5 text-blue-600" />
                    <Label htmlFor="client-company" className="cursor-pointer flex-1">
                      <div className="font-semibold text-gray-900">Cliente Empresa</div>
                      <div className="text-sm text-blue-600">Preciso de serviços para minha empresa</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border-2 border-blue-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 cursor-pointer">
                    <RadioGroupItem value="provider-person" id="provider-person" className="border-blue-300" />
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <Label htmlFor="provider-person" className="cursor-pointer flex-1">
                      <div className="font-semibold text-gray-900">Prestador Pessoa Física</div>
                      <div className="text-sm text-blue-600">Quero oferecer serviços como autônomo</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border-2 border-blue-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 cursor-pointer">
                    <RadioGroupItem value="provider-company" id="provider-company" className="border-blue-300" />
                    <Building className="w-5 h-5 text-blue-600" />
                    <Label htmlFor="provider-company" className="cursor-pointer flex-1">
                      <div className="font-semibold text-gray-900">Prestador Empresa</div>
                      <div className="text-sm text-blue-600">Quero oferecer serviços como empresa</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Foto de perfil *</Label>
                <div className="flex items-center space-x-6">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview("")
                          setProfilePhoto(null)
                          const fileInput = document.getElementById("photo-upload") as HTMLInputElement
                          if (fileInput) fileInput.value = ""
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-3 border-dashed border-blue-300 rounded-full flex items-center justify-center hover:border-blue-400 transition-colors bg-blue-50">
                      <Upload className="w-8 h-8 text-blue-400" />
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
                      className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                      onClick={() => {
                        const fileInput = document.getElementById("photo-upload") as HTMLInputElement
                        if (fileInput) fileInput.click()
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {profilePhoto ? "Trocar foto" : "Escolher foto"}
                    </Button>
                    <p className="text-xs text-blue-600 mt-2">JPG, PNG ou GIF. Máximo 5MB.</p>
                  </div>
                </div>
                {!profilePhoto && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">Foto de perfil é obrigatória</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">{isCompany ? "Nome do responsável" : "Nome completo"} *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder={isCompany ? "Nome do responsável" : "Seu nome completo"}
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      required
                    />
                  </div>
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
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Senha *</Label>
                  <div className="relative">
                    <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Mínimo 8 caracteres"
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirmar senha *</Label>
                  <div className="relative">
                    <EyeOff className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirme sua senha"
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      required
                    />
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">Senhas não coincidem</p>
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

              <Button 
                type="button" 
                onClick={nextStep} 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                disabled={!validateStep1()}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
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

              <div className="flex space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(1)} 
                  className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  <div className="flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </div>
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                  disabled={isLoading || !validateStep2()}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Criando conta...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Criar conta</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-blue-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-blue-500 font-medium">Já tem uma conta?</span>
              </div>
            </div>
            <div className="mt-4">
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                Entrar na conta
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
