import type { JSX } from "react";

import { redirect } from "next/navigation";

import { ServicesClient } from "@/components/services/services-client";
import { createClient } from "@/lib/server";

type ServiceRow = {
  id: string;
  name: string;
  price: number;
  duration: number | null;
  created_at: string;
  updated_at: string;
};

export default async function ServicesPage(): Promise<JSX.Element> {
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

  const { data, error } = await supabase
    .from("services")
    .select("id, name, price, duration, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[services] erro ao buscar serviços:", error);
    throw new Error("Não foi possível carregar os serviços.");
  }

  const services: ServiceRow[] =
    data?.map((row) => ({
      ...row,
      price: typeof row.price === "number" ? row.price : Number(row.price ?? 0),
    })) ?? [];

  return (
    <ServicesClient
      initialServices={services.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration ?? null,
        createdAt: service.created_at,
        updatedAt: service.updated_at,
      }))}
    />
  );
}