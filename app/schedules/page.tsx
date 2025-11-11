import type { JSX } from "react";

export default function SchedulesPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto flex flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-widest text-primary">
            Agendamentos
          </p>
          <h1 className="text-4xl font-bold sm:text-5xl">
            Escolha o horário perfeito para você
          </h1>
          <p className="max-w-2xl text-base text-foreground/80 sm:text-lg">
            Consulte seus agendamentos, crie novos horários e acompanhe toda a
            experiência premium da barbearia em poucos cliques.
          </p>
        </header>
        <div className="rounded-2xl border border-primary/20 bg-secondary/60 p-10 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 text-center">
            <h2 className="text-2xl font-semibold text-primary">
              Em breve: calendário interativo
            </h2>
            <p className="text-sm text-foreground/70">
              Esta página exibirá seu histórico de agendamentos, permitirá
              confirmações rápidas e oferecerá recomendações personalizadas.
            </p>
            <p className="text-xs uppercase tracking-widest text-primary/80">
              Estamos preparando uma experiência impecável para você
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

