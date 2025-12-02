"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ptBR } from "date-fns/locale"
import { startOfDay, isBefore } from "date-fns"
import { createClient } from "@/lib/client"

type Client = {
  id: string
  name: string
  email: string
  whatsapp: string
}

type Service = {
  id: string
  name: string
  price: number
  duration: number | null
}

type Barber = {
  id: string
  name: string
}

type BusinessHoursDay = {
  id: string
  day_of_week: string
  enabled: boolean
}

type BusinessHoursSlot = {
  id: string
  day_id: string
  start_time: string
  end_time: string
}

export default function Agendamento() {
  // Estados do formulário
  const [phone, setPhone] = useState<string>("")
  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [selectedService, setSelectedService] = useState<string>("")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedBarber, setSelectedBarber] = useState<string>("")

  // Estados de controle do fluxo
  const [isClientFound, setIsClientFound] = useState<boolean>(false)
  const [isClientFoundBySearch, setIsClientFoundBySearch] = useState<boolean>(false) // Cliente encontrado na busca inicial
  const [isSearchingClient, setIsSearchingClient] = useState<boolean>(false)
  const [isSavingClient, setIsSavingClient] = useState<boolean>(false)
  const [isLoadingServices, setIsLoadingServices] = useState<boolean>(false)
  const [isLoadingBarbers, setIsLoadingBarbers] = useState<boolean>(false)
  const [isLoadingBusinessHours, setIsLoadingBusinessHours] = useState<boolean>(false)
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [enabledDays, setEnabledDays] = useState<number[]>([]) // Array com números dos dias da semana (0=domingo, 1=segunda, etc.)
  const [businessHoursDays, setBusinessHoursDays] = useState<BusinessHoursDay[]>([]) // Dias da semana com seus IDs
  const [businessHoursSlots, setBusinessHoursSlots] = useState<BusinessHoursSlot[]>([]) // Todos os slots de horários
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]) // Horários disponíveis para o dia selecionado
  const [clientData, setClientData] = useState<Client | null>(null)
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false)

  // Buscar serviços do Supabase
  useEffect(() => {
    async function fetchServices() {
      const client = createClient()
      setIsLoadingServices(true)
      try {
        const { data, error } = await client
          .from("services")
          .select("id, name, price, duration")
          .order("name", { ascending: true })

        if (error) {
          console.error("Erro ao buscar serviços:", error)
        } else {
          setServices(data || [])
        }
      } catch (error) {
        console.error("Erro ao buscar serviços:", error)
      } finally {
        setIsLoadingServices(false)
      }
    }

    fetchServices()
  }, [])

  // Buscar barbeiros do Supabase
  useEffect(() => {
    async function fetchBarbers() {
      const client = createClient()
      setIsLoadingBarbers(true)
      try {
        const { data, error } = await client
          .from("barbers")
          .select("id, name")
          .order("name", { ascending: true })

        if (error) {
          console.error("Erro ao buscar barbeiros:", error)
        } else {
          setBarbers(data || [])
        }
      } catch (error) {
        console.error("Erro ao buscar barbeiros:", error)
      } finally {
        setIsLoadingBarbers(false)
      }
    }

    fetchBarbers()
  }, [])

  // Buscar dias da semana habilitados e horários do Supabase
  useEffect(() => {
    async function fetchBusinessHours() {
      const client = createClient()
      setIsLoadingBusinessHours(true)
      try {
        // Buscar TODOS os dias (habilitados e desabilitados) para diferenciação visual
        const { data: daysData, error: daysError } = await client
          .from("business_hours_days")
          .select("id, day_of_week, enabled")
          .order("id", { ascending: true })

        if (daysError) {
          console.error("Erro ao buscar dias:", daysError)
        } else if (daysData) {
          setBusinessHoursDays(daysData)
          
          // Mapear nomes dos dias para números (0=domingo, 1=segunda, etc.)
          const dayMap: Record<string, number> = {
            sunday: 0,
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6,
          }
          
          // Separar dias habilitados e desabilitados
          const enabledDayNumbers = daysData
            .filter((day) => day.enabled)
            .map((day) => dayMap[day.day_of_week.toLowerCase()])
            .filter((dayNum) => dayNum !== undefined) as number[]
          
          setEnabledDays(enabledDayNumbers)
        }

        // Buscar todos os slots de horários
        const { data: slotsData, error: slotsError } = await client
          .from("business_hours_slots")
          .select("id, day_id, start_time, end_time")
          .order("start_time", { ascending: true })

        if (slotsError) {
          console.error("Erro ao buscar horários:", slotsError)
        } else if (slotsData) {
          setBusinessHoursSlots(slotsData)
        }
      } catch (error) {
        console.error("Erro ao buscar horários de funcionamento:", error)
      } finally {
        setIsLoadingBusinessHours(false)
      }
    }

    fetchBusinessHours()
  }, [])

  // Gerar horários disponíveis baseado no dia selecionado e barbeiro
  useEffect(() => {
    if (!date || !selectedBarber || businessHoursDays.length === 0 || businessHoursSlots.length === 0) {
      setAvailableTimeSlots([])
      return
    }

    const dayOfWeek = date.getDay()
    const dayMap: Record<number, string> = {
      0: "sunday",
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday",
    }

    const dayName = dayMap[dayOfWeek]
    const dayData = businessHoursDays.find(
      (day) => day.day_of_week.toLowerCase() === dayName
    )

    if (!dayData) {
      setAvailableTimeSlots([])
      return
    }

    // Buscar slots do dia selecionado
    const daySlots = businessHoursSlots.filter((slot) => slot.day_id === dayData.id)

    if (daySlots.length === 0) {
      setAvailableTimeSlots([])
      return
    }

    // Gerar lista de horários baseado nos slots
    const timeSlots: string[] = []
    
    daySlots.forEach((slot) => {
      const start = new Date(`2000-01-01T${slot.start_time}`)
      const end = new Date(`2000-01-01T${slot.end_time}`)
      
      // Gerar intervalos de 30 minutos
      let current = new Date(start)
      while (current < end) {
        const hours = current.getHours().toString().padStart(2, "0")
        const minutes = current.getMinutes().toString().padStart(2, "0")
        timeSlots.push(`${hours}:${minutes}`)
        
        // Adicionar 30 minutos
        current.setMinutes(current.getMinutes() + 30)
      }
    })

    // Remover duplicatas e ordenar
    const uniqueTimeSlots = [...new Set(timeSlots)].sort()
    
    // Buscar horários já ocupados pelo barbeiro selecionado na data selecionada
    async function filterOccupiedSlots() {
      if (!selectedBarber || !date) {
        setAvailableTimeSlots(uniqueTimeSlots)
        return
      }

      const client = createClient()
      const dateString = date.toISOString().split('T')[0] // Formato YYYY-MM-DD
      
      try {
        // Tentar buscar com barber_id primeiro
        const { data: occupiedSchedules, error } = await client
          .from("schedules")
          .select("hora_agendada, barber_id")
          .eq("data_agendada", dateString)
          .eq("barber_id", selectedBarber)
          .neq("status", "cancelado")

        if (error) {
          // Se o erro for relacionado à coluna barber_id não existir, tentar sem ela
          const errorMessage = error.message || ""
          const errorCode = error.code || ""
          
          if (errorMessage.includes("barber_id") || errorCode === "42703" || errorMessage.includes("column") && errorMessage.includes("does not exist")) {
            console.warn("Coluna barber_id não encontrada, buscando sem filtro de barbeiro. Execute a migration para habilitar filtro por barbeiro.")
            // Buscar sem filtro de barbeiro (compatibilidade durante migração)
            const { data: allSchedules, error: allError } = await client
              .from("schedules")
              .select("hora_agendada")
              .eq("data_agendada", dateString)
              .neq("status", "cancelado")

            if (allError) {
              console.error("Erro ao buscar horários ocupados (sem barbeiro):", {
                message: allError.message,
                details: allError.details,
                hint: allError.hint,
                code: allError.code,
              })
              setAvailableTimeSlots(uniqueTimeSlots)
              return
            }

            // Filtrar horários ocupados (todos os horários, já que não temos barber_id)
            const occupiedTimes = (allSchedules || []).map((schedule) => {
              const time = schedule.hora_agendada
              if (typeof time === 'string' && time.includes(':')) {
                const [hours, minutes] = time.split(':')
                return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
              }
              return time
            })

            const availableSlots = uniqueTimeSlots.filter((slot) => !occupiedTimes.includes(slot))
            setAvailableTimeSlots(availableSlots)
            
            if (selectedTime && !availableSlots.includes(selectedTime)) {
              setSelectedTime("")
            }
            return
          }

          console.error("Erro ao buscar horários ocupados:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          })
          setAvailableTimeSlots(uniqueTimeSlots)
          return
        }

        // Usar os agendamentos já filtrados por barbeiro
        const barberSchedules = occupiedSchedules || []

        // Converter horários ocupados para formato HH:MM
        const occupiedTimes = barberSchedules.map((schedule) => {
          const time = schedule.hora_agendada
          // Se já está no formato HH:MM, retornar direto
          if (typeof time === 'string' && time.includes(':')) {
            const [hours, minutes] = time.split(':')
            return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
          }
          return time
        })

        // Filtrar horários ocupados
        const availableSlots = uniqueTimeSlots.filter((slot) => !occupiedTimes.includes(slot))
        setAvailableTimeSlots(availableSlots)
        
        // Limpar seleção de horário se o horário atual não estiver mais disponível
        if (selectedTime && !availableSlots.includes(selectedTime)) {
          setSelectedTime("")
        }
      } catch (error) {
        console.error("Erro ao filtrar horários ocupados:", error)
        setAvailableTimeSlots(uniqueTimeSlots)
      }
    }

    filterOccupiedSlots()
  }, [date, selectedBarber, businessHoursDays, businessHoursSlots, selectedTime])

  // Função para verificar se uma data pode ser selecionada
  const isDateSelectable = (date: Date): boolean => {
    const dayOfWeek = date.getDay() // 0 = domingo, 1 = segunda, etc.
    return enabledDays.includes(dayOfWeek)
  }

  // Função para verificar se um dia está desabilitado na configuração
  const isDayDisabled = (date: Date): boolean => {
    if (businessHoursDays.length === 0) {
      return false // Se ainda não carregou, não desabilitar
    }

    const dayOfWeek = date.getDay()
    const dayMap: Record<number, string> = {
      0: "sunday",
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday",
    }

    const dayName = dayMap[dayOfWeek]
    const dayData = businessHoursDays.find(
      (day) => day.day_of_week.toLowerCase().trim() === dayName.toLowerCase().trim()
    )

    // Se não encontrou o dia na configuração, considerar desabilitado por segurança
    if (!dayData) {
      return true
    }

    // Retornar true se enabled for false
    return !dayData.enabled
  }

  // Função para desabilitar datas no calendário
  const disabledDates = (date: Date): boolean => {
    // Não permitir datas no passado
    const today = startOfDay(new Date())
    const dateToCheck = startOfDay(date)
    
    if (isBefore(dateToCheck, today)) {
      return true
    }
    
    // Verificar se o dia da semana está desabilitado na configuração
    // Se businessHoursDays ainda não carregou, permitir temporariamente
    if (businessHoursDays.length === 0) {
      return false
    }
    
    return isDayDisabled(date)
  }

  // Função para identificar dias desabilitados (para estilização)
  const modifiers = {
    disabled_day: (date: Date) => isDayDisabled(date),
  }

  // Buscar cliente quando telefone estiver completo
  useEffect(() => {
    async function searchClient() {
      // Remove caracteres não numéricos
      const cleanPhone = phone.replace(/\D/g, "")
      
      // Verifica se tem pelo menos 10 dígitos (formato mínimo brasileiro)
      if (cleanPhone.length < 10) {
        setIsClientFound(false)
        setClientData(null)
        setName("")
        setEmail("")
        return
      }

      const client = createClient()
      setIsSearchingClient(true)
      try {
        const { data, error } = await client
          .from("clients")
          .select("id, name, email, whatsapp")
          .eq("whatsapp", cleanPhone)
          .single()

        if (error && error.code !== "PGRST116") {
          // PGRST116 = nenhum resultado encontrado
          console.error("Erro ao buscar cliente:", error)
          setIsClientFound(false)
          setClientData(null)
        } else if (data) {
          // Cliente encontrado
          setIsClientFound(true)
          setIsClientFoundBySearch(true) // Marca que foi encontrado na busca
          setClientData(data)
          setName(data.name)
          setEmail(data.email)
        } else {
          // Cliente não encontrado
          setIsClientFound(false)
          setIsClientFoundBySearch(false)
          setClientData(null)
          setName("")
          setEmail("")
        }
      } catch (error) {
        console.error("Erro ao buscar cliente:", error)
        setIsClientFound(false)
        setClientData(null)
      } finally {
        setIsSearchingClient(false)
      }
    }

    // Debounce para evitar muitas buscas
    const timeoutId = setTimeout(() => {
      searchClient()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [phone])

  // Função para validar email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  // Função para formatar telefone brasileiro
  const formatPhone = (value: string): string => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, "")
    
    // Limita a 11 dígitos (formato brasileiro)
    const limitedDigits = digits.slice(0, 11)
    
    // Aplica formatação baseada no tamanho
    if (limitedDigits.length <= 2) {
      return limitedDigits
    } else if (limitedDigits.length <= 7) {
      return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2)}`
    } else if (limitedDigits.length <= 10) {
      return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 6)}-${limitedDigits.slice(6)}`
    } else {
      // Celular com 11 dígitos
      return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 7)}-${limitedDigits.slice(7)}`
    }
  }

  // Handler para mudança no campo telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  // Salvar cliente automaticamente quando nome e email forem preenchidos (cliente não encontrado)
  useEffect(() => {
    async function saveClient() {
      // Só salva se:
      // 1. Cliente não foi encontrado
      // 2. Nome está preenchido (mínimo 2 caracteres)
      // 3. Email está preenchido E válido (formato correto)
      // 4. Telefone tem pelo menos 10 dígitos
      // 5. Não está buscando cliente
      // 6. Cliente ainda não foi salvo (clientData é null)
      // 7. Não está salvando no momento
      const cleanPhone = phone.replace(/\D/g, "")
      const trimmedName = name.trim()
      const trimmedEmail = email.trim()

      if (
        !isClientFound &&
        trimmedName.length >= 2 &&
        trimmedEmail !== "" &&
        isValidEmail(trimmedEmail) &&
        cleanPhone.length >= 10 &&
        !isSearchingClient &&
        !clientData &&
        !isSavingClient
      ) {
        setIsSavingClient(true)
        const client = createClient()
        
        try {
          // Verifica se o cliente já existe (pode ter sido criado em outra aba/sessão)
          const { data: existingClient } = await client
            .from("clients")
            .select("id, name, email, whatsapp")
            .eq("whatsapp", cleanPhone)
            .single()

          if (existingClient) {
            // Cliente já existe, apenas atualiza o estado
            setIsClientFound(true)
            setIsClientFoundBySearch(false) // Não foi encontrado na busca inicial, foi criado agora
            setClientData(existingClient)
            setName(existingClient.name)
            setEmail(existingClient.email)
          } else {
            // Cria novo cliente
            const { data, error } = await client
              .from("clients")
              .insert([
                {
                  name: trimmedName,
                  email: trimmedEmail,
                  whatsapp: cleanPhone,
                },
              ])
              .select("id, name, email, whatsapp")
              .single()

            if (error) {
              console.error("Erro ao salvar cliente:", error)
              // Não mostra erro para o usuário, apenas loga
            } else if (data) {
              // Cliente salvo com sucesso
              setIsClientFound(true)
              setIsClientFoundBySearch(false) // Não foi encontrado na busca, foi criado agora
              setClientData(data)
              // Atualiza os estados para refletir que o cliente foi salvo
              console.log("Cliente salvo automaticamente:", data)
            }
          }
        } catch (error) {
          console.error("Erro ao salvar cliente:", error)
        } finally {
          setIsSavingClient(false)
        }
      }
    }

    // Debounce aumentado para dar mais tempo ao usuário preencher
    const timeoutId = setTimeout(() => {
      saveClient()
    }, 2000) // Aumentado para 2 segundos

    return () => clearTimeout(timeoutId)
  }, [name, email, phone, isClientFound, isSearchingClient, clientData, isSavingClient])

  // Atualizar cliente quando campos forem editados após salvamento automático
  useEffect(() => {
    async function updateClient() {
      // Só atualiza se:
      // 1. Cliente foi salvo automaticamente (não foi encontrado na busca)
      // 2. Cliente tem ID (foi salvo)
      // 3. Nome e email estão válidos
      // 4. Não está salvando
      // 5. Não está buscando
      if (
        isClientFound &&
        !isClientFoundBySearch &&
        clientData?.id &&
        name.trim().length >= 2 &&
        isValidEmail(email.trim()) &&
        !isSavingClient &&
        !isSearchingClient
      ) {
        const trimmedName = name.trim()
        const trimmedEmail = email.trim()

        // Só atualiza se os valores mudaram
        if (
          trimmedName !== clientData.name ||
          trimmedEmail !== clientData.email
        ) {
          setIsSavingClient(true)
          const client = createClient()

          try {
            const { data, error } = await client
              .from("clients")
              .update({
                name: trimmedName,
                email: trimmedEmail,
              })
              .eq("id", clientData.id)
              .select("id, name, email, whatsapp")
              .single()

            if (error) {
              console.error("Erro ao atualizar cliente:", error)
            } else if (data) {
              setClientData(data)
            }
          } catch (error) {
            console.error("Erro ao atualizar cliente:", error)
          } finally {
            setIsSavingClient(false)
          }
        }
      }
    }

    // Debounce para evitar atualizações múltiplas
    const timeoutId = setTimeout(() => {
      updateClient()
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [name, email, isClientFound, isClientFoundBySearch, clientData, isSavingClient, isSearchingClient])

  // Função para salvar agendamento
  const handleSchedule = async () => {
    if (!clientData?.id || !selectedService || !selectedBarber || !date || !selectedTime) {
      return
    }

    setIsSavingSchedule(true)
    const client = createClient()

    try {
      const dateString = date.toISOString().split('T')[0] // Formato YYYY-MM-DD
      
      const { data, error } = await client
        .from("schedules")
        .insert([
          {
            client_id: clientData.id,
            service_id: selectedService,
            barber_id: selectedBarber,
            data_agendada: dateString,
            hora_agendada: selectedTime,
            status: "agendado",
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Erro ao criar agendamento:", error)
        alert("Erro ao criar agendamento. Por favor, tente novamente.")
        return
      }

      // Sucesso - limpar formulário e mostrar pop-up de confirmação
      setShowSuccessDialog(true)
      
      // Limpar seleções
      setSelectedService("")
      setSelectedBarber("")
      setDate(undefined)
      setSelectedTime("")
    } catch (error) {
      console.error("Erro ao criar agendamento:", error)
      alert("Erro ao criar agendamento. Por favor, tente novamente.")
    } finally {
      setIsSavingSchedule(false)
    }
  }

  // Determinar estados de habilitação
  const canEditNameEmail = !isClientFound && phone.replace(/\D/g, "").length >= 10
  const canSelectService = (isClientFound || (name.trim() !== "" && email.trim() !== "")) && !isSearchingClient
  const canSelectBarber = selectedService !== "" && canSelectService
  const canSelectDate = selectedBarber !== "" && canSelectBarber
  const canSelectTime = date !== undefined && canSelectDate
  const canSchedule = selectedTime !== "" && canSelectTime && selectedBarber !== ""

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-8 items-start">
              {/* Seção Esquerda - Formulário */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#D4AF37] mb-6">
                  Preencha os detalhes
                </h2>
                
                <div className="space-y-4">
                  {/* Campo Telefone - Sempre visível */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      className="w-full"
                      value={phone}
                      onChange={handlePhoneChange}
                      disabled={isSearchingClient}
                      maxLength={15}
                    />
                    {isSearchingClient && (
                      <p className="text-sm text-muted-foreground">Buscando cliente...</p>
                    )}
                    {isSavingClient && (
                      <p className="text-sm text-muted-foreground">Salvando cliente...</p>
                    )}
                  </div>

                  {/* Campo Nome - Oculto inicialmente */}
                  {(canEditNameEmail || isClientFound) && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Digite seu nome"
                        className="w-full"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        readOnly={isClientFoundBySearch}
                        disabled={isClientFoundBySearch}
                      />
                    </div>
                  )}

                  {/* Campo E-mail - Oculto inicialmente */}
                  {(canEditNameEmail || isClientFound) && (
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Digite seu e-mail"
                        className="w-full"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        readOnly={isClientFoundBySearch}
                        disabled={isClientFoundBySearch}
                      />
                    </div>
                  )}

                  {/* Campo Serviço - Oculto inicialmente */}
                  {canSelectService && (
                    <div className="space-y-2">
                      <Label htmlFor="service">Serviço</Label>
                      <Select 
                        value={selectedService} 
                        onValueChange={(value) => {
                          setSelectedService(value)
                          // Limpar seleções dependentes quando serviço mudar
                          setSelectedBarber("")
                          setDate(undefined)
                          setSelectedTime("")
                        }}
                        disabled={!canSelectService || isLoadingServices}
                      >
                        <SelectTrigger id="service" className="w-full">
                          <SelectValue placeholder="Selecione o serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Campo Barbeiro - Logo abaixo do Serviço */}
                  {canSelectBarber && (
                    <div className="space-y-2">
                      <Label htmlFor="barber">Barbeiro</Label>
                      <Select 
                        value={selectedBarber} 
                        onValueChange={(value) => {
                          setSelectedBarber(value)
                          // Limpar seleções dependentes quando barbeiro mudar
                          setDate(undefined)
                          setSelectedTime("")
                        }}
                        disabled={!canSelectBarber || isLoadingBarbers}
                      >
                        <SelectTrigger id="barber" className="w-full">
                          <SelectValue placeholder="Selecione o barbeiro" />
                        </SelectTrigger>
                        <SelectContent>
                          {barbers.map((barber) => (
                            <SelectItem key={barber.id} value={barber.id}>
                              {barber.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Linha Divisória */}
              <div className="hidden lg:block w-px bg-border self-stretch" />

              {/* Seção Direita - Calendário e Horário */}
              <div className="space-y-6 flex-1">
                {/* Calendário - Bloqueado até selecionar barbeiro */}
                <div className={!canSelectDate ? "opacity-50 pointer-events-none" : ""}>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={canSelectDate ? (selectedDate) => {
                      setDate(selectedDate)
                      // Limpar horário quando data mudar
                      setSelectedTime("")
                    } : undefined}
                    locale={ptBR}
                    disabled={canSelectDate ? disabledDates : () => true}
                    modifiers={canSelectDate ? modifiers : undefined}
                    defaultMonth={new Date()}
                    className="rounded-md border bg-card text-card-foreground shadow w-full [&_button[aria-selected='true']]:!bg-transparent [&_button[aria-selected='true']]:!text-[#D4AF37] [&_button[aria-selected='true']]:!font-bold [&_button:disabled]:!opacity-30 [&_button:disabled]:!cursor-not-allowed [&_button:disabled]:!text-muted-foreground/40 [&_button:disabled]:hover:!bg-transparent [&_button:disabled]:hover:!text-muted-foreground/40 [&_button:disabled]:pointer-events-none"
                    classNames={{
                      month_caption: "text-[#D4AF37] font-semibold text-lg",
                      day: "text-foreground hover:bg-accent rounded-full [&[aria-selected='true']]:!bg-transparent [&[aria-selected='true']]:!text-[#D4AF37] [&[aria-selected='true']]:!font-bold [&:disabled]:!opacity-30 [&:disabled]:!cursor-not-allowed [&:disabled]:!text-muted-foreground/40 [&:disabled]:hover:!bg-transparent [&:disabled]:hover:!text-muted-foreground/40 [&:disabled]:pointer-events-none",
                      day_selected: "!bg-transparent !text-[#D4AF37] hover:!bg-transparent hover:!text-[#D4AF37] focus:!bg-transparent focus:!text-[#D4AF37] !font-bold",
                      day_today: "bg-accent text-accent-foreground rounded-full",
                      day_disabled: "!opacity-30 !cursor-not-allowed !text-muted-foreground/40 hover:!bg-transparent hover:!text-muted-foreground/40 !pointer-events-none",
                    }}
                    modifiersClassNames={{
                      disabled_day: "!opacity-30 !cursor-not-allowed !text-muted-foreground/40 hover:!bg-transparent hover:!text-muted-foreground/40 !pointer-events-none",
                    }}
                  />
                </div>

                {/* Campo Horário - Bloqueado inicialmente */}
                <div className={`space-y-2 ${!canSelectTime ? "opacity-50 pointer-events-none" : ""}`}>
                  <Label htmlFor="time">Horário</Label>
                  <Select 
                    value={selectedTime} 
                    onValueChange={setSelectedTime}
                    disabled={!canSelectTime}
                  >
                    <SelectTrigger id="time" className="w-full">
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.length > 0 ? (
                        availableTimeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-slots" disabled>
                          Nenhum horário disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Botão Agendar - Bloqueado inicialmente */}
                <Button 
                  className="w-full bg-[#D4AF37] text-white hover:bg-[#D4AF37]/90 font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                  disabled={!canSchedule || isSavingSchedule}
                  onClick={handleSchedule}
                >
                  {isSavingSchedule ? "Agendando..." : "Agendar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação de Agendamento */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-[#D4AF37] whitespace-nowrap">
              Obrigado por agendar na Barbearia Gamboa!
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground mt-4">
              Seu agendamento foi criado com sucesso.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="bg-[#D4AF37] text-white hover:bg-[#D4AF37]/90 font-semibold"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

