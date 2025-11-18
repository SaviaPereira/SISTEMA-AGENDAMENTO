"use client";

import type { JSX } from "react";
import { Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ScheduleStatus = "agendado" | "cancelado" | "pago" | "concluído";

export interface ScheduleFilters {
  searchClient: string;
  selectedService: string;
  selectedStatus: ScheduleStatus | "";
  dateFrom: string;
  dateTo: string;
  period: "all" | "today" | "week" | "month";
}

interface ScheduleFiltersProps {
  filters: ScheduleFilters;
  onFiltersChange: (filters: ScheduleFilters) => void;
  services: Array<{ id: string; name: string }>;
  hasActiveFilters: boolean;
}

const statusOptions: Array<{ value: ScheduleStatus | ""; label: string }> = [
  { value: "", label: "Todos os status" },
  { value: "agendado", label: "Agendado" },
  { value: "pago", label: "Pago" },
  { value: "concluído", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const periodOptions: Array<{ value: ScheduleFilters["period"]; label: string }> = [
  { value: "all", label: "Todos os períodos" },
  { value: "today", label: "Hoje" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
];

export function ScheduleFiltersComponent({
  filters,
  onFiltersChange,
  services,
  hasActiveFilters,
}: ScheduleFiltersProps): JSX.Element {
  function updateFilter<K extends keyof ScheduleFilters>(key: K, value: ScheduleFilters[K]): void {
    onFiltersChange({ ...filters, [key]: value });
  }

  function clearFilters(): void {
    onFiltersChange({
      searchClient: "",
      selectedService: "",
      selectedStatus: "",
      dateFrom: "",
      dateTo: "",
      period: "all",
    });
  }

  function handlePeriodChange(period: ScheduleFilters["period"]): void {
    // Usar a data local para evitar problemas de timezone
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    let dateFrom = "";
    let dateTo = "";

    switch (period) {
      case "today": {
        dateFrom = todayStr;
        dateTo = todayStr;
        break;
      }
      case "week": {
        // Calcular início da semana (domingo)
        const today = new Date(year, now.getMonth(), now.getDate());
        const dayOfWeek = today.getDay(); // 0 = domingo, 6 = sábado
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - dayOfWeek);
        
        // Calcular fim da semana (sábado)
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        dateFrom = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
        dateTo = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, "0")}-${String(weekEnd.getDate()).padStart(2, "0")}`;
        break;
      }
      case "month": {
        const monthStart = new Date(year, now.getMonth(), 1);
        const monthEnd = new Date(year, now.getMonth() + 1, 0);
        
        dateFrom = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}-${String(monthStart.getDate()).padStart(2, "0")}`;
        dateTo = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, "0")}-${String(monthEnd.getDate()).padStart(2, "0")}`;
        break;
      }
      case "all":
      default: {
        dateFrom = "";
        dateTo = "";
        break;
      }
    }

    // Atualizar tudo de uma vez
    onFiltersChange({
      ...filters,
      period,
      dateFrom,
      dateTo,
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6 shadow-inner shadow-black/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-yellow-400" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Filtros</h3>
        </div>
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 rounded-full border border-white/10 bg-transparent px-3 text-xs text-white/70 transition hover:border-yellow-400/50 hover:bg-white/5 hover:text-yellow-400"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Limpar
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Busca por Cliente */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="filter-client" className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
            Cliente
          </Label>
          <Input
            id="filter-client"
            type="text"
            placeholder="Buscar por nome..."
            value={filters.searchClient}
            onChange={(event) => updateFilter("searchClient", event.target.value)}
            className="h-10 rounded-full border border-white/15 bg-white/10 px-4 text-sm text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-yellow-400/50"
          />
        </div>

        {/* Filtro por Serviço */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="filter-service" className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
            Serviço
          </Label>
          <select
            id="filter-service"
            value={filters.selectedService}
            onChange={(event) => updateFilter("selectedService", event.target.value)}
            className="h-10 rounded-full border border-white/15 bg-white/10 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
          >
            <option value="" className="bg-black text-white">
              Todos os serviços
            </option>
            {services.map((service) => (
              <option key={service.id} value={service.id} className="bg-black text-white">
                {service.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Status */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="filter-status" className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
            Status
          </Label>
          <select
            id="filter-status"
            value={filters.selectedStatus}
            onChange={(event) => updateFilter("selectedStatus", event.target.value as ScheduleStatus | "")}
            className="h-10 rounded-full border border-white/15 bg-white/10 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-black text-white">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Período */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="filter-period" className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
            Período
          </Label>
          <select
            id="filter-period"
            value={filters.period}
            onChange={(event) => handlePeriodChange(event.target.value as ScheduleFilters["period"])}
            className="h-10 rounded-full border border-white/15 bg-white/10 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-black text-white">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Data Inicial */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="filter-date-from" className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
            Data Inicial
          </Label>
          <Input
            id="filter-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(event) => updateFilter("dateFrom", event.target.value)}
            className="h-10 rounded-full border border-white/15 bg-white/10 px-4 text-sm text-white focus-visible:ring-2 focus-visible:ring-yellow-400/50"
          />
        </div>

        {/* Data Final */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="filter-date-to" className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
            Data Final
          </Label>
          <Input
            id="filter-date-to"
            type="date"
            value={filters.dateTo}
            onChange={(event) => updateFilter("dateTo", event.target.value)}
            className="h-10 rounded-full border border-white/15 bg-white/10 px-4 text-sm text-white focus-visible:ring-2 focus-visible:ring-yellow-400/50"
          />
        </div>
      </div>
    </div>
  );
}

