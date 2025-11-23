import type { JSX } from "react";

import { redirect } from "next/navigation";

import { ConfigClient } from "@/components/config/config-client";
import { createClient } from "@/lib/server";

export default async function ConfigPage(): Promise<JSX.Element> {
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

  return <ConfigClient />;
}

