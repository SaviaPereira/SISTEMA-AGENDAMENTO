export default function ConfigPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto flex flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-widest text-primary">
            Configurações
          </p>
          <h1 className="text-4xl font-bold sm:text-5xl">
            Configurações do Sistema
          </h1>
          <p className="max-w-2xl text-base text-foreground/80 sm:text-lg">
            Gerencie os horários de funcionamento da barbearia, feriados e
            outras configurações do sistema.
          </p>
        </header>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-xl border border-primary/20 bg-secondary/60 p-8 shadow-lg backdrop-blur">
            <h2 className="text-2xl font-semibold text-primary">Horários Regulares</h2>
            <ul className="mt-4 space-y-3 text-sm text-foreground/70">
              <li>
                <span className="font-medium text-foreground">Segunda a Sexta:</span>{" "}
                9h às 20h
              </li>
              <li>
                <span className="font-medium text-foreground">Sábados:</span> 9h às 18h
              </li>
              <li>
                <span className="font-medium text-foreground">Domingos:</span>{" "}
                Atendimentos exclusivos sob consulta
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-primary/20 bg-secondary/60 p-8 shadow-lg backdrop-blur">
            <h2 className="text-2xl font-semibold text-primary">
              Horários Especiais
            </h2>
            <p className="mt-3 text-sm text-foreground/70">
              Durante feriados prolongados e eventos especiais, abrimos espaços
              exclusivos para clientes VIP. Entre em contato com nossa equipe
              para confirmar disponibilidade e garantir seu horário.
            </p>
            <p className="mt-4 text-xs uppercase tracking-widest text-primary/80">
              Atendimento personalizado mediante agendamento antecipado
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

