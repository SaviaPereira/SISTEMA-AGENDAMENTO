"use client";

import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";

import { LogOut } from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import {
  MobileNav,
  SidebarNav,
  type DashboardNavItem,
} from "@/components/dashboard/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/client";
import { cn } from "@/lib/utils";

type TodayAppointment = {
  id: string;
  clientName: string;
  horaAgendada: string;
  serviceName: string;
};

type DashboardStats = {
  todayCount: number;
  totalCount: number;
  revenue: number;
  todayAppointments: TodayAppointment[];
};

const navigationItems: DashboardNavItem[] = [
  { label: "Dashboard", icon: "layout-grid", href: "/dashboard" },
  { label: "Serviços", icon: "scissors", href: "/services" },
  { label: "Agendamentos", icon: "calendar-days", href: "/schedules" },
  { label: "Clientes", icon: "user", href: "/clients" },
  { label: "Configurações", icon: "settings", href: "/config" },
];

export function DashboardClient(): JSX.Element {
  const [period, setPeriod] = useState<"7" | "15" | "30">("7");
  const [stats, setStats] = useState<DashboardStats>({
    todayCount: 0,
    totalCount: 0,
    revenue: 0,
    todayAppointments: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Get today's date in YYYY-MM-DD format (using local date to avoid timezone issues)
  const today = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Calculate date range based on period (using local dates to avoid timezone issues)
  const dateRange = useMemo(() => {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - parseInt(period, 10));
    
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    
    return {
      start: formatDate(startDate),
      end: formatDate(endDate),
    };
  }, [period]);

  // Format currency
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      }),
    [],
  );

  // Load dashboard data
  useEffect(() => {
    async function loadDashboardData(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Get today's appointments count and list
        const { data: todaySchedules, error: todayError } = await supabase
          .from("schedules")
          .select("id, client_id, service_id, data_agendada, hora_agendada")
          .eq("data_agendada", today)
          .order("hora_agendada", { ascending: true });

        if (todayError) {
          console.error("[dashboard] erro ao buscar agendamentos de hoje:", todayError);
        }

        // Get related clients and services
        const clientIds = [
          ...new Set(todaySchedules?.map((s) => s.client_id) ?? []),
        ];
        const serviceIds = [
          ...new Set(todaySchedules?.map((s) => s.service_id) ?? []),
        ];

        const { data: clientsData } =
          clientIds.length > 0
            ? await supabase.from("clients").select("id, name").in("id", clientIds)
            : { data: null, error: null };

        const { data: servicesData } =
          serviceIds.length > 0
            ? await supabase.from("services").select("id, name").in("id", serviceIds)
            : { data: null, error: null };

        const clientsMap = new Map(
          clientsData?.map((c) => [c.id, c.name]) ?? [],
        );
        const servicesMap = new Map(
          servicesData?.map((s) => [s.id, s.name]) ?? [],
        );

        const todayAppointments: TodayAppointment[] =
          todaySchedules?.map((schedule) => {
            // Format time (HH:MM:SS -> HH:MM)
            const timeParts = schedule.hora_agendada.split(":");
            const formattedTime = `${timeParts[0]}:${timeParts[1]}`;
            
            return {
              id: schedule.id,
              clientName: clientsMap.get(schedule.client_id) ?? "Cliente não encontrado",
              horaAgendada: formattedTime,
              serviceName: servicesMap.get(schedule.service_id) ?? "Serviço não encontrado",
            };
          }) ?? [];

        // 2. Get total appointments in period
        const { data: periodSchedules, error: periodError } = await supabase
          .from("schedules")
          .select("id")
          .gte("data_agendada", dateRange.start)
          .lte("data_agendada", dateRange.end);

        if (periodError) {
          console.error("[dashboard] erro ao buscar agendamentos do período:", periodError);
        }

        // 3. Get revenue (sum of values) for period with status "concluído" or "pago"
        const { data: revenueSchedules, error: revenueError } = await supabase
          .from("schedules")
          .select("valor")
          .gte("data_agendada", dateRange.start)
          .lte("data_agendada", dateRange.end)
          .in("status", ["concluído", "pago"]);

        if (revenueError) {
          console.error("[dashboard] erro ao buscar receita:", revenueError);
        }

        const revenue =
          revenueSchedules?.reduce((sum, schedule) => {
            const value =
              typeof schedule.valor === "number"
                ? schedule.valor
                : Number(schedule.valor ?? 0);
            return sum + value;
          }, 0) ?? 0;

        setStats({
          todayCount: todayAppointments.length,
          totalCount: periodSchedules?.length ?? 0,
          revenue,
          todayAppointments,
        });
      } catch (err) {
        console.error("[dashboard] erro ao carregar dados:", err);
        setError("Não foi possível carregar os dados do dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [supabase, today, dateRange]);

  const statsData = [
    {
      label: "Agendamentos de hoje",
      value: stats.todayCount.toString(),
      helper: "Visualize os agendamentos previstos para hoje",
    },
    {
      label: "Agendamentos totais",
      value: stats.totalCount.toString(),
      helper: `Soma de agendamentos registrados nos últimos ${period} dias`,
    },
    {
      label: "Receita",
      value: currencyFormatter.format(stats.revenue),
      timeframe: `Últimos ${period} dias`,
      period,
      onPeriodChange: setPeriod,
    },
  ];

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

        {error ? (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {statsData.map((stat) => (
            <Card
              key={stat.label}
              className="border-white/[0.08] bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent shadow-lg shadow-black/20"
            >
              <CardHeader className="space-y-3">
                <CardTitle className="text-3xl font-semibold text-white lg:text-4xl">
                  {isLoading ? "..." : stat.value}
                </CardTitle>
                <CardDescription className="text-sm uppercase tracking-[0.35em] text-white/50">
                  {stat.label}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                {stat.timeframe ? (
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/70">
                      {stat.timeframe}
                    </div>
                    {stat.onPeriodChange ? (
                      <select
                        value={stat.period}
                        onChange={(e) =>
                          stat.onPeriodChange?.(e.target.value as "7" | "15" | "30")
                        }
                        className="h-8 rounded-lg border border-white/20 bg-white/10 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                      >
                        <option value="7" className="bg-black text-white">
                          7 dias
                        </option>
                        <option value="15" className="bg-black text-white">
                          15 dias
                        </option>
                        <option value="30" className="bg-black text-white">
                          30 dias
                        </option>
                      </select>
                    ) : null}
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
            <p className="text-sm text-white/60">Resumo dos próximos compromissos</p>
          </div>

          <Card className="overflow-hidden border-white/[0.07] bg-black/40">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="px-6 py-8 text-center text-white/60">
                  Carregando agendamentos...
                </div>
              ) : stats.todayAppointments.length === 0 ? (
                <div className="px-6 py-8 text-center text-white/60">
                  Nenhum agendamento para hoje.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                  <thead>
                    <tr className="bg-white/[0.02] text-xs uppercase tracking-[0.2em] text-white/50">
                      <th className="px-6 py-4 text-yellow-400">Cliente</th>
                      <th className="px-6 py-4 text-yellow-400">Horário</th>
                      <th className="px-6 py-4 text-yellow-400">Serviço</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {stats.todayAppointments.map((appointment) => (
                      <tr
                        key={appointment.id}
                        className="transition hover:bg-white/[0.03]"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          {appointment.clientName}
                        </td>
                        <td className="px-6 py-4 text-sm">{appointment.horaAgendada}</td>
                        <td className="px-6 py-4 text-sm text-white/80">
                          {appointment.serviceName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <MobileNav items={navigationItems} />
    </div>
  );
}

