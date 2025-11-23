"use client";

import type { JSX } from "react";
import { useEffect, useState } from "react";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/client";
import { cn } from "@/lib/utils";

type TimeSlot = {
  id: string;
  start: string;
  end: string;
};

type DaySchedule = {
  enabled: boolean;
  timeSlots: TimeSlot[];
};

type WeekSchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

const daysOfWeek = [
  { key: "monday" as const, label: "Segunda-feira" },
  { key: "tuesday" as const, label: "Terça-feira" },
  { key: "wednesday" as const, label: "Quarta-feira" },
  { key: "thursday" as const, label: "Quinta-feira" },
  { key: "friday" as const, label: "Sexta-feira" },
  { key: "saturday" as const, label: "Sábado" },
  { key: "sunday" as const, label: "Domingo" },
];

export function BusinessHoursForm(): JSX.Element {
  const [schedule, setSchedule] = useState<WeekSchedule>({
    monday: { enabled: false, timeSlots: [] },
    tuesday: { enabled: false, timeSlots: [] },
    wednesday: { enabled: false, timeSlots: [] },
    thursday: { enabled: false, timeSlots: [] },
    friday: { enabled: false, timeSlots: [] },
    saturday: { enabled: false, timeSlots: [] },
    sunday: { enabled: false, timeSlots: [] },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  // Backup dos horários antes de desativar (para restaurar ao reativar sem salvar)
  const [backupSchedule, setBackupSchedule] = useState<Partial<WeekSchedule>>({});

  // Load business hours from database
  useEffect(() => {
    async function loadBusinessHours(): Promise<void> {
      try {
        const supabase = createClient();
        
        // Load all days
        const { data: daysData, error: daysError } = await supabase
          .from("business_hours_days")
          .select("*")
          .order("day_of_week");

        if (daysError) {
          console.error("[business-hours] erro ao carregar dias:", daysError);
          setIsLoading(false);
          return;
        }

        // Load all time slots
        const { data: slotsData, error: slotsError } = await supabase
          .from("business_hours_slots")
          .select("*")
          .order("start_time");

        if (slotsError) {
          console.error("[business-hours] erro ao carregar slots:", slotsError);
          setIsLoading(false);
          return;
        }

        // Initialize all days as disabled
        const initialSchedule: WeekSchedule = {
          monday: { enabled: false, timeSlots: [] },
          tuesday: { enabled: false, timeSlots: [] },
          wednesday: { enabled: false, timeSlots: [] },
          thursday: { enabled: false, timeSlots: [] },
          friday: { enabled: false, timeSlots: [] },
          saturday: { enabled: false, timeSlots: [] },
          sunday: { enabled: false, timeSlots: [] },
        };

        // Map database data to schedule state
        if (daysData) {
          for (const day of daysData) {
            const dayKey = day.day_of_week as keyof WeekSchedule;
            const daySlots = slotsData?.filter((slot) => slot.day_id === day.id) || [];
            
            initialSchedule[dayKey] = {
              enabled: day.enabled,
              timeSlots: daySlots.map((slot) => ({
                id: slot.id,
                start: slot.start_time || "",
                end: slot.end_time || "",
              })),
            };
          }
        }

        setSchedule(initialSchedule);
        // Inicializar backup com os dados carregados do banco
        setBackupSchedule(initialSchedule);
      } catch (error) {
        console.error("[business-hours] erro ao carregar horários:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadBusinessHours();
  }, []);

  // Auto-close toast after 3.2 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  function toggleDay(day: keyof WeekSchedule): void {
    setSchedule((prev) => {
      const currentDay = prev[day];
      const isActivating = !currentDay.enabled;

      if (isActivating) {
        // Está ativando: restaurar do backup ou do banco, ou criar vazio
        const backup = backupSchedule[day];
        if (backup && backup.timeSlots.length > 0) {
          // Restaurar do backup
          return {
            ...prev,
            [day]: {
              enabled: true,
              timeSlots: backup.timeSlots.map((slot) => ({
                id: slot.id || Date.now().toString() + Math.random(),
                start: slot.start || "",
                end: slot.end || "",
              })),
            },
          };
        }
        // Se não há backup, verificar se há dados salvos no banco (já carregados no schedule inicial)
        // Se não houver nenhum slot, criar um vazio
        if (currentDay.timeSlots.length === 0) {
          return {
            ...prev,
            [day]: {
              enabled: true,
              timeSlots: [{ id: Date.now().toString(), start: "", end: "" }],
            },
          };
        }
        // Se já tem slots (do banco), manter eles
        return {
          ...prev,
          [day]: {
            ...currentDay,
            enabled: true,
          },
        };
      } else {
        // Está desativando: salvar no backup antes de limpar
        setBackupSchedule((prevBackup) => ({
          ...prevBackup,
          [day]: {
            enabled: currentDay.enabled,
            timeSlots: [...currentDay.timeSlots],
          },
        }));

        return {
          ...prev,
          [day]: {
            ...currentDay,
            enabled: false,
            timeSlots: [],
          },
        };
      }
    });
  }

  function addTimeSlot(day: keyof WeekSchedule): void {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [
          ...prev[day].timeSlots,
          { id: Date.now().toString(), start: "", end: "" },
        ],
      },
    }));
  }

  function removeTimeSlot(day: keyof WeekSchedule, slotId: string): void {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter((slot) => slot.id !== slotId),
      },
    }));
  }

  function updateTimeSlot(
    day: keyof WeekSchedule,
    slotId: string,
    field: "start" | "end",
    value: string,
  ): void {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map((slot) =>
          slot.id === slotId ? { ...slot, [field]: value } : slot,
        ),
      },
    }));
  }

  async function handleSave(): Promise<void> {
    // Validate: check if any enabled day has empty time slots
    const invalidDays: string[] = [];
    for (const day of daysOfWeek) {
      const daySchedule = schedule[day.key];
      if (daySchedule.enabled) {
        // Check if all slots are empty or if there are no slots
        const hasValidSlots = daySchedule.timeSlots.some(
          (slot) => slot.start && slot.end && slot.start.trim() !== "" && slot.end.trim() !== ""
        );
        if (!hasValidSlots) {
          invalidDays.push(day.label);
        }
      }
    }

    if (invalidDays.length > 0) {
      const daysList = invalidDays.join(", ");
      setToast({
        message: `Os seguintes dias estão ativos mas não possuem horários preenchidos: ${daysList}. Por favor, preencha os horários ou desative os dias.`,
        variant: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();

      // Process each day
      for (const day of daysOfWeek) {
        const daySchedule = schedule[day.key];
        
        // Get or create day record
        let { data: dayData, error: daySelectError } = await supabase
          .from("business_hours_days")
          .select("id")
          .eq("day_of_week", day.key)
          .single();

        let dayId: string;

        if (daySelectError || !dayData) {
          // Create day if it doesn't exist
          const { data: newDay, error: dayInsertError } = await supabase
            .from("business_hours_days")
            .insert({
              day_of_week: day.key,
              enabled: daySchedule.enabled,
            })
            .select("id")
            .single();

          if (dayInsertError) {
            console.error(`[business-hours] erro ao criar dia ${day.key}:`, dayInsertError);
            continue;
          }

          dayId = newDay.id;
        } else {
          dayId = dayData.id;

          // Update day enabled status
          const { error: dayUpdateError } = await supabase
            .from("business_hours_days")
            .update({ enabled: daySchedule.enabled })
            .eq("id", dayId);

          if (dayUpdateError) {
            console.error(`[business-hours] erro ao atualizar dia ${day.key}:`, dayUpdateError);
            continue;
          }
        }

        // Delete existing slots for this day
        const { error: deleteError } = await supabase
          .from("business_hours_slots")
          .delete()
          .eq("day_id", dayId);

        if (deleteError) {
          console.error(`[business-hours] erro ao deletar slots de ${day.key}:`, deleteError);
          continue;
        }

        // Insert new slots if day is enabled and has slots
        if (daySchedule.enabled && daySchedule.timeSlots.length > 0) {
          const slotsToInsert = daySchedule.timeSlots
            .filter((slot) => slot.start && slot.end) // Only insert slots with valid times
            .map((slot) => ({
              day_id: dayId,
              start_time: slot.start,
              end_time: slot.end,
            }));

          if (slotsToInsert.length > 0) {
            const { error: slotsInsertError } = await supabase
              .from("business_hours_slots")
              .insert(slotsToInsert);

            if (slotsInsertError) {
              console.error(`[business-hours] erro ao inserir slots de ${day.key}:`, slotsInsertError);
            }
          }
        }
      }

      // Reload data to ensure consistency
      const { data: daysData } = await supabase
        .from("business_hours_days")
        .select("*")
        .order("day_of_week");

      const { data: slotsData } = await supabase
        .from("business_hours_slots")
        .select("*")
        .order("start_time");

      // Update state with saved data
      const updatedSchedule: WeekSchedule = {
        monday: { enabled: false, timeSlots: [] },
        tuesday: { enabled: false, timeSlots: [] },
        wednesday: { enabled: false, timeSlots: [] },
        thursday: { enabled: false, timeSlots: [] },
        friday: { enabled: false, timeSlots: [] },
        saturday: { enabled: false, timeSlots: [] },
        sunday: { enabled: false, timeSlots: [] },
      };

      if (daysData) {
        for (const day of daysData) {
          const dayKey = day.day_of_week as keyof WeekSchedule;
          const daySlots = slotsData?.filter((slot) => slot.day_id === day.id) || [];
          
          updatedSchedule[dayKey] = {
            enabled: day.enabled,
            timeSlots: daySlots.map((slot) => ({
              id: slot.id,
              start: slot.start_time || "",
              end: slot.end_time || "",
            })),
          };
        }
      }

      setSchedule(updatedSchedule);
      // Atualizar backup com os dados salvos
      setBackupSchedule(updatedSchedule);
      setToast({
        message: "Horários de atendimento salvos com sucesso.",
        variant: "success",
      });
    } catch (error) {
      console.error("[business-hours] erro ao salvar horários:", error);
      setToast({
        message: "Erro ao salvar horários de atendimento. Tente novamente.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white">Configurar horários</h3>
        <div className="flex items-center justify-center py-12">
          <p className="text-white/60">Carregando horários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Configurar horários</h3>

      <div className="space-y-0 border border-white/10 rounded-lg overflow-hidden bg-black/40">
        {daysOfWeek.map((day, dayIndex) => {
          const daySchedule = schedule[day.key];
          const isLastDay = dayIndex === daysOfWeek.length - 1;

          return (
            <div
              key={day.key}
              className={cn(
                "group relative flex items-start gap-4 p-4 transition hover:bg-white/5",
                !isLastDay && "border-b border-white/10"
              )}
            >
              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => toggleDay(day.key)}
                className={cn(
                  "relative mt-0.5 h-6 w-11 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-yellow-400/50",
                  daySchedule.enabled ? "bg-green-500" : "bg-gray-500"
                )}
                aria-label={`${daySchedule.enabled ? "Desativar" : "Ativar"} ${day.label}`}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                    daySchedule.enabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>

              {/* Day Name and Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4">
                  <h4 className="text-base font-medium text-white min-w-[140px] flex-shrink-0">
                    {day.label}
                  </h4>

                  {daySchedule.enabled ? (
                    <div className="flex-1 flex flex-col gap-3">
                      {daySchedule.timeSlots.map((slot, slotIndex) => {
                        const isFirstSlot = slotIndex === 0;
                        const canRemove = daySchedule.timeSlots.length > 1 && !isFirstSlot;
                        const isLastSlot = slotIndex === daySchedule.timeSlots.length - 1;

                        return (
                          <div key={slot.id} className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateTimeSlot(day.key, slot.id, "start", e.target.value)}
                              placeholder="00:00"
                              className="h-9 w-24 rounded-lg border border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-yellow-400/50"
                            />
                            <Input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateTimeSlot(day.key, slot.id, "end", e.target.value)}
                              placeholder="00:00"
                              className="h-9 w-24 rounded-lg border border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-yellow-400/50"
                            />
                            {canRemove && (
                              <button
                                type="button"
                                onClick={() => removeTimeSlot(day.key, slot.id)}
                                className="rounded-lg p-1.5 text-red-400 hover:bg-red-400/10 transition"
                                aria-label="Remover intervalo"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                            {isLastSlot && (
                              <button
                                type="button"
                                onClick={() => addTimeSlot(day.key)}
                                className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-yellow-400 hover:bg-yellow-400/10 transition"
                                aria-label="Adicionar intervalo"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-white/60">Sem atendimento</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-start pt-4">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "rounded-lg bg-yellow-400 border border-yellow-400 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-400/90",
            isSaving && "cursor-not-allowed opacity-70"
          )}
        >
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

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

