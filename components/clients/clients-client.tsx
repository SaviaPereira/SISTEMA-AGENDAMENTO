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

type Client = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  createdAt: string;
  updatedAt: string;
};

interface ClientsClientProps {
  initialClients: Client[];
}

export function ClientsClient({ initialClients }: ClientsClientProps): JSX.Element {
  const navigationItems: DashboardNavItem[] = [
    { label: "Dashboard", icon: "layout-grid", href: "/dashboard" },
    { label: "Serviços", icon: "scissors", href: "/services" },
    { label: "Agendamentos", icon: "calendar-days", href: "/schedules" },
    { label: "Clientes", icon: "user", href: "/clients" },
    { label: "Horários", icon: "clock", href: "/business-hours" },
  ];

  const [clients, setClients] = useState<Client[]>(initialClients);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const supabase = useMemo(() => createClient(), []);

  function formatWhatsApp(whatsapp: string): string {
    if (!whatsapp) return "-";
    
    // Remove todos os caracteres não numéricos
    const digitsOnly = whatsapp.replace(/\D/g, "");
    
    // Verifica se tem pelo menos 10 dígitos (DDD + número)
    if (digitsOnly.length < 10) return whatsapp;
    
    // Formata: (XX) XXXXX-XXXX
    if (digitsOnly.length === 10) {
      // Número sem DDD adicional (já tem DDD)
      return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 6)}-${digitsOnly.slice(6)}`;
    }
    
    // Formata: (XX) XXXXX-XXXX (com DDD)
    if (digitsOnly.length === 11) {
      return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7)}`;
    }
    
    // Se tiver mais de 11 dígitos, assume que os 2 primeiros são DDD
    return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7, 11)}`;
  }

  function handleWhatsAppChange(value: string): void {
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
    
    setWhatsapp(formatted);
  }

  function openCreateDialog(): void {
    setDialogMode("create");
    setEditingClient(null);
    setName("");
    setEmail("");
    setWhatsapp("");
    setError(null);
  }

  function openEditDialog(client: Client): void {
    setDialogMode("edit");
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email);
    // Formata o WhatsApp ao abrir para edição
    const digitsOnly = client.whatsapp.replace(/\D/g, "");
    setWhatsapp(digitsOnly.length >= 10 ? formatWhatsApp(client.whatsapp) : client.whatsapp);
    setError(null);
  }

  const isDialogOpen = dialogMode !== null;

  function handleCloseDialog(): void {
    if (isSaving) return;
    setDialogMode(null);
    setEditingClient(null);
    setName("");
    setEmail("");
    setWhatsapp("");
    setError(null);
  }

  function openDeleteConfirmation(client: Client): void {
    setDeleteTarget(client);
    setDeleteError(null);
  }

  function closeDeleteConfirmation(): void {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Informe o nome do cliente.");
      return;
    }

    setIsSaving(true);
    setError(null);

    // Remove formatação do WhatsApp antes de salvar (apenas dígitos)
    const whatsappDigitsOnly = whatsapp.replace(/\D/g, "");

    try {
      if (dialogMode === "edit" && editingClient) {
        const { data, error: updateError } = await supabase
          .from("clients")
          .update({
            name: trimmedName,
            email: email.trim() || null,
            whatsapp: whatsappDigitsOnly || null,
          })
          .eq("id", editingClient.id)
          .select("id, name, email, whatsapp, created_at, updated_at")
          .single();

        if (updateError || !data) {
          setError(updateError?.message ?? "Não foi possível atualizar o cliente.");
          return;
        }

        const updatedClient: Client = {
          id: data.id,
          name: data.name,
          email: data.email ?? "",
          whatsapp: data.whatsapp ?? "",
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setClients((prev) => prev.map((client) => (client.id === updatedClient.id ? updatedClient : client)));
        setToast({ message: "Cliente atualizado com sucesso.", variant: "success" });
      } else {
        const { data, error: insertError } = await supabase
          .from("clients")
          .insert([
            {
              name: trimmedName,
              email: email.trim() || null,
              whatsapp: whatsappDigitsOnly || null,
            },
          ])
          .select("id, name, email, whatsapp, created_at, updated_at")
          .single();

        if (insertError || !data) {
          setError(insertError?.message ?? "Não foi possível criar o cliente.");
          return;
        }

        const newClient: Client = {
          id: data.id,
          name: data.name,
          email: data.email ?? "",
          whatsapp: data.whatsapp ?? "",
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setClients((prev) => [newClient, ...prev]);
        setToast({ message: "Cliente cadastrado com sucesso.", variant: "success" });
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
      const { error: deleteErr } = await supabase.from("clients").delete().eq("id", deleteTarget.id);

      if (deleteErr) {
        // Verifica se o erro é relacionado a foreign key constraint
        const errorMessage = deleteErr.message ?? "";
        const isForeignKeyError =
          errorMessage.includes("foreign key constraint") ||
          errorMessage.includes("schedules_client_id_fkey") ||
          deleteErr.code === "23503";

        if (isForeignKeyError) {
          setDeleteError(
            `Não é possível excluir o cliente "${deleteTarget.name}" porque existem agendamentos associados a ele. Remova ou altere os agendamentos antes de excluir o cliente.`,
          );
        } else {
          setDeleteError(deleteErr.message ?? "Não foi possível remover o cliente.");
        }
        return;
      }

      setClients((prev) => prev.filter((client) => client.id !== deleteTarget.id));
      setDeleteTarget(null);
      setToast({ message: "Cliente removido com sucesso.", variant: "success" });
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

      <main className="relative flex-1 px-3 sm:px-4 lg:px-6 xl:px-12 pb-24 sm:pb-28 pt-6 sm:pt-8 lg:pt-10 lg:pb-12">
        <header className="flex flex-col gap-4 pb-6 lg:gap-6 lg:pb-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1 lg:space-y-2">
            <p className="text-xs lg:text-sm uppercase tracking-[0.35em] text-white/50">Painel</p>
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black text-yellow-400">Clientes</h2>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <Button
              type="button"
              onClick={openCreateDialog}
              className="inline-flex items-center gap-1.5 lg:gap-2 rounded-full border border-yellow-400 bg-transparent px-3 py-1.5 lg:px-5 lg:py-2 text-xs lg:text-sm font-semibold text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
            >
              <Plus className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              <span className="hidden sm:inline">Adicionar cliente</span>
              <span className="sm:hidden">Adicionar</span>
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

        <div className="overflow-x-auto overflow-hidden rounded-2xl lg:rounded-3xl border border-white/10 bg-black/40 shadow-inner shadow-black/20">
          <table className="min-w-full divide-y divide-white/10 text-left">
            <thead className="bg-white/[0.03] text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/50">
              <tr>
                <th className="px-2 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-yellow-400">Nome</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-yellow-400">Email</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-yellow-400">WhatsApp</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-yellow-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08] text-xs sm:text-sm text-white/80">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 sm:px-6 sm:py-8 text-center text-white/60 text-xs sm:text-sm">
                    Nenhum cliente cadastrado até o momento.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-2 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5 text-xs sm:text-sm lg:text-base font-medium text-white">{client.name}</td>
                    <td className="px-2 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5 text-xs sm:text-sm lg:text-base text-white/80">{client.email || "-"}</td>
                    <td className="px-2 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5 text-xs sm:text-sm lg:text-base text-white/80">{formatWhatsApp(client.whatsapp)}</td>
                    <td className="px-2 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
                      <div className="flex items-center justify-end gap-1.5 sm:gap-2 lg:gap-3">
                        <button
                          type="button"
                          onClick={() => openEditDialog(client)}
                          className="rounded-full border border-white/10 p-1.5 sm:p-2 text-white/70 transition hover:border-yellow-400 hover:bg-white/5 hover:text-yellow-400"
                          aria-label={`Editar cliente ${client.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteConfirmation(client)}
                          className="rounded-full border border-white/10 p-1.5 sm:p-2 text-white/70 transition hover:border-red-400 hover:bg-red-400/10 hover:text-red-300"
                          aria-label={`Excluir cliente ${client.name}`}
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
                  {dialogMode === "edit" ? "Editar cliente" : "Adicionar cliente"}
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-white/70">
                  Preencha os dados do cliente para cadastrar no sistema.
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
                  htmlFor="client-name"
                  className="text-[10px] sm:text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.35em] text-white/60"
                >
                  Nome
                </Label>
                <Input
                  id="client-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nome do cliente"
                  disabled={isSaving}
                  className="h-10 sm:h-11 lg:h-12 rounded-full border border-white/15 bg-white/10 text-sm sm:text-base text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="email@exemplo.com"
                  disabled={isSaving}
                  className="h-10 sm:h-11 lg:h-12 rounded-full border border-white/15 bg-white/10 text-sm sm:text-base text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                  value={whatsapp}
                  onChange={(event) => handleWhatsAppChange(event.target.value)}
                  placeholder="(00) 00000-0000"
                  disabled={isSaving}
                  className="h-10 sm:h-11 lg:h-12 rounded-full border border-white/15 bg-white/10 text-sm sm:text-base text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
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
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary">Excluir cliente</h2>
              <p className="text-xs sm:text-sm text-white/60">
                Tem certeza de que deseja remover{" "}
                <span className="font-semibold text-white">{deleteTarget.name}</span>? Essa ação não poderá ser
                desfeita.
              </p>
            </header>

            {deleteError ? (
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-red-400 leading-relaxed break-words">
                {deleteError}
              </p>
            ) : null}

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

