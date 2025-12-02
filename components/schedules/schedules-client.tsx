"use client";

import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { LogOut, MessageCircle, Pencil, Plus, Trash2, X } from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import {
  MobileNav,
  SidebarNav,
  type DashboardNavItem,
} from "@/components/dashboard/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/client";
import { cn } from "@/lib/utils";
import {
  ScheduleFiltersComponent,
  type ScheduleFilters,
} from "@/components/schedules/schedule-filters";

type Schedule = {
  id: string;
  clientId: string;
  clientName: string;
  clientWhatsapp: string;
  serviceId: string;
  serviceName: string;
  dataAgendada: string;
  horaAgendada: string;
  status: "agendado" | "cancelado" | "pago" | "concluído";
  valor: number;
  barberId: string | null;
  barberName: string | null;
  createdAt: string;
  updatedAt: string;
};

interface SchedulesClientProps {
  initialSchedules: Schedule[];
}

type Client = {
  id: string;
  name: string;
};

type Service = {
  id: string;
  name: string;
  price: number;
};

const statusLabels: Record<Schedule["status"], string> = {
  agendado: "Agendado",
  cancelado: "Cancelado",
  pago: "Pago",
  concluído: "Concluído",
};

const statusColors: Record<Schedule["status"], string> = {
  agendado: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  cancelado: "bg-red-500/20 text-red-300 border-red-500/30",
  pago: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  concluído: "bg-green-500/20 text-green-300 border-green-500/30",
};

