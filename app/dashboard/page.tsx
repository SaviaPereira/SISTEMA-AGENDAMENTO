import type { JSX } from "react";

import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { createClient } from "@/lib/server";

export default async function DashboardPage(): Promise<JSX.Element> {
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

  return <DashboardClient />;
}
