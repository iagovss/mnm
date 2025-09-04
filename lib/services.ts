// Service categories and request management
export interface ServiceCategory {
  id: string
  name: string
  description: string
  icon: string
  subcategories?: string[]
}

export interface ServiceRequest {
  id: string
  clientId: string
  categoryId: string
  title: string
  description: string
  location: {
    address: string
    city: string
    state: string
  }
  budget: {
    min: number
    max: number
  }
  urgency: "low" | "medium" | "high"
  preferredDate: string
  status: "open" | "proposals" | "assigned" | "in-progress" | "completed" | "cancelled"
  createdAt: string
  proposals?: ServiceProposal[]
}

export interface ServiceProposal {
  id: string
  requestId: string
  providerId: string
  providerName: string
  providerRating: number
  price: number
  estimatedDuration: string
  message: string
  createdAt: string
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: "limpeza",
    name: "Limpeza",
    description: "Faxina, limpeza pós-obra, organização",
    icon: "🧹",
    subcategories: ["Faxina residencial", "Limpeza pós-obra", "Organização", "Limpeza de escritório"],
  },
  {
    id: "encanamento",
    name: "Encanamento",
    description: "Reparos, instalações, desentupimento",
    icon: "🔧",
    subcategories: ["Vazamentos", "Desentupimento", "Instalação de torneiras", "Reparo de canos"],
  },
  {
    id: "eletrica",
    name: "Elétrica",
    description: "Instalações, reparos, manutenção",
    icon: "⚡",
    subcategories: ["Instalação de tomadas", "Reparo de fiação", "Instalação de lustres", "Quadro elétrico"],
  },
  {
    id: "educacao",
    name: "Educação",
    description: "Aulas particulares, reforço escolar",
    icon: "📚",
    subcategories: ["Matemática", "Português", "Inglês", "Reforço escolar", "Preparação para vestibular"],
  },
  {
    id: "pets",
    name: "Pet Care",
    description: "Passeio, cuidados, veterinário",
    icon: "🐕",
    subcategories: ["Passeio de cães", "Pet sitting", "Banho e tosa", "Adestramento"],
  },
  {
    id: "jardinagem",
    name: "Jardinagem",
    description: "Paisagismo, manutenção, poda",
    icon: "🌱",
    subcategories: ["Poda de árvores", "Manutenção de jardim", "Paisagismo", "Plantio"],
  },
]

// Mock service requests
const mockRequests: ServiceRequest[] = [
  {
    id: "1",
    clientId: "1",
    categoryId: "limpeza",
    title: "Faxina completa apartamento 2 quartos",
    description:
      "Preciso de uma faxina completa no meu apartamento de 2 quartos. Inclui cozinha, banheiros, quartos e sala.",
    location: {
      address: "Rua das Flores, 123",
      city: "São Paulo",
      state: "SP",
    },
    budget: { min: 150, max: 250 },
    urgency: "medium",
    preferredDate: "2024-01-20",
    status: "open",
    createdAt: "2024-01-15T10:00:00Z",
  },
]

export const serviceRequestService = {
  async createRequest(request: Omit<ServiceRequest, "id" | "createdAt" | "status">): Promise<ServiceRequest> {
    const newRequest: ServiceRequest = {
      ...request,
      id: Date.now().toString(),
      status: "open",
      createdAt: new Date().toISOString(),
    }
    mockRequests.push(newRequest)
    return newRequest
  },

  async getRequestsByClient(clientId: string): Promise<ServiceRequest[]> {
    return mockRequests.filter((req) => req.clientId === clientId)
  },

  async getRequestById(id: string): Promise<ServiceRequest | null> {
    return mockRequests.find((req) => req.id === id) || null
  },

  async updateRequestStatus(id: string, status: ServiceRequest["status"]): Promise<void> {
    const request = mockRequests.find((req) => req.id === id)
    if (request) {
      request.status = status
    }
  },

  async getAllRequests(): Promise<ServiceRequest[]> {
    return mockRequests
  },
}

// Provider profile interface and matching system
export interface ProviderProfile {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  bio: string
  categories: string[]
  location: {
    city: string
    state: string
    serviceRadius: number // km
  }
  pricing: {
    hourlyRate?: number
    fixedRates?: { [categoryId: string]: number }
  }
  availability: {
    days: string[]
    hours: { start: string; end: string }
  }
  rating: number
  reviewCount: number
  completedJobs: number
  verified: boolean
  portfolio: string[]
  createdAt: string
}

