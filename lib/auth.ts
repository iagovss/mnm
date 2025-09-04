// Mock authentication system - can be upgraded to real auth later
export interface User {
  id: string
  name: string
  email: string
  type: "client" | "provider"
  avatar?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
}

// Mock users for demonstration
const mockUsers: User[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@email.com",
    type: "client",
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria@email.com",
    type: "provider",
  },
]

export const authService = {
  async login(email: string, password: string): Promise<User> {
    // Mock login - find user by email
    const user = mockUsers.find((u) => u.email === email)
    if (!user) {
      throw new Error("Usuário não encontrado")
    }
    return user
  },

  async signup(name: string, email: string, password: string, type: "client" | "provider"): Promise<User> {
    // Mock signup - create new user
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      type,
    }
    mockUsers.push(newUser)
    return newUser
  },

  async logout(): Promise<void> {
    // Mock logout
    return Promise.resolve()
  },
}
