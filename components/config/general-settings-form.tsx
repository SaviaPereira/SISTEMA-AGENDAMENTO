"use client";

import type { JSX } from "react";
import { useEffect, useState } from "react";

import { Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/client";
import { cn } from "@/lib/utils";

export function GeneralSettingsForm(): JSX.Element {
  const [requirePaymentBeforeBooking, setRequirePaymentBeforeBooking] = useState(false);
  const [defaultServiceDuration, setDefaultServiceDuration] = useState("30");
  const [customBookingMessage, setCustomBookingMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  // Barbeiros
  type Barber = {
    id: string;
    name: string;
    phone: string;
    address: string;
  };

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isBarberDialogOpen, setIsBarberDialogOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [barberName, setBarberName] = useState("");
  const [barberPhone, setBarberPhone] = useState("");
  const [barberAddress, setBarberAddress] = useState("");
  const [isSavingBarber, setIsSavingBarber] = useState(false);

  // Load settings and barbers from database
  useEffect(() => {
    async function loadSettings(): Promise<void> {
      try {
        const supabase = createClient();
        
        // Load general settings
        const { data: settingsData, error: settingsError } = await supabase
          .from("general_settings")
          .select("*")
          .limit(1)
          .single();

        if (settingsError && settingsError.code !== "PGRST116") {
          console.error("[general-settings] erro ao carregar configurações:", settingsError);
        } else if (settingsData) {
          setRequirePaymentBeforeBooking(settingsData.require_payment_before_booking ?? false);
          setDefaultServiceDuration(String(settingsData.default_service_duration ?? 30));
          setCustomBookingMessage(settingsData.custom_booking_message ?? "");
        }

        // Load barbers
        const { data: barbersData, error: barbersError } = await supabase
          .from("barbers")
          .select("*")
          .order("created_at", { ascending: false });

        if (barbersError) {
          console.error("[general-settings] erro ao carregar barbeiros:", barbersError);
        } else if (barbersData) {
          setBarbers(
            barbersData.map((b) => ({
              id: b.id,
              name: b.name,
              phone: b.phone ?? "",
              address: b.address ?? "",
            }))
          );
        }
      } catch (error) {
        console.error("[general-settings] erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Auto-close toast after 3.2 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  function formatPhone(phone: string): string {
    if (!phone) return "-";
    
    // Remove todos os caracteres não numéricos
    const digitsOnly = phone.replace(/\D/g, "");
    
    // Verifica se tem pelo menos 10 dígitos (DDD + número)
    if (digitsOnly.length < 10) return phone;
    
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

  function handlePhoneChange(value: string): void {
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
    
    setBarberPhone(formatted);
  }

  function openBarberDialog(barber?: Barber): void {
    if (barber) {
      setEditingBarber(barber);
      setBarberName(barber.name);
      // Formata o telefone ao abrir para edição
      const digitsOnly = barber.phone.replace(/\D/g, "");
      setBarberPhone(digitsOnly.length >= 10 ? formatPhone(barber.phone) : barber.phone);
      setBarberAddress(barber.address);
    } else {
      setEditingBarber(null);
      setBarberName("");
      setBarberPhone("");
      setBarberAddress("");
    }
    setIsBarberDialogOpen(true);
  }

  function closeBarberDialog(): void {
    setIsBarberDialogOpen(false);
    setEditingBarber(null);
    setBarberName("");
    setBarberPhone("");
    setBarberAddress("");
  }

  async function handleSaveBarber(): Promise<void> {
    if (!barberName.trim()) return;

    setIsSavingBarber(true);
    try {
      const supabase = createClient();

      if (editingBarber) {
        const { error } = await supabase
          .from("barbers")
          .update({
            name: barberName,
            phone: barberPhone || null,
            address: barberAddress || null,
          })
          .eq("id", editingBarber.id);

        if (error) {
          console.error("[general-settings] erro ao atualizar barbeiro:", error);
          setToast({
            message: "Erro ao atualizar barbeiro. Tente novamente.",
            variant: "error",
          });
          return;
        }

        setBarbers((prev) =>
          prev.map((b) =>
            b.id === editingBarber.id
              ? { ...b, name: barberName, phone: barberPhone, address: barberAddress }
              : b
          )
        );
      } else {
        const { data, error } = await supabase
          .from("barbers")
          .insert({
            name: barberName,
            phone: barberPhone || null,
            address: barberAddress || null,
          })
          .select()
          .single();

        if (error) {
          console.error("[general-settings] erro ao criar barbeiro:", error);
          setToast({
            message: "Erro ao criar barbeiro. Tente novamente.",
            variant: "error",
          });
          return;
        }

        setBarbers((prev) => [
          ...prev,
          {
            id: data.id,
            name: data.name,
            phone: data.phone ?? "",
            address: data.address ?? "",
          },
        ]);
      }

      closeBarberDialog();
    } catch (error) {
      console.error("[general-settings] erro ao salvar barbeiro:", error);
      setToast({
        message: "Erro ao salvar barbeiro. Tente novamente.",
        variant: "error",
      });
    } finally {
      setIsSavingBarber(false);
    }
  }

  async function handleDeleteBarber(barberId: string): Promise<void> {
    try {
      const supabase = createClient();
      const { error } = await supabase.from("barbers").delete().eq("id", barberId);

      if (error) {
        console.error("[general-settings] erro ao deletar barbeiro:", error);
        setToast({
          message: "Erro ao remover barbeiro. Tente novamente.",
          variant: "error",
        });
        return;
      }

      setBarbers((prev) => prev.filter((b) => b.id !== barberId));
    } catch (error) {
      console.error("[general-settings] erro ao deletar barbeiro:", error);
      setToast({
        message: "Erro ao remover barbeiro. Tente novamente.",
        variant: "error",
      });
    }
  }

  async function handleSaveSettings(): Promise<void> {
    setIsSaving(true);
    try {
      const supabase = createClient();

      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from("general_settings")
        .select("id")
        .limit(1)
        .single();

      const settingsData = {
        require_payment_before_booking: requirePaymentBeforeBooking,
        default_service_duration: parseInt(defaultServiceDuration, 10),
        custom_booking_message: customBookingMessage || null,
      };

      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from("general_settings")
          .update(settingsData)
          .eq("id", existingSettings.id);

        if (error) {
          console.error("[general-settings] erro ao atualizar configurações:", error);
          setToast({
            message: "Erro ao salvar configurações. Tente novamente.",
            variant: "error",
          });
          return;
        }
      } else {
        // Create new settings
        const { error } = await supabase.from("general_settings").insert(settingsData);

        if (error) {
          console.error("[general-settings] erro ao criar configurações:", error);
          setToast({
            message: "Erro ao salvar configurações. Tente novamente.",
            variant: "error",
          });
          return;
        }
      }

      setToast({
        message: "Configurações salvas com sucesso.",
        variant: "success",
      });
    } catch (error) {
      console.error("[general-settings] erro ao salvar configurações:", error);
      setToast({
        message: "Erro ao salvar configurações. Tente novamente.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Generate duration options from 15 min to 2 hours (120 min) in 15-minute intervals
  const durationOptions = [];
  for (let minutes = 15; minutes <= 120; minutes += 15) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const label = hours > 0 
      ? `${hours}h${mins > 0 ? ` ${mins}min` : ""}`.trim()
      : `${minutes}min`;
    durationOptions.push({ value: minutes.toString(), label });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white">Configurações Gerais</h3>
        <div className="flex items-center justify-center py-12">
          <p className="text-white/60">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Configurações Gerais</h3>

      <div className="space-y-6">
        {/* Pagamento Antecipado */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-base font-semibold text-white mb-1">
                Pagamento Antecipado
              </h4>
              <p className="text-sm text-white/60">
                Exigir pagamento antes do agendamento?
              </p>
              <p className="text-xs text-white/50 mt-2">
                {requirePaymentBeforeBooking
                  ? "ON: bloqueia o agendamento até o pagamento ser confirmado"
                  : "OFF: permite agendar normalmente"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRequirePaymentBeforeBooking(!requirePaymentBeforeBooking)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-yellow-400/50",
                requirePaymentBeforeBooking ? "bg-green-500" : "bg-gray-500"
              )}
              aria-label={`${requirePaymentBeforeBooking ? "Desativar" : "Ativar"} pagamento antecipado`}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                  requirePaymentBeforeBooking ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {/* Duração padrão dos serviços */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-6">
          <div className="space-y-3">
            <div>
              <h4 className="text-base font-semibold text-white mb-1">
                Duração padrão dos serviços
              </h4>
              <p className="text-sm text-white/60">
                Tempo padrão (caso não seja definido por serviço)
              </p>
            </div>
            <select
              value={defaultServiceDuration}
              onChange={(e) => setDefaultServiceDuration(e.target.value)}
              className="h-10 w-full max-w-xs rounded-lg border border-white/20 bg-white/10 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
            >
              {durationOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-black text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Controle de Barbeiros */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-semibold text-white mb-1">
                  Controle de Barbeiros
                </h4>
                <p className="text-sm text-white/60">
                  Gerencie os barbeiros disponíveis para atendimento
                </p>
              </div>
              <Button
                type="button"
                onClick={() => openBarberDialog()}
                className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400 bg-transparent px-4 py-2 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
              >
                <Plus className="h-4 w-4" />
                Adicionar barbeiro
              </Button>
            </div>

            {barbers.length === 0 ? (
              <p className="text-sm text-white/60 py-4">
                Nenhum barbeiro cadastrado. Clique em "Adicionar barbeiro" para começar.
              </p>
            ) : (
              <div className="space-y-2">
                {barbers.map((barber) => (
                  <div
                    key={barber.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{barber.name}</p>
                      {barber.phone && (
                        <p className="text-xs text-white/60 mt-1">Telefone: {formatPhone(barber.phone)}</p>
                      )}
                      {barber.address && (
                        <p className="text-xs text-white/60 mt-1">Endereço: {barber.address}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openBarberDialog(barber)}
                        className="rounded-lg p-1.5 text-yellow-400 hover:bg-yellow-400/10 transition"
                        aria-label="Editar barbeiro"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBarber(barber.id)}
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-400/10 transition"
                        aria-label="Remover barbeiro"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mensagem personalizada ao final do agendamento */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-6">
          <div className="space-y-3">
            <div>
              <h4 className="text-base font-semibold text-white mb-1">
                Mensagem personalizada ao final do agendamento
              </h4>
              <p className="text-sm text-white/60">
                Mensagem de agradecimento ou instruções que aparece na tela de sucesso do agendamento
              </p>
            </div>
            <textarea
              value={customBookingMessage}
              onChange={(e) => setCustomBookingMessage(e.target.value)}
              placeholder="Digite sua mensagem personalizada aqui..."
              rows={4}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-y"
            />
          </div>
        </div>
      </div>

      {/* Botão Salvar Configurações */}
      <div className="flex justify-start pt-4">
        <Button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSaving}
          className={cn(
            "rounded-lg bg-yellow-400 border border-yellow-400 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-400/90",
            isSaving && "cursor-not-allowed opacity-70"
          )}
        >
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>

      {/* Toast */}
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

      {/* Dialog para adicionar/editar barbeiro */}
      {isBarberDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl">
            <button
              type="button"
              onClick={closeBarberDialog}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="mb-6 text-xl font-bold text-yellow-400">
              {editingBarber ? "Editar Barbeiro" : "Adicionar Barbeiro"}
            </h3>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="barber-name" className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Nome *
                </label>
                <Input
                  id="barber-name"
                  type="text"
                  value={barberName}
                  onChange={(e) => setBarberName(e.target.value)}
                  placeholder="Nome do barbeiro"
                  className="h-11 rounded-full border border-white/15 bg-white/10 px-4 text-sm text-white placeholder:text-white/40 focus:ring-2 focus:ring-yellow-400/50"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="barber-phone" className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Telefone
                </label>
                <Input
                  id="barber-phone"
                  type="tel"
                  value={barberPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(XX) XXXXX-XXXX"
                  className="h-11 rounded-full border border-white/15 bg-white/10 px-4 text-sm text-white placeholder:text-white/40 focus:ring-2 focus:ring-yellow-400/50"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="barber-address" className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Endereço
                </label>
                <Input
                  id="barber-address"
                  type="text"
                  value={barberAddress}
                  onChange={(e) => setBarberAddress(e.target.value)}
                  placeholder="Endereço do barbeiro"
                  className="h-11 rounded-full border border-white/15 bg-white/10 px-4 text-sm text-white placeholder:text-white/40 focus:ring-2 focus:ring-yellow-400/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleSaveBarber}
                  disabled={isSavingBarber || !barberName.trim()}
                  className="flex-1 rounded-full bg-yellow-400 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-400/90 disabled:opacity-50"
                >
                  {isSavingBarber ? "Salvando..." : editingBarber ? "Atualizar" : "Adicionar"}
                </Button>
                <Button
                  type="button"
                  onClick={closeBarberDialog}
                  disabled={isSavingBarber}
                  className="rounded-full border border-white/20 bg-transparent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

