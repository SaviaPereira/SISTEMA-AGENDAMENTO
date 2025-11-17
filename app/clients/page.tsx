import type { JSX } from "react";

import { redirect } from "next/navigation";

import { ClientsClient } from "@/components/clients/clients-client";
import { createClient } from "@/lib/server";

type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
  created_at: string;
  updated_at: string;
};

export default async function ClientsPage(): Promise<JSX.Element> {
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
    .from("clients")
    .select("id, name, email, whatsapp, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[clients] erro ao buscar clientes:", error);
    throw new Error("Não foi possível carregar os clientes.");
  }

  const clients: ClientRow[] = data ?? [];

  return (
    <ClientsClient
      initialClients={clients.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email ?? "",
        whatsapp: client.whatsapp ?? "",
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      }))}
    />
  );
}

