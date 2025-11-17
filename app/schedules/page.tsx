import type { JSX } from "react";

import { redirect } from "next/navigation";

import { SchedulesClient } from "@/components/schedules/schedules-client";
import { createClient } from "@/lib/server";

type ScheduleRow = {
  id: string;
  client_id: string;
  service_id: string;
  data_agendada: string;
  hora_agendada: string;
  status: "agendado" | "cancelado" | "pago" | "concluído";
  valor: number | null;
  created_at: string;
  updated_at: string;
  clients: {
    name: string;
    whatsapp: string;
  } | null;
  services: {
    name: string;
  } | null;
};

export default async function SchedulesPage(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    redirect("/auth/login");
  }

  const { data: claimsData } = await supabase.auth.getClaims();
  const hasClaims = claimsData?.claims && Object.keys(claimsData.claims).length > 0;

  if (!hasClaims) {
    redirect("/auth/login");
  }

  const { data: schedulesData, error: schedulesError } = await supabase
    .from("schedules")
    .select("id, client_id, service_id, data_agendada, hora_agendada, status, valor, created_at, updated_at")
    .order("data_agendada", { ascending: false })
    .order("hora_agendada", { ascending: false });

  if (schedulesError) {
    console.error("[schedules] erro ao buscar agendamentos:", schedulesError);
    throw new Error("Não foi possível carregar os agendamentos.");
  }

  // Buscar dados relacionados separadamente
  const clientIds = [...new Set(schedulesData?.map((s) => s.client_id) ?? [])];
  const serviceIds = [...new Set(schedulesData?.map((s) => s.service_id) ?? [])];

  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, name, whatsapp")
    .in("id", clientIds);

  const { data: servicesData } = await supabase
    .from("services")
    .select("id, name")
    .in("id", serviceIds);

  const clientsMap = new Map(
    clientsData?.map((c) => [c.id, { name: c.name, whatsapp: c.whatsapp ?? "" }]) ?? [],
  );
  const servicesMap = new Map(servicesData?.map((s) => [s.id, s.name]) ?? []);

  const schedules: ScheduleRow[] =
    schedulesData?.map((schedule) => {
      const clientData = clientsMap.get(schedule.client_id);
      return {
        ...schedule,
        clients: {
          name: clientData?.name ?? "Cliente não encontrado",
          whatsapp: clientData?.whatsapp ?? "",
        },
        services: { name: servicesMap.get(schedule.service_id) ?? "Serviço não encontrado" },
      };
    }) ?? [];

  return (
    <SchedulesClient
      initialSchedules={schedules.map((schedule) => ({
        id: schedule.id,
        clientId: schedule.client_id,
        clientName: schedule.clients?.name ?? "Cliente não encontrado",
        clientWhatsapp: schedule.clients?.whatsapp ?? "",
        serviceId: schedule.service_id,
        serviceName: schedule.services?.name ?? "Serviço não encontrado",
        dataAgendada: schedule.data_agendada,
        horaAgendada: schedule.hora_agendada,
        status: schedule.status,
        valor: typeof schedule.valor === "number" ? schedule.valor : Number(schedule.valor ?? 0),
        createdAt: schedule.created_at,
        updatedAt: schedule.updated_at,
      }))}
    />
  );
}
