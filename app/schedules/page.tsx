import type { JSX } from "react";

import { redirect } from "next/navigation";

import { SchedulesClient } from "@/components/schedules/schedules-client";
import { createClient } from "@/lib/server";

type ScheduleRow = {
  id: string;
  client_id: string;
  service_id: string;
  barber_id: string | null;
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
    price: number;
  } | null;
  barbers: {
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
    .select("id, client_id, service_id, barber_id, data_agendada, hora_agendada, status, valor, created_at, updated_at")
    .order("data_agendada", { ascending: false })
    .order("hora_agendada", { ascending: false });

  if (schedulesError) {
    console.error("[schedules] erro ao buscar agendamentos:", schedulesError);
    throw new Error("Não foi possível carregar os agendamentos.");
  }

  // Buscar dados relacionados separadamente
  const clientIds = [...new Set(schedulesData?.map((s) => s.client_id) ?? [])];
  const serviceIds = [...new Set(schedulesData?.map((s) => s.service_id) ?? [])];
  const barberIds = [...new Set(schedulesData?.map((s) => s.barber_id).filter((id): id is string => id !== null) ?? [])];

  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, name, whatsapp")
    .in("id", clientIds);

  const { data: servicesData } = await supabase
    .from("services")
    .select("id, name, price")
    .in("id", serviceIds);

  // Buscar barbeiros (se houver barber_ids)
  let barbersMap = new Map<string, { name: string }>();
  if (barberIds.length > 0) {
    const { data: barbersData } = await supabase
      .from("barbers")
      .select("id, name")
      .in("id", barberIds);

    barbersMap = new Map(
      barbersData?.map((b) => [b.id, { name: b.name }]) ?? [],
    );
  }

  const clientsMap = new Map(
    clientsData?.map((c) => [c.id, { name: c.name, whatsapp: c.whatsapp ?? "" }]) ?? [],
  );
  const servicesMap = new Map(
    servicesData?.map((s) => [s.id, { name: s.name, price: typeof s.price === "number" ? s.price : Number(s.price ?? 0) }]) ?? [],
  );

  const schedules: ScheduleRow[] =
    schedulesData?.map((schedule) => {
      const clientData = clientsMap.get(schedule.client_id);
      return {
        ...schedule,
        clients: {
          name: clientData?.name ?? "Cliente não encontrado",
          whatsapp: clientData?.whatsapp ?? "",
        },
        services: {
          name: servicesMap.get(schedule.service_id)?.name ?? "Serviço não encontrado",
          price: servicesMap.get(schedule.service_id)?.price ?? 0,
        },
        barbers: schedule.barber_id
          ? {
              name: barbersMap.get(schedule.barber_id)?.name ?? "Barbeiro não encontrado",
            }
          : null,
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
        valor: typeof schedule.valor === "number" && schedule.valor > 0
          ? schedule.valor
          : schedule.services?.price ?? 0,
        barberId: schedule.barber_id ?? null,
        barberName: schedule.barbers?.name ?? null,
        createdAt: schedule.created_at,
        updatedAt: schedule.updated_at,
      }))}
    />
  );
}
