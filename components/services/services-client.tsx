"use client";

import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";

import { LogOut, Pencil, Plus, Trash2, X } from "lucide-react";

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

type Service = {
  id: string;
  name: string;
  price: number;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
};

interface ServicesClientProps {
  initialServices: Service[];
}

export function ServicesClient({ initialServices }: ServicesClientProps): JSX.Element {
  const navigationItems: DashboardNavItem[] = [
    { label: "Dashboard", icon: "layout-grid", href: "/dashboard" },
    { label: "Serviços", icon: "scissors", href: "/services" },
    { label: "Agendamentos", icon: "calendar-days", href: "/schedules" },
    { label: "Clientes", icon: "user", href: "/clients" },
    { label: "Configurações", icon: "settings", href: "/config" },
  ];

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

  const [services, setServices] = useState<Service[]>(initialServices);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [priceInput, setPriceInput] = useState<string>(zeroCurrency);
  const [duration, setDuration] = useState<string>("30");
  const [defaultServiceDuration, setDefaultServiceDuration] = useState<string>("30");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Load default service duration from general settings
  useEffect(() => {
    async function loadDefaultDuration(): Promise<void> {
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from("general_settings")
          .select("default_service_duration")
          .limit(1)
          .single();

        if (settingsError && settingsError.code !== "PGRST116") {
          console.error("[services] erro ao carregar duração padrão:", settingsError);
        } else if (settingsData?.default_service_duration) {
          setDefaultServiceDuration(String(settingsData.default_service_duration));
        }
      } catch (error) {
        console.error("[services] erro ao carregar duração padrão:", error);
      }
    }

    loadDefaultDuration();
  }, [supabase]);

  const formattedServices = useMemo(
    () =>
      services.map((service) => {
        const hours = service.duration ? Math.floor(service.duration / 60) : 0;
        const mins = service.duration ? service.duration % 60 : 0;
        const formattedDuration = service.duration
          ? hours > 0 
            ? `${hours}h${mins > 0 ? ` ${mins}min` : ""}`.trim()
            : `${service.duration}min`
          : "-";
        return {
          ...service,
          formattedPrice: currencyFormatter.format(service.price ?? 0),
          formattedDuration,
        };
      }),
    [services, currencyFormatter],
  );

  // Generate duration options from 15 min to 2 hours (120 min) in 15-minute intervals
  const durationOptions = useMemo(() => {
    const options = [];
    for (let minutes = 15; minutes <= 120; minutes += 15) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const label = hours > 0 
        ? `${hours}h${mins > 0 ? ` ${mins}min` : ""}`.trim()
        : `${minutes}min`;
      options.push({ value: minutes.toString(), label });
    }
    return options;
  }, []);

  function openCreateDialog(): void {
    setDialogMode("create");
    setEditingService(null);
    setName("");
    setPriceInput(zeroCurrency);
    setDuration(defaultServiceDuration);
    setError(null);
  }

  function openEditDialog(service: Service): void {
    setDialogMode("edit");
    setEditingService(service);
    setName(service.name);
    setPriceInput(currencyFormatter.format(service.price ?? 0));
    setDuration(service.duration?.toString() ?? defaultServiceDuration);
    setError(null);
  }

  const isDialogOpen = dialogMode !== null;

  function handleCloseDialog(): void {
    if (isSaving) return;
    setDialogMode(null);
    setEditingService(null);
    setName("");
    setPriceInput(zeroCurrency);
    setDuration(defaultServiceDuration);
    setError(null);
  }

  function openDeleteConfirmation(service: Service): void {
    setDeleteTarget(service);
    setDeleteError(null);
  }

  function closeDeleteConfirmation(): void {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  }

  function handlePriceChange(value: string): void {
    const digitsOnly = value.replace(/\D/g, "");
    const numericValue = Number(digitsOnly) / 100;
    const formatted = currencyFormatter.format(Number.isNaN(numericValue) ? 0 : numericValue);

    setPriceInput(formatted);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedName = name.trim();
    const digitsOnly = priceInput.replace(/\D/g, "");
    const numericPrice = Number(digitsOnly) / 100;

    if (!trimmedName) {
      setError("Informe um nome para o serviço.");
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError("Informe um valor válido maior que zero.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (dialogMode === "edit" && editingService) {
        const durationValue = parseInt(duration, 10);
        const { data, error: updateError } = await supabase
          .from("services")
          .update({ name: trimmedName, price: numericPrice, duration: durationValue })
          .eq("id", editingService.id)
          .select("id, name, price, duration, created_at, updated_at")
          .single();

        if (updateError || !data) {
          setError(updateError?.message ?? "Não foi possível atualizar o serviço.");
          return;
        }

        const updatedService: Service = {
          id: data.id,
          name: data.name,
          price: typeof data.price === "number" ? data.price : Number(data.price ?? 0),
          duration: data.duration ?? null,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setServices((prev) => prev.map((service) => (service.id === updatedService.id ? updatedService : service)));
        setToast({ message: "Serviço atualizado com sucesso.", variant: "success" });
      } else {
        const durationValue = parseInt(duration, 10);
        const { data, error: insertError } = await supabase
          .from("services")
          .insert([{ name: trimmedName, price: numericPrice, duration: durationValue }])
          .select("id, name, price, duration, created_at, updated_at")
          .single();

        if (insertError || !data) {
          setError(insertError?.message ?? "Não foi possível criar o serviço.");
          return;
        }

        const newService: Service = {
          id: data.id,
          name: data.name,
          price: typeof data.price === "number" ? data.price : Number(data.price ?? 0),
          duration: data.duration ?? null,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setServices((prev) => [newService, ...prev]);
        setToast({ message: "Serviço cadastrado com sucesso.", variant: "success" });
      }

      setIsSaving(false);
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
      const { error: deleteErr } = await supabase.from("services").delete().eq("id", deleteTarget.id);

      if (deleteErr) {
        // Verifica se o erro é relacionado a foreign key constraint
        const errorMessage = deleteErr.message ?? "";
        const isForeignKeyError =
          errorMessage.includes("foreign key constraint") ||
          errorMessage.includes("schedules_service_id_fkey") ||
          deleteErr.code === "23503";

        if (isForeignKeyError) {
          setDeleteError(
            `Não é possível excluir o serviço "${deleteTarget.name}" porque existem agendamentos associados a ele. Remova ou altere os agendamentos antes de excluir o serviço.`,
          );
        } else {
          setDeleteError(deleteErr.message ?? "Não foi possível remover o serviço.");
        }
        return;
      }

      setServices((prev) => prev.filter((service) => service.id !== deleteTarget.id));
      setDeleteTarget(null);
      setToast({ message: "Serviço removido com sucesso.", variant: "success" });
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

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
        <header className="flex flex-col gap-6 pb-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.35em] text-white/50">Painel</p>
            <h2 className="text-3xl font-black text-yellow-400 lg:text-4xl">Serviços</h2>
          </div>
          <div className="flex items-center gap-3 lg:gap-4">
            <Button
              type="button"
              onClick={openCreateDialog}
              className="inline-flex items-center gap-2 rounded-full border border-yellow-400 bg-transparent px-5 py-2 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
            >
              <Plus className="h-4 w-4" />
              Adicionar serviço
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

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-inner shadow-black/20">
          <table className="min-w-full divide-y divide-white/10 text-left">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.3em] text-white/50">
              <tr>
                <th className="px-6 py-4 text-yellow-400">Nome</th>
                <th className="px-6 py-4 text-yellow-400">Preço</th>
                <th className="px-6 py-4 text-yellow-400">Duração</th>
                <th className="px-6 py-4 text-yellow-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08] text-sm text-white/80">
              {formattedServices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-white/60">
                    Nenhum serviço cadastrado até o momento.
                  </td>
                </tr>
              ) : (
                formattedServices.map((service) => (
                  <tr key={service.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-6 py-5 text-base font-medium text-white">{service.name}</td>
                    <td className="px-6 py-5 text-base text-white/80">{service.formattedPrice}</td>
                    <td className="px-6 py-5 text-base text-white/80">{service.formattedDuration}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => openEditDialog(service)}
                          className="rounded-full border border-white/10 p-2 text-white/70 transition hover:border-yellow-400 hover:bg-white/5 hover:text-yellow-400"
                          aria-label={`Editar serviço ${service.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteConfirmation(service)}
                          className="rounded-full border border-white/10 p-2 text-white/70 transition hover:border-red-400 hover:bg-red-400/10 hover:text-red-300"
                          aria-label={`Excluir serviço ${service.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
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
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isSaving) {
              handleCloseDialog();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-xl rounded-[28px] border border-white/15 bg-gradient-to-br from-black via-black/95 to-black/85 p-8 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">
                  {dialogMode === "edit" ? "Editar serviço" : "Adicionar serviço"}
                </h2>
                <p className="text-sm leading-relaxed text-white/70">
                  Preencha os dados do serviço para disponibilizar no catálogo da barbearia.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                onClick={handleCloseDialog}
                aria-label="Fechar modal"
                disabled={isSaving}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="mt-8 flex flex-col gap-6" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3">
                <Label
                  htmlFor="service-name"
                  className="text-[12px] font-semibold uppercase tracking-[0.35em] text-white/60"
                >
                  Nome
                </Label>
                <Input
                  id="service-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nome do serviço"
                  disabled={isSaving}
                  className="h-12 rounded-full border border-white/15 bg-white/10 text-base text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
              </div>

              <div className="flex flex-col gap-3">
                <Label
                  htmlFor="service-price"
                  className="text-[12px] font-semibold uppercase tracking-[0.35em] text-white/60"
                >
                  Preço
                </Label>
                <Input
                  id="service-price"
                  inputMode="numeric"
                  autoComplete="off"
                  value={priceInput}
                  onChange={(event) => handlePriceChange(event.target.value)}
                  disabled={isSaving}
                  className="h-12 rounded-full border border-white/20 bg-black/70 text-base text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <span className="text-xs text-white/40">
                  Digite apenas números. O valor será formatado automaticamente.
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <Label
                  htmlFor="service-duration"
                  className="text-[12px] font-semibold uppercase tracking-[0.35em] text-white/60"
                >
                  Duração
                </Label>
                <select
                  id="service-duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={isSaving}
                  className="h-12 rounded-full border border-white/20 bg-black/70 px-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-black text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {error ? <p className="text-sm font-medium text-red-400">{error}</p> : null}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className={cn(
                    "min-w-[160px] rounded-full bg-primary px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-primary/90",
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
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              closeDeleteConfirmation();
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-black via-black/95 to-black/90 p-8 shadow-2xl">
            <header className="space-y-2">
              <h2 className="text-2xl font-semibold text-primary">Excluir serviço</h2>
              <p className="text-sm text-white/60">
                Tem certeza de que deseja remover{" "}
                <span className="font-semibold text-white">{deleteTarget.name}</span>? Essa ação não poderá ser
                desfeita.
              </p>
            </header>

            {deleteError ? (
              <p className="mt-4 text-sm font-medium text-red-400 leading-relaxed break-words">{deleteError}</p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                className="border border-white/10 bg-transparent px-5 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                onClick={closeDeleteConfirmation}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className={cn(
                  "min-w-[120px] bg-red-500 text-white hover:bg-red-500/90",
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