export function SchedulesClient({ initialSchedules }: SchedulesClientProps): JSX.Element {
  const router = useRouter();
  
  const navigationItems: DashboardNavItem[] = [
    { label: "Dashboard", icon: "layout-grid", href: "/dashboard" },
    { label: "Serviços", icon: "scissors", href: "/services" },
    { label: "Agendamentos", icon: "calendar-days", href: "/schedules" },
    { label: "Clientes", icon: "user", href: "/clients" },
    { label: "Configurações", icon: "settings", href: "/config" },
  ];

  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [previousServiceId, setPreviousServiceId] = useState("");
  const [dataAgendada, setDataAgendada] = useState("");
  const [horaAgendada, setHoraAgendada] = useState("");
  const [status, setStatus] = useState<Schedule["status"]>("agendado");
  const [valorInput, setValorInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      }),
    [],
  );
  const zeroCurrency = useMemo(() => currencyFormatter.format(0), [currencyFormatter]);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  const [filters, setFilters] = useState<ScheduleFilters>({
    searchClient: "",
    selectedService: "",
    selectedStatus: "",
    dateFrom: "",
    dateTo: "",
    period: "all",
  });

  // Estados para modal de criação de cliente
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  function formatWhatsApp(whatsapp: string): string {
    if (!whatsapp) return "";
    
    // Remove todos os caracteres não numéricos
    const digitsOnly = whatsapp.replace(/\D/g, "");
    
    // Verifica se tem pelo menos 10 dígitos (DDD + número)
    if (digitsOnly.length < 10) return whatsapp;
    
    // Formata: (XX) XXXXX-XXXX
    if (digitsOnly.length === 10) {
      return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 6)}-${digitsOnly.slice(6)}`;
    }
    
    // Formata: (XX) XXXXX-XXXX (com DDD)
    if (digitsOnly.length === 11) {
      return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7)}`;
    }
    
    // Se tiver mais de 11 dígitos, assume que os 2 primeiros são DDD
    return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7, 11)}`;
  }

  function getWhatsAppLink(whatsapp: string): string {
    if (!whatsapp) return "#";
    
    // Remove todos os caracteres não numéricos
    const digitsOnly = whatsapp.replace(/\D/g, "");
    
    // Gera o link do WhatsApp (formato: https://wa.me/5511999999999)
    return `https://wa.me/55${digitsOnly}`;
  }

  function handleClientWhatsAppChange(value: string): void {
    // Remove todos os caracteres não numéricos
    const digitsOnly = value.replace(/\D/g, "");
    
    // Limita a 11 dígitos
    const limitedDigits = digitsOnly.slice(0, 11);
    
    // Formata conforme o usuário digita
    let formatted = "";
    
    if (limitedDigits.length === 0) {
      formatted = "";
    } else if (limitedDigits.length <= 2) {
      // (XX
      formatted = `(${limitedDigits}`;
    } else if (limitedDigits.length <= 7) {
      // (XX) XXXXX
      formatted = `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2)}`;
    } else {
      // (XX) XXXXX-XXXX
      formatted = `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 7)}-${limitedDigits.slice(7)}`;
    }
    
    setClientWhatsapp(formatted);
  }

  function openClientDialog(): void {
    setIsClientDialogOpen(true);
    setClientName("");
    setClientEmail("");
    setClientWhatsapp("");
    setClientError(null);
  }

  function closeClientDialog(): void {
    if (isSavingClient) return;
    setIsClientDialogOpen(false);
    setClientName("");
    setClientEmail("");
    setClientWhatsapp("");
    setClientError(null);
  }

  async function handleCreateClient(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedName = clientName.trim();

    if (!trimmedName) {
      setClientError("Informe o nome do cliente.");
      return;
    }

    setIsSavingClient(true);
    setClientError(null);

    // Remove formatação do WhatsApp antes de salvar (apenas dígitos)
    const whatsappDigitsOnly = clientWhatsapp.replace(/\D/g, "");

    try {
      const { data, error: insertError } = await supabase
        .from("clients")
        .insert([
          {
            name: trimmedName,
            email: clientEmail.trim() || null,
            whatsapp: whatsappDigitsOnly || null,
          },
        ])
        .select("id, name")
        .single();

      if (insertError) {
        console.error("[schedules] erro ao criar cliente:", insertError);
        setClientError(insertError.message ?? "Não foi possível criar o cliente.");
        return;
      }

      if (!data) {
        console.error("[schedules] erro: dados não retornados após inserção");
        setClientError("Não foi possível criar o cliente. Dados não retornados.");
        return;
      }

      // Adicionar o novo cliente à lista
      const newClient: Client = {
        id: data.id,
        name: data.name,
      };

      setClients((prev) => [newClient, ...prev]);
      
      // Selecionar o cliente recém-criado
      setSelectedClientId(data.id);
      
      // Fechar o modal de cliente
      closeClientDialog();
      
      setToast({ message: "Cliente cadastrado com sucesso.", variant: "success" });
    } finally {
      setIsSavingClient(false);
    }
  }

  useEffect(() => {
    async function loadClientsAndServices() {
      const [clientsResult, servicesResult] = await Promise.all([
        supabase.from("clients").select("id, name").order("name", { ascending: true }),
        supabase.from("services").select("id, name, price").order("name", { ascending: true }),
      ]);

      if (clientsResult.data) {
        setClients(clientsResult.data);
      }
      if (servicesResult.data) {
        setServices(
          servicesResult.data.map((service) => ({
            id: service.id,
            name: service.name,
            price: typeof service.price === "number" ? service.price : Number(service.price ?? 0),
          })),
        );
      }
    }

    // Carregar sempre para ter disponível nos filtros
    loadClientsAndServices();
  }, [supabase]);

  function handleValorChange(value: string): void {
    const digitsOnly = value.replace(/\D/g, "");
    const numericValue = Number(digitsOnly) / 100;
    const formatted = currencyFormatter.format(Number.isNaN(numericValue) ? 0 : numericValue);
    setValorInput(formatted);
  }

  // Atualizar valor automaticamente quando um serviço é selecionado
  useEffect(() => {
    if (!selectedServiceId || !isDialogOpen || services.length === 0) return;
    
    // Só atualiza se o serviço realmente mudou (não é o mesmo que o anterior)
    if (selectedServiceId === previousServiceId) return;

    const selectedService = services.find((service) => service.id === selectedServiceId);
    if (selectedService && selectedService.price > 0) {
      // Atualiza o valor quando um novo serviço é selecionado
      setValorInput(currencyFormatter.format(selectedService.price));
      setPreviousServiceId(selectedServiceId);
    }
  }, [selectedServiceId, services, isDialogOpen, currencyFormatter, previousServiceId]);

  function openCreateDialog() {
    // Redirecionar para a rota de agendamento ao invés de abrir modal
    router.push("/agendamento");
  }

  function openEditDialog(schedule: Schedule) {
    setDialogMode("edit");
    setEditingSchedule(schedule);
    setIsDialogOpen(true);
    setSelectedClientId(schedule.clientId);
    setSelectedServiceId(schedule.serviceId);
    setPreviousServiceId(schedule.serviceId); // Define o serviço anterior como o atual para não atualizar na primeira renderização
    setDataAgendada(schedule.dataAgendada);
    setHoraAgendada(schedule.horaAgendada);
    setStatus(schedule.status);
    setValorInput(currencyFormatter.format(schedule.valor ?? 0));
    setError(null);
  }

  function handleCloseDialog() {
    if (isSaving) return;
    setIsDialogOpen(false);
    setEditingSchedule(null);
    setSelectedClientId("");
    setSelectedServiceId("");
    setPreviousServiceId("");
    setDataAgendada("");
    setHoraAgendada("");
    setStatus("agendado");
    setValorInput(zeroCurrency);
    setError(null);
  }

  function openDeleteConfirmation(schedule: Schedule) {
    setDeleteTarget(schedule);
    setDeleteError(null);
  }

  function closeDeleteConfirmation() {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedClientId) {
      setError("Selecione um cliente.");
      return;
    }

    if (!selectedServiceId) {
      setError("Selecione um serviço.");
      return;
    }

    if (!dataAgendada) {
      setError("Informe a data do agendamento.");
      return;
    }

    if (!horaAgendada) {
      setError("Informe a hora do agendamento.");
      return;
    }

    setIsSaving(true);
    setError(null);

    // Converter valor formatado para número
    const digitsOnly = valorInput.replace(/\D/g, "");
    const valorNumeric = Number(digitsOnly) / 100;
    
    // Se o valor não for informado ou for 0, usar o preço do serviço
    let valorToSave: number | null = null;
    if (!Number.isNaN(valorNumeric) && valorNumeric > 0) {
      valorToSave = valorNumeric;
    } else {
      // Buscar o preço do serviço selecionado
      const selectedService = services.find((service) => service.id === selectedServiceId);
      if (selectedService && selectedService.price > 0) {
        valorToSave = selectedService.price;
      }
    }

    try {
      if (dialogMode === "edit" && editingSchedule) {
        const { data, error: updateError } = await supabase
          .from("schedules")
          .update({
            client_id: selectedClientId,
            service_id: selectedServiceId,
            data_agendada: dataAgendada,
            hora_agendada: horaAgendada,
            status: status,
            valor: valorToSave,
          })
          .eq("id", editingSchedule.id)
          .select("id, client_id, service_id, barber_id, data_agendada, hora_agendada, status, valor, created_at, updated_at")
          .single();

        if (updateError || !data) {
          if (updateError?.code === "23505") {
            setError("Já existe um agendamento para este serviço no mesmo horário.");
          } else {
            setError(updateError?.message ?? "Não foi possível atualizar o agendamento.");
          }
          return;
        }

        // Buscar dados relacionados para atualizar a lista
        const [clientResult, serviceResult, barberResult] = await Promise.all([
          supabase.from("clients").select("name, whatsapp").eq("id", data.client_id).single(),
          supabase.from("services").select("name").eq("id", data.service_id).single(),
          data.barber_id
            ? supabase.from("barbers").select("name").eq("id", data.barber_id).single()
            : Promise.resolve({ data: null, error: null }),
        ]);

        const updatedSchedule: Schedule = {
          id: data.id,
          clientId: data.client_id,
          clientName: clientResult.data?.name ?? "Cliente não encontrado",
          clientWhatsapp: clientResult.data?.whatsapp ?? "",
          serviceId: data.service_id,
          serviceName: serviceResult.data?.name ?? "Serviço não encontrado",
          barberId: data.barber_id ?? null,
          barberName: barberResult?.data?.name ?? null,
          dataAgendada: data.data_agendada,
          horaAgendada: data.hora_agendada,
          status: data.status as Schedule["status"],
          valor: typeof data.valor === "number" ? data.valor : Number(data.valor ?? 0),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setSchedules((prev) => prev.map((schedule) => (schedule.id === updatedSchedule.id ? updatedSchedule : schedule)));
        setToast({ message: "Agendamento atualizado com sucesso.", variant: "success" });
      } else {
        const { data, error: insertError } = await supabase
          .from("schedules")
          .insert([
            {
              client_id: selectedClientId,
              service_id: selectedServiceId,
              data_agendada: dataAgendada,
              hora_agendada: horaAgendada,
              status: status,
              valor: valorToSave,
            },
          ])
          .select("id, client_id, service_id, barber_id, data_agendada, hora_agendada, status, valor, created_at, updated_at")
          .single();

        if (insertError || !data) {
          if (insertError?.code === "23505") {
            setError("Já existe um agendamento para este serviço no mesmo horário.");
          } else {
            setError(insertError?.message ?? "Não foi possível criar o agendamento.");
          }
          return;
        }

        // Buscar dados relacionados para atualizar a lista
        const [clientResult, serviceResult, barberResult] = await Promise.all([
          supabase.from("clients").select("name, whatsapp").eq("id", data.client_id).single(),
          supabase.from("services").select("name").eq("id", data.service_id).single(),
          data.barber_id
            ? supabase.from("barbers").select("name").eq("id", data.barber_id).single()
            : Promise.resolve({ data: null, error: null }),
        ]);

        const newSchedule: Schedule = {
          id: data.id,
          clientId: data.client_id,
          clientName: clientResult.data?.name ?? "Cliente não encontrado",
          clientWhatsapp: clientResult.data?.whatsapp ?? "",
          serviceId: data.service_id,
          serviceName: serviceResult.data?.name ?? "Serviço não encontrado",
          barberId: data.barber_id ?? null,
          barberName: barberResult?.data?.name ?? null,
          dataAgendada: data.data_agendada,
          horaAgendada: data.hora_agendada,
          status: data.status as Schedule["status"],
          valor: typeof data.valor === "number" ? data.valor : Number(data.valor ?? 0),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setSchedules((prev) => [newSchedule, ...prev]);
        setToast({ message: "Agendamento criado com sucesso.", variant: "success" });
      }

      handleCloseDialog();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const { error: deleteErr } = await supabase.from("schedules").delete().eq("id", deleteTarget.id);

      if (deleteErr) {
        setDeleteError(deleteErr.message ?? "Não foi possível remover o agendamento.");
        return;
      }

      setSchedules((prev) => prev.filter((schedule) => schedule.id !== deleteTarget.id));
      setDeleteTarget(null);
      setToast({ message: "Agendamento removido com sucesso.", variant: "success" });
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const formattedSchedules = useMemo(() => {
    return schedules.map((schedule) => {
      // Formatar data diretamente da string para evitar problemas de timezone
      // A data vem no formato YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
      const dateStr = schedule.dataAgendada.split("T")[0]; // Pega só a parte da data
      const [year, month, day] = dateStr.split("-");
      const formattedDate = `${day}/${month}/${year}`;

      const [hours, minutes] = schedule.horaAgendada.split(":");
      const formattedTime = `${hours}:${minutes}`;

      return {
        ...schedule,
        formattedDate,
        formattedTime,
      };
    });
  }, [schedules]);

  // Função auxiliar para normalizar data para formato YYYY-MM-DD
  // IMPORTANTE: Sempre trabalhar com strings para evitar problemas de timezone
  const normalizeDate = (dateString: string): string => {
    if (!dateString) return "";
    
    // Remover espaços em branco
    const trimmed = dateString.trim();
    
    // Se já está no formato YYYY-MM-DD, retorna direto
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    
    // Se tem "T" (formato ISO), pega só a parte da data ANTES do T
    if (trimmed.includes("T")) {
      const datePart = trimmed.split("T")[0].trim();
      // Garantir que está no formato correto
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
    }
    
    // Se tem espaço (formato alternativo), pega a primeira parte
    if (trimmed.includes(" ")) {
      const datePart = trimmed.split(" ")[0].trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
    }
    
    // Último recurso: tentar extrair YYYY-MM-DD usando regex
    const dateMatch = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      return dateMatch[0]; // Retorna YYYY-MM-DD
    }
    
    // Se não conseguir, retorna string vazia
    // Isso não deve acontecer em condições normais
    return "";
  };

  // Lógica de filtragem
  const filteredSchedules = useMemo(() => {
    let filtered = formattedSchedules;

    // Filtro por nome do cliente
    if (filters.searchClient.trim()) {
      const searchLower = filters.searchClient.toLowerCase().trim();
      filtered = filtered.filter((schedule) =>
        schedule.clientName.toLowerCase().includes(searchLower),
      );
    }

    // Filtro por serviço
    if (filters.selectedService) {
      filtered = filtered.filter((schedule) => schedule.serviceId === filters.selectedService);
    }

    // Filtro por status
    if (filters.selectedStatus) {
      filtered = filtered.filter((schedule) => schedule.status === filters.selectedStatus);
    }

    // Filtro por data
    // Comparar apenas a parte da data (YYYY-MM-DD) para evitar problemas de timezone
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter((schedule) => {
        const scheduleDateStr = normalizeDate(schedule.dataAgendada);
        const fromDateStr = filters.dateFrom ? normalizeDate(filters.dateFrom) : "";
        const toDateStr = filters.dateTo ? normalizeDate(filters.dateTo) : "";
        
        // Se ambas as datas são iguais (ex: "Hoje"), fazer comparação exata
        if (fromDateStr && toDateStr && fromDateStr === toDateStr) {
          return scheduleDateStr === fromDateStr;
        }
        
        // Caso contrário, usar range
        const matchesFrom = !fromDateStr || scheduleDateStr >= fromDateStr;
        const matchesTo = !toDateStr || scheduleDateStr <= toDateStr;
        
        return matchesFrom && matchesTo;
      });
    }

    return filtered;
  }, [formattedSchedules, filters]);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchClient.trim() !== "" ||
      filters.selectedService !== "" ||
      filters.selectedStatus !== "" ||
      filters.dateFrom !== "" ||
      filters.dateTo !== "" ||
      filters.period !== "all"
    );
  }, [filters]);

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

      <main className="relative flex-1 px-3 sm:px-4 lg:px-6 xl:px-8 pb-24 sm:pb-28 pt-6 sm:pt-8 lg:pt-10 lg:pb-12">
        <header className="flex flex-col gap-4 pb-6 lg:gap-6 lg:pb-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1 lg:space-y-2">
            <p className="text-xs lg:text-sm uppercase tracking-[0.35em] text-white/50">Painel</p>
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black text-yellow-400">Agendamentos</h2>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <Button
              type="button"
              onClick={openCreateDialog}
              className="inline-flex items-center gap-1.5 lg:gap-2 rounded-full border border-yellow-400 bg-transparent px-3 py-1.5 lg:px-5 lg:py-2 text-xs lg:text-sm font-semibold text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
            >
              <Plus className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              <span className="hidden sm:inline">Novo Agendamento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
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

        <ScheduleFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          services={services.map((s) => ({ id: s.id, name: s.name }))}
          hasActiveFilters={hasActiveFilters}
        />

        <div className="mt-6 overflow-x-auto rounded-2xl lg:rounded-3xl border border-white/10 bg-black/40 shadow-inner shadow-black/20">
          <table className="w-full divide-y divide-white/10 text-left table-auto">
            <thead className="bg-white/[0.03] text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/50">
              <tr>
                <th className="px-2 py-2 sm:px-4 sm:py-3 lg:px-4 lg:py-4 text-yellow-400">Cliente</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 lg:px-4 lg:py-4 text-yellow-400">Serviço</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 lg:px-3 lg:py-4 text-yellow-400 whitespace-nowrap">Data</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 lg:px-3 lg:py-4 text-yellow-400 whitespace-nowrap">Hora</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 lg:px-3 lg:py-4 text-yellow-400 whitespace-nowrap">Valor</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 lg:px-3 lg:py-4 text-yellow-400 whitespace-nowrap">Status</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 lg:px-4 lg:py-4 text-yellow-400">Barbeiro</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 lg:px-4 lg:py-4 text-yellow-400 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08] text-xs sm:text-sm text-white/80">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 sm:px-6 sm:py-8 text-center text-white/60 text-xs sm:text-sm">
                    {hasActiveFilters
                      ? "Nenhum agendamento encontrado com os filtros aplicados."
                      : "Nenhum agendamento cadastrado até o momento."}
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((schedule) => (
                  <tr key={schedule.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-2 py-3 sm:px-4 sm:py-4 lg:px-4 lg:py-5">
                      <div className="flex flex-col gap-0.5 sm:gap-1">
                        <span className="text-xs sm:text-sm lg:text-base font-medium text-white">{schedule.clientName}</span>
                        {schedule.clientWhatsapp ? (
                          <a
                            href={getWhatsAppLink(schedule.clientWhatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] sm:text-xs lg:text-sm text-green-400 transition hover:text-green-300"
                          >
                            <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            <span>{formatWhatsApp(schedule.clientWhatsapp)}</span>
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-2 py-3 sm:px-4 sm:py-4 lg:px-4 lg:py-5 text-xs sm:text-sm lg:text-base text-white/80">{schedule.serviceName}</td>
                    <td className="px-2 py-3 sm:px-4 sm:py-4 lg:px-3 lg:py-5 text-xs sm:text-sm lg:text-base text-white/80 whitespace-nowrap">{schedule.formattedDate}</td>
                    <td className="px-2 py-3 sm:px-4 sm:py-4 lg:px-3 lg:py-5 text-xs sm:text-sm lg:text-base text-white/80 whitespace-nowrap">{schedule.formattedTime}</td>
                    <td className="px-2 py-3 sm:px-4 sm:py-4 lg:px-3 lg:py-5 text-xs sm:text-sm lg:text-base text-white/80 whitespace-nowrap">
                      {schedule.valor && schedule.valor > 0 ? currencyFormatter.format(schedule.valor) : "-"}
                    </td>
                    <td className="px-2 py-3 sm:px-4 sm:py-4 lg:px-3 lg:py-5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.05em] sm:tracking-[0.1em]",
                          statusColors[schedule.status],
                        )}
                      >
                        {statusLabels[schedule.status]}
                      </span>
                    </td>
                    <td className="px-2 py-3 sm:px-4 sm:py-4 lg:px-4 lg:py-5 text-xs sm:text-sm lg:text-base text-white/80">
                      {schedule.barberName ?? "-"}
                    </td>
                    <td className="px-2 py-3 sm:px-4 sm:py-4 lg:px-4 lg:py-5">
                      <div className="flex items-center justify-end gap-1.5 sm:gap-2 lg:gap-3">
                        <button
                          type="button"
                          onClick={() => openEditDialog(schedule)}
                          className="rounded-full border border-white/10 p-1.5 sm:p-2 text-white/70 transition hover:border-yellow-400 hover:bg-white/5 hover:text-yellow-400"
                          aria-label={`Editar agendamento de ${schedule.clientName}`}
                        >
                          <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteConfirmation(schedule)}
                          className="rounded-full border border-white/10 p-1.5 sm:p-2 text-white/70 transition hover:border-red-400 hover:bg-red-400/10 hover:text-red-300"
                          aria-label={`Excluir agendamento de ${schedule.clientName}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <MobileNav items={navigationItems} />

      {isDialogOpen ? (
        <div
          role="presentation"
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 px-3 py-4 sm:px-4 sm:py-6 backdrop-blur"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isSaving) {
              handleCloseDialog();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-xl rounded-2xl sm:rounded-[28px] border border-white/15 bg-gradient-to-br from-black via-black/95 to-black/85 p-4 sm:p-6 lg:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 sm:space-y-2 flex-1">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">
                  {dialogMode === "edit" ? "Editar agendamento" : "Novo Agendamento"}
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-white/70">
                  {dialogMode === "edit"
                    ? "Atualize os dados do agendamento conforme necessário."
                    : "Preencha os dados do agendamento para registrar um novo compromisso."}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white flex-shrink-0"
                onClick={handleCloseDialog}
                aria-label="Fechar modal"
                disabled={isSaving}
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <form className="mt-4 sm:mt-6 lg:mt-8 flex flex-col gap-4 sm:gap-5 lg:gap-6" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2 sm:gap-3">
                <Label
                  htmlFor="schedule-client"
                  className="text-[10px] sm:text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.35em] text-white/60"
                >
                  Cliente
                </Label>
                <div className="flex items-center gap-2">
                  <select
                    id="schedule-client"
                    value={selectedClientId}
                    onChange={(event) => setSelectedClientId(event.target.value)}
                    disabled={isSaving}
                    className="flex-1 h-10 sm:h-11 lg:h-12 rounded-full border border-white/15 bg-white/10 px-3 sm:px-4 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 disabled:opacity-50"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id} className="bg-black text-white">
                        {client.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    onClick={openClientDialog}
                    disabled={isSaving}
                    className="h-10 sm:h-11 lg:h-12 w-10 sm:w-11 lg:w-12 rounded-full bg-yellow-400 hover:bg-yellow-400/90 text-black p-0 flex-shrink-0 disabled:opacity-50"
                    aria-label="Adicionar novo cliente"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:gap-3">
                <Label
                  htmlFor="schedule-service"
                  className="text-[10px] sm:text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.35em] text-white/60"
                >
                  Serviço
                </Label>
                <select
                  id="schedule-service"
                  value={selectedServiceId}
                  onChange={(event) => setSelectedServiceId(event.target.value)}
                  disabled={isSaving}
                  className="h-10 sm:h-11 lg:h-12 rounded-full border border-white/15 bg-white/10 px-3 sm:px-4 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 disabled:opacity-50"
                  required
                >
                  <option value="">Selecione um serviço</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id} className="bg-black text-white">
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <Label
                    htmlFor="schedule-date"
                    className="text-[10px] sm:text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.35em] text-white/60"
                  >
                    Data
                  </Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={dataAgendada}
                    onChange={(event) => setDataAgendada(event.target.value)}
                    disabled={isSaving}
                    className="h-10 sm:h-11 lg:h-12 rounded-full border border-white/15 bg-white/10 text-sm sm:text-base text-white focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2 sm:gap-3">
                  <Label
                    htmlFor="schedule-time"
                    className="text-[10px] sm:text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.35em] text-white/60"
                  >
                    Hora
                  </Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={horaAgendada}
                    onChange={(event) => setHoraAgendada(event.target.value)}
                    disabled={isSaving}
                    className="h-10 sm:h-11 lg:h-12 rounded-full border border-white/15 bg-white/10 text-sm sm:text-base text-white focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:gap-3">
                <Label
                  htmlFor="schedule-status"
                  className="text-[10px] sm:text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.35em] text-white/60"
                >
                  Status
                </Label>
                <select
                  id="schedule-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as Schedule["status"])}
                  disabled={isSaving}
                  className="h-10 sm:h-11 lg:h-12 rounded-full border border-white/15 bg-white/10 px-3 sm:px-4 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 disabled:opacity-50"
                >
                  <option value="agendado" className="bg-black text-white">
                    Agendado
                  </option>
                  <option value="pago" className="bg-black text-white">
                    Pago
                  </option>
                  <option value="concluído" className="bg-black text-white">
                    Concluído
                  </option>
                  <option value="cancelado" className="bg-black text-white">
                    Cancelado
                  </option>
                </select>
              </div>

              <div className="flex flex-col gap-2 sm:gap-3">
                <Label
                  htmlFor="schedule-value"
                  className="text-[10px] sm:text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.35em] text-white/60"
                >
                  Valor
                </Label>
                <Input
                  id="schedule-value"
                  inputMode="numeric"
                  autoComplete="off"
                  value={valorInput}
                  onChange={(event) => handleValorChange(event.target.value)}
                  disabled={isSaving}
                  className="h-10 sm:h-11 lg:h-12 rounded-full border border-white/15 bg-white/10 text-sm sm:text-base text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
                  placeholder={zeroCurrency}
                />
                <span className="text-[10px] sm:text-xs text-white/40">
                  Digite apenas números. O valor será formatado automaticamente.
                </span>
              </div>

              {error ? <p className="text-xs sm:text-sm font-medium text-red-400">{error}</p> : null}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className={cn(
                    "w-full sm:w-auto min-w-[120px] sm:min-w-[160px] rounded-full bg-primary px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-black transition hover:bg-primary/90",
                    isSaving && "cursor-not-allowed opacity-70",
                  )}
                >
                  {isSaving ? "Salvando..." : dialogMode === "edit" ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          role="presentation"
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-3 py-4 sm:px-4 sm:py-6 backdrop-blur"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              closeDeleteConfirmation();
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-b from-black via-black/95 to-black/90 p-4 sm:p-6 lg:p-8 shadow-2xl">
            <header className="space-y-1 sm:space-y-2">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary">Excluir agendamento</h2>
              <p className="text-xs sm:text-sm text-white/60">
                Tem certeza de que deseja remover o agendamento de{" "}
                <span className="font-semibold text-white">{deleteTarget.clientName}</span> para{" "}
                <span className="font-semibold text-white">{deleteTarget.serviceName}</span>? Essa ação não poderá ser
                desfeita.
              </p>
            </header>

            {deleteError ? <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-red-400">{deleteError}</p> : null}

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto border border-white/10 bg-transparent px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                onClick={closeDeleteConfirmation}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className={cn(
                  "w-full sm:w-auto min-w-[100px] sm:min-w-[120px] bg-red-500 text-white hover:bg-red-500/90 py-2 text-xs sm:text-sm",
                  isDeleting && "cursor-not-allowed opacity-70",
                )}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Removendo..." : "Excluir"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isClientDialogOpen ? (
        <div
          role="presentation"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 px-3 py-4 sm:px-4 sm:py-6 backdrop-blur"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isSavingClient) {
              closeClientDialog();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-xl rounded-2xl sm:rounded-[28px] border border-white/15 bg-gradient-to-br from-black via-black/95 to-black/85 p-4 sm:p-6 lg:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 sm:space-y-2 flex-1">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">
                  Adicionar cliente
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-white/70">
                  Preencha os dados do cliente para cadastrar no sistema.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white flex-shrink-0"
                onClick={closeClientDialog}
                aria-label="Fechar modal"
                disabled={isSavingClient}
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <form className="mt-4 sm:mt-6 lg:mt-8 flex flex-col gap-4 sm:gap-5 lg:gap-6" onSubmit={handleCreateClient}>
              <div className="flex flex-col gap-2 sm:gap-3">
                <Label
                  htmlFor="client-name"
                  className="text-[10px] sm:text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.35em] text-white/60"
                >
                  Nome
                </Label>
                <Input
                  id="client-name"
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  placeholder="Nome do cliente"
                  disabled={isSavingClient}
                  className="h-10 sm:h-11 lg:h-12 rounded-full border border-white/15 bg-white/10 text-sm sm:text-base text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
                  required
                />
              </div>

              <div className="flex flex-col gap-2 sm:gap-3">
                <Label
                  htmlFor="client-email"
                  className="text-[10px] sm:text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.35em] text-white/60"
                >
                  Email
                </Label>
                <Input
                  id="client-email"
                  type="email"
                  value={clientEmail}
                  onChange={(event) => setClientEmail(event.target.value)}
                  placeholder="email@exemplo.com"
                  disabled={isSavingClient}
                  className="h-10 sm:h-11 lg:h-12 rounded-full border border-white/15 bg-white/10 text-sm sm:text-base text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-2 sm:gap-3">
                <Label
                  htmlFor="client-whatsapp"
                  className="text-[10px] sm:text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.35em] text-white/60"
                >
                  WhatsApp
                </Label>
                <Input
                  id="client-whatsapp"
                  type="tel"
                  value={clientWhatsapp}
                  onChange={(event) => handleClientWhatsAppChange(event.target.value)}
                  placeholder="(00) 00000-0000"
                  disabled={isSavingClient}
                  className="h-10 sm:h-11 lg:h-12 rounded-full border border-white/15 bg-white/10 text-sm sm:text-base text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
                />
              </div>

              {clientError ? <p className="text-xs sm:text-sm font-medium text-red-400">{clientError}</p> : null}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSavingClient}
                  className={cn(
                    "w-full sm:w-auto min-w-[120px] sm:min-w-[160px] rounded-full bg-primary px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-black transition hover:bg-primary/90",
                    isSavingClient && "cursor-not-allowed opacity-70",
                  )}
                >
                  {isSavingClient ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 right-6 z-40 flex w-full max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-black/85 px-5 py-4 text-sm text-white shadow-2xl shadow-black/40 backdrop-blur">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              toast.variant === "success" ? "bg-emerald-400" : "bg-red-400",
            )}
          />
          <p className="flex-1 text-left text-white/85">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-white/50 transition hover:text-white"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

