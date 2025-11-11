import { redirect } from "next/navigation"

import { LogoutButton } from "@/components/logout-button"
import {
  MobileNav,
  SidebarNav,
  type DashboardNavItem,
} from "@/components/dashboard/navigation"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/server"
import { LogOut } from "lucide-react"

const stats = [
  {
    label: "Agendamentos de hoje",
    value: "3",
    helper: "Visualize os agendamentos previstos para hoje",
  },
  {
    label: "Agendamentos totais",
    value: "15",
    helper: "Soma de agendamentos registrados",
  },
  {
    label: "Receita",
    value: "R$ 2.500,00",
    timeframe: "Ultimos 7 dias",
  },
]

const appointments = [
  { client: "Lucas", time: "14:00", service: "Corte de cabelo" },
  { client: "Mariana", time: "16:30", service: "Barba" },
  { client: "Eduardo", time: "18:00", service: "Corte + Barba" },
]

const navigationItems: DashboardNavItem[] = [
  { label: "Dashboard", icon: "layout-grid", href: "/dashboard" },
  { label: "Serviços", icon: "scissors", href: "/services" },
  { label: "Agendamentos", icon: "calendar-days", href: "/schedules" },
  { label: "Horários", icon: "clock", href: "/business-hours" },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    redirect("/auth/login")
  }

  const { data: claimsData } = await supabase.auth.getClaims()
  const hasClaims = claimsData?.claims && Object.keys(claimsData.claims).length > 0

  if (!hasClaims) {
    redirect("/auth/login")
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#050505] text-foreground lg:flex-row">
      <aside className="hidden border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent px-6 py-6 shadow-lg shadow-black/20 backdrop-blur lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex flex-col gap-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Administrador</p>
            <h1 className="mt-2 text-2xl font-black text-yellow-400">Painel</h1>
          </div>

          <SidebarNav items={navigationItems} />
        </div>
      </aside>

      <main className="relative flex-1 px-6 pb-28 pt-10 lg:px-12 lg:pb-12">
        <header className="flex flex-col gap-6 pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-yellow-400 lg:text-4xl">Bem-vindo</h2>
            <p className="text-white">Acompanhe seus agendamentos e resultados.</p>
          </div>
          <div className="flex items-center justify-end">
            <LogoutButton
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-full border border-white/15 bg-transparent text-white/70 transition hover:border-yellow-400 hover:bg-white/5 hover:text-yellow-400"
              aria-label="Encerrar sessão"
            >
              <LogOut className="h-4 w-4" />
            </LogoutButton>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="border-white/[0.08] bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent shadow-lg shadow-black/20"
            >
              <CardHeader className="space-y-3">
                <CardTitle className="text-3xl font-semibold text-white lg:text-4xl">
                  {stat.value}
                </CardTitle>
                <CardDescription className="text-sm uppercase tracking-[0.35em] text-white/50">
                  {stat.label}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                {stat.timeframe ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/70">
                    {stat.timeframe}
                  </div>
                ) : (
                  <p className="text-xs text-white/60">{stat.helper}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-10 space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-white">Agendamentos de hoje</h3>
            <p className="text-sm text-white/60">Resumo dos proximos compromissos</p>
          </div>

          <Card className="overflow-hidden border-white/[0.07] bg-black/40">
            <CardContent className="p-0">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead>
                  <tr className="bg-white/[0.02] text-xs uppercase tracking-[0.2em] text-white/50">
                    <th className="px-6 py-4 text-yellow-400">Cliente</th>
                    <th className="px-6 py-4 text-yellow-400">Horário</th>
                    <th className="px-6 py-4 text-yellow-400">Serviço</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {appointments.map((appointment) => (
                    <tr
                      key={`${appointment.client}-${appointment.time}`}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-white">{appointment.client}</td>
                      <td className="px-6 py-4 text-sm">{appointment.time}</td>
                      <td className="px-6 py-4 text-sm text-white/80">{appointment.service}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      </main>

      <MobileNav items={navigationItems} />
    </div>
  )
}
