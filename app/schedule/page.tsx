"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { scheduleService, type ScheduleSlot } from "@/lib/chat"

const statusLabels = {
  proposed: "Proposto",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
}

const statusColors = {
  proposed: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-100 text-gray-800",
}

export default function SchedulePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const loadSchedules = async () => {
      const userSchedules = await scheduleService.getSchedulesByUser(user.id, user.type)
      setSchedules(userSchedules)
      setIsLoading(false)
    }

    loadSchedules()
  }, [user])

  const handleStatusUpdate = async (scheduleId: string, status: ScheduleSlot["status"]) => {
    await scheduleService.updateScheduleStatus(scheduleId, status)
    const updatedSchedules = await scheduleService.getSchedulesByUser(user.id, user.type)
    setSchedules(updatedSchedules)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Carregando agendamentos...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agendamentos</h1>
            <p className="text-gray-600 mt-2">Gerencie seus compromissos e horários de serviço</p>
          </div>
        </div>

        {schedules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum agendamento ainda</h3>
              <p className="text-gray-600 mb-6">Seus agendamentos de serviços aparecerão aqui.</p>
              <Button asChild>
                <a href="/chat">Ver Conversas</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {new Date(schedule.date).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardTitle>
                      <CardDescription>
                        {schedule.startTime} - {schedule.endTime}
                      </CardDescription>
                    </div>

                    <Badge className={statusColors[schedule.status]}>{statusLabels[schedule.status]}</Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {schedule.notes && <p className="text-gray-600 mb-4">{schedule.notes}</p>}

                  <div className="flex space-x-2">
                    {schedule.status === "proposed" && user.type === "client" && (
                      <>
                        <Button size="sm" onClick={() => handleStatusUpdate(schedule.id, "confirmed")}>
                          Confirmar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(schedule.id, "cancelled")}
                        >
                          Recusar
                        </Button>
                      </>
                    )}

                    {schedule.status === "confirmed" && (
                      <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(schedule.id, "completed")}>
                        Marcar como Concluído
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
