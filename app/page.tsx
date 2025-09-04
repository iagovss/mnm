"use client"

import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

const serviceCategories = [
  {
    id: "limpeza",
    name: "Limpeza",
    description: "Faxina, limpeza pós-obra, organização",
    icon: "🧹",
  },
  {
    id: "encanamento",
    name: "Encanamento",
    description: "Reparos, instalações, desentupimento",
    icon: "🔧",
  },
  {
    id: "eletrica",
    name: "Elétrica",
    description: "Instalações, reparos, manutenção",
    icon: "⚡",
  },
  {
    id: "educacao",
    name: "Educação",
    description: "Aulas particulares, reforço escolar",
    icon: "📚",
  },
  {
    id: "pets",
    name: "Pet Care",
    description: "Passeio, cuidados, veterinário",
    icon: "🐕",
  },
  {
    id: "jardinagem",
    name: "Jardinagem",
    description: "Paisagismo, manutenção, poda",
    icon: "🌱",
  },
]

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-white py-12 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 text-balance">
              Mão na Massa
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-blue-600 font-semibold mb-3 sm:mb-4">
              A plataforma que conecta você aos melhores profissionais
            </p>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto text-pretty px-4">
              Encontre prestadores de serviços qualificados em tempo real. Seguro, rápido e confiável para todas as suas
              necessidades.
            </p>

            {!user ? (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-4">
                <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto" asChild>
                  <Link href="/signup?type=client">Preciso de um serviço</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-transparent w-full sm:w-auto"
                  asChild
                >
                  <Link href="/signup?type=provider">Quero prestar serviços</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-4">
                <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto" asChild>
                  <Link href="/dashboard">Meu Dashboard</Link>
                </Button>
                {user.user_type?.includes("client") && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-transparent w-full sm:w-auto"
                    asChild
                  >
                    <Link href="/request">Solicitar Serviço</Link>
                  </Button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto px-4">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">10k+</div>
                <div className="text-sm sm:text-base text-gray-600">Serviços realizados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">5k+</div>
                <div className="text-sm sm:text-base text-gray-600">Profissionais cadastrados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">4.8★</div>
                <div className="text-sm sm:text-base text-gray-600">Avaliação média</div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12 px-4">
              Por que escolher o Mão na Massa?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="text-center px-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl sm:text-2xl">🛡️</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Segurança</h3>
                <p className="text-gray-600 text-sm">Profissionais verificados e pagamentos protegidos</p>
              </div>

              <div className="text-center px-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl sm:text-2xl">⚡</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Rapidez</h3>
                <p className="text-gray-600 text-sm">Conexão em tempo real com profissionais disponíveis</p>
              </div>

              <div className="text-center px-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl sm:text-2xl">💬</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Comunicação</h3>
                <p className="text-gray-600 text-sm">Chat integrado e agendamento simplificado</p>
              </div>

              <div className="text-center px-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl sm:text-2xl">⭐</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Qualidade</h3>
                <p className="text-gray-600 text-sm">Sistema de avaliações e profissionais qualificados</p>
              </div>
            </div>
          </div>
        </section>

        {/* Service Categories */}
        <section className="py-12 sm:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4 px-4">
              Categorias de Serviços
            </h2>
            <p className="text-gray-600 text-center mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
              Encontre profissionais especializados em diversas áreas para atender todas as suas necessidades
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {serviceCategories.map((category) => (
                <Card
                  key={category.id}
                  className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer mx-2 sm:mx-0"
                >
                  {user?.user_type?.includes("client") ? (
                    <Link href={`/request?category=${category.id}`}>
                      <CardContent className="p-4 sm:p-6 text-center">
                        <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{category.icon}</div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                        <p className="text-gray-600 text-sm">{category.description}</p>
                      </CardContent>
                    </Link>
                  ) : (
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{category.icon}</div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                      <p className="text-gray-600 text-sm">{category.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="bg-white py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4 px-4">Como Funciona</h2>
            <p className="text-gray-600 text-center mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
              Um processo simples e eficiente para conectar você ao profissional ideal
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-8">
              <div className="text-center px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <span className="text-white font-bold text-xl sm:text-2xl">1</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Descreva seu serviço</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Conte-nos o que precisa, quando precisa e qual seu orçamento
                </p>
              </div>

              <div className="text-center px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <span className="text-white font-bold text-xl sm:text-2xl">2</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Receba propostas</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Profissionais qualificados da sua região enviam propostas personalizadas
                </p>
              </div>

              <div className="text-center px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <span className="text-white font-bold text-xl sm:text-2xl">3</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Escolha e contrate</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Compare propostas, converse pelo chat e contrate o melhor profissional
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-12 sm:py-16 bg-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12 px-4">
              O que nossos usuários dizem
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <Card className="bg-white mx-2 sm:mx-0">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-yellow-400 text-base sm:text-lg">⭐⭐⭐⭐⭐</div>
                  </div>
                  <p className="text-gray-600 mb-4 italic text-sm sm:text-base">
                    "Encontrei um eletricista excelente em menos de 2 horas. O serviço foi impecável e o preço justo!"
                  </p>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">Maria Silva</div>
                  <div className="text-xs sm:text-sm text-gray-500">Cliente</div>
                </CardContent>
              </Card>

              <Card className="bg-white mx-2 sm:mx-0">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-yellow-400 text-base sm:text-lg">⭐⭐⭐⭐⭐</div>
                  </div>
                  <p className="text-gray-600 mb-4 italic text-sm sm:text-base">
                    "Como prestador de serviços, consegui aumentar minha clientela em 300%. A plataforma é fantástica!"
                  </p>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">João Santos</div>
                  <div className="text-xs sm:text-sm text-gray-500">Prestador de Serviços</div>
                </CardContent>
              </Card>

              <Card className="bg-white mx-2 sm:mx-0 md:col-span-2 lg:col-span-1">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-yellow-400 text-base sm:text-lg">⭐⭐⭐⭐⭐</div>
                  </div>
                  <p className="text-gray-600 mb-4 italic text-sm sm:text-base">
                    "Processo super seguro e fácil. O chat integrado facilitou muito a comunicação com o profissional."
                  </p>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">Ana Costa</div>
                  <div className="text-xs sm:text-sm text-gray-500">Cliente</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 px-4">Pronto para começar?</h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 px-4">
              Junte-se a milhares de usuários que já confiam no Mão na Massa
            </p>

            {!user ? (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
                  asChild
                >
                  <Link href="/signup?type=client">Encontrar Profissionais</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 text-white border-white hover:bg-white hover:text-blue-600 bg-transparent w-full sm:w-auto"
                  asChild
                >
                  <Link href="/signup?type=provider">Oferecer Serviços</Link>
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
                asChild
              >
                <Link href="/dashboard">Acessar Dashboard</Link>
              </Button>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
