import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle, Clock } from "lucide-react"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">Conta criada com sucesso!</CardTitle>
          <CardDescription>Confirme seu email para ativar sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <Mail className="w-5 h-5" />
              <span className="font-medium">Email de confirmação enviado</span>
            </div>

            <p className="text-sm text-gray-600">
              Enviamos um link de confirmação para seu email. Você precisa clicar no link para:
            </p>

            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Ativar sua conta no Mão na Massa</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Completar seu perfil com todas as informações</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Começar a usar a plataforma</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Importante: Verifique também sua caixa de spam</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/login">Ir para Login</Link>
            </Button>

            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/">Voltar ao Início</Link>
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              Não recebeu o email? Verifique sua caixa de spam ou{" "}
              <Link href="/auth/resend-confirmation" className="text-blue-600 hover:underline">
                reenvie a confirmação
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