// Mock provider profiles
const mockProviders: ProviderProfile[] = [
  {
    id: "1",
    userId: "2",
    name: "Maria Santos",
    email: "maria@email.com",
    phone: "(11) 99999-9999",
    bio: "Profissional de limpeza com 5 anos de experiência. Especializada em limpeza residencial e pós-obra.",
    categories: ["limpeza"],
    location: {
      city: "São Paulo",
      state: "SP",
      serviceRadius: 15,
    },
    pricing: {
      hourlyRate: 25,
      fixedRates: { limpeza: 150 },
    },
    availability: {
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      hours: { start: "08:00", end: "17:00" },
    },
    rating: 4.8,
    reviewCount: 127,
    completedJobs: 89,
    verified: true,
    portfolio: [],
    createdAt: "2023-06-15T10:00:00Z",
  },
  {
    id: "2",
    userId: "3",
    name: "Carlos Silva",
    email: "carlos@email.com",
    phone: "(11) 88888-8888",
    bio: "Encanador experiente com certificação profissional. Atendo emergências 24h.",
    categories: ["encanamento"],
    location: {
      city: "São Paulo",
      state: "SP",
      serviceRadius: 20,
    },
    pricing: {
      hourlyRate: 45,
      fixedRates: { encanamento: 80 },
    },
    availability: {
      days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      hours: { start: "07:00", end: "19:00" },
    },
    rating: 4.9,
    reviewCount: 203,
    completedJobs: 156,
    verified: true,
    portfolio: [],
    createdAt: "2023-03-10T10:00:00Z",
  },
  {
    id: "3",
    userId: "4",
    name: "Ana Costa",
    email: "ana@email.com",
    phone: "(11) 77777-7777",
    bio: "Professora de matemática e física com mestrado. Especializada em preparação para vestibular.",
    categories: ["educacao"],
    location: {
      city: "São Paulo",
      state: "SP",
      serviceRadius: 25,
    },
    pricing: {
      hourlyRate: 60,
      fixedRates: { educacao: 80 },
    },
    availability: {
      days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      hours: { start: "14:00", end: "22:00" },
    },
    rating: 4.7,
    reviewCount: 89,
    completedJobs: 67,
    verified: true,
    portfolio: [],
    createdAt: "2023-08-20T10:00:00Z",
  },
]

// Provider service functions
export const providerService = {
  async getProviderByUserId(userId: string): Promise<ProviderProfile | null> {
    return mockProviders.find((provider) => provider.userId === userId) || null
  },

  async createOrUpdateProfile(
    profile: Omit<ProviderProfile, "id" | "createdAt" | "rating" | "reviewCount" | "completedJobs">,
  ): Promise<ProviderProfile> {
    const existingProvider = mockProviders.find((p) => p.userId === profile.userId)

    if (existingProvider) {
      Object.assign(existingProvider, profile)
      return existingProvider
    } else {
      const newProvider: ProviderProfile = {
        ...profile,
        id: Date.now().toString(),
        rating: 0,
        reviewCount: 0,
        completedJobs: 0,
        createdAt: new Date().toISOString(),
      }
      mockProviders.push(newProvider)
      return newProvider
    }
  },

  async findMatchingProviders(request: ServiceRequest): Promise<ProviderProfile[]> {
    return mockProviders
      .filter((provider) => {
        // Match category
        const categoryMatch = provider.categories.includes(request.categoryId)

        // Match location (simplified - same city)
        const locationMatch = provider.location.city === request.location.city

        // Match budget (if provider has fixed rates)
        const budgetMatch =
          !provider.pricing.fixedRates?.[request.categoryId] ||
          provider.pricing.fixedRates[request.categoryId] <= request.budget.max

        return categoryMatch && locationMatch && budgetMatch
      })
      .sort((a, b) => b.rating - a.rating) // Sort by rating
  },

  async getAllProviders(): Promise<ProviderProfile[]> {
    return mockProviders
  },
}

// Proposal service functions
const mockProposals: ServiceProposal[] = []

export const proposalService = {
  async createProposal(proposal: Omit<ServiceProposal, "id" | "createdAt">): Promise<ServiceProposal> {
    const newProposal: ServiceProposal = {
      ...proposal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    mockProposals.push(newProposal)

    // Update request status to 'proposals'
    const request = mockRequests.find((req) => req.id === proposal.requestId)
    if (request) {
      request.status = "proposals"
      if (!request.proposals) request.proposals = []
      request.proposals.push(newProposal)

      const { notificationService } = await import("./notifications")
      await notificationService.createNotification({
        userId: request.clientId,
        type: "proposal_received",
        title: "Nova proposta recebida",
        message: `${proposal.providerName} enviou uma proposta para "${request.title}"`,
        read: false,
        relatedId: request.id,
        actionUrl: "/dashboard",
      })
    }

    return newProposal
  },

  async getProposalsByRequest(requestId: string): Promise<ServiceProposal[]> {
    return mockProposals.filter((proposal) => proposal.requestId === requestId)
  },

  async getProposalsByProvider(providerId: string): Promise<ServiceProposal[]> {
    return mockProposals.filter((proposal) => proposal.providerId === providerId)
  },
}
