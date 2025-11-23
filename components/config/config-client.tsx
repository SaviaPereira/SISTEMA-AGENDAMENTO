"use client";

import type { JSX } from "react";
import { useState } from "react";

import { LogOut } from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import {
  MobileNav,
  SidebarNav,
  type DashboardNavItem,
} from "@/components/dashboard/navigation";
import { cn } from "@/lib/utils";
import { BusinessHoursForm } from "@/components/config/business-hours-form";
import { GeneralSettingsForm } from "@/components/config/general-settings-form";

export function ConfigClient(): JSX.Element {
  const navigationItems: DashboardNavItem[] = [
    { label: "Dashboard", icon: "layout-grid", href: "/dashboard" },
    { label: "Serviços", icon: "scissors", href: "/services" },
    { label: "Agendamentos", icon: "calendar-days", href: "/schedules" },
    { label: "Clientes", icon: "user", href: "/clients" },
    { label: "Configurações", icon: "settings", href: "/config" },
  ];

  const [activeTab, setActiveTab] = useState<"horarios" | "geral">("horarios");

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

      <main className="relative flex-1 px-3 sm:px-4 lg:px-6 xl:px-12 pb-24 sm:pb-28 pt-6 sm:pt-8 lg:pt-10 lg:pb-12">
        <header className="flex flex-col gap-4 pb-6 lg:gap-6 lg:pb-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1 lg:space-y-2">
            <p className="text-xs lg:text-sm uppercase tracking-[0.35em] text-white/50">Painel</p>
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black text-yellow-400">Configurações</h2>
          </div>
          <div className="flex items-center justify-end">
            <LogoutButton
              variant="ghost"
              size="icon"
              className="hidden h-11 w-11 rounded-full border border-white/15 bg-transparent text-white/70 transition hover:border-yellow-400 hover:bg-white/5 hover:text-yellow-400 lg:inline-flex"
              aria-label="Encerrar sessão"
            >
              <LogOut className="h-4 w-4" />
            </LogoutButton>
          </div>
        </header>

        {/* Tabs */}
        <div className="mb-6 border-b border-white/10">
          <nav className="flex gap-2" aria-label="Tabs">
            <button
              type="button"
              onClick={() => setActiveTab("horarios")}
              className={cn(
                "px-4 py-3 text-sm font-semibold transition border-b-2",
                activeTab === "horarios"
                  ? "border-yellow-400 text-yellow-400"
                  : "border-transparent text-white/60 hover:text-white/80 hover:border-white/20"
              )}
            >
              Horários de Atendimento
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("geral")}
              className={cn(
                "px-4 py-3 text-sm font-semibold transition border-b-2",
                activeTab === "geral"
                  ? "border-yellow-400 text-yellow-400"
                  : "border-transparent text-white/60 hover:text-white/80 hover:border-white/20"
              )}
            >
              Geral
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "horarios" && (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-inner shadow-black/20">
              <BusinessHoursForm />
            </div>
          )}

          {activeTab === "geral" && (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-inner shadow-black/20">
              <GeneralSettingsForm />
            </div>
          )}
        </div>
      </main>

      <MobileNav items={navigationItems} />
    </div>
  );
}

