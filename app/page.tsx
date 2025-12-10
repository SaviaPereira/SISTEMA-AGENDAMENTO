"use client";

import { Button } from "@/components/ui/button";
import { Facebook, Instagram } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 p-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <Image
                src="/images/logo/barbearia_logo.png"
                alt="Logo Barbearia Gamboa"
                width={640}
                height={214}
                priority
                className="h-16 w-auto object-contain sm:h-20 lg:h-24 saturate-150 brightness-110"
              />
            </div>
            <span className="sr-only">Barbearia Gamboa</span>
          </div>

          {/* Redes Sociais - Posicionadas no painel direito */}
          <div className="lg:absolute lg:top-6 lg:right-6 flex items-center space-x-4">
            <a 
              href="https://www.facebook.com/Gamboaforhall" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-accent transition-colors"
            >
              <Facebook className="w-8 h-8" />
            </a>
            <a 
              href="https://www.instagram.com/gamboabarbearia?igsh=MTc3aDNvNmtmOTRwOA==" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-accent transition-colors"
            >
              <Instagram className="w-8 h-8" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="grid grid-cols-1 lg:grid-cols-5 min-h-screen mt-0">
        {/* Left Panel - Conteúdo */}
        <div className="lg:col-span-2 bg-background flex flex-col justify-center items-center lg:items-start p-8 lg:p-12 relative pt-24">
          <div className="max-w-lg w-full mx-auto text-center lg:text-left">
            {/* Headline */}
            <h1 className="text-4xl lg:text-6xl font-black leading-[0.9] mb-8 tracking-tight">
              <span className="block text-foreground uppercase">Aqui, o foco é</span>
              <span className="block text-primary uppercase">deixar você</span>
              <span className="block text-foreground uppercase">
                no <span className="text-[#D4AF37]">estilo</span>!
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Conforto e atendimento de primeira
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/agendamento">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg font-medium">
                  Agendar Horário
                </Button>
              </Link>
              <a 
                href="https://share.google/cPlEIE076xE0TmEp1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button size="lg" className="bg-background border border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-6 text-lg font-medium">
                  Nossa Localização
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Right Panel - Imagem de Fundo */}
        <div className="lg:col-span-3 relative bg-slate-800">
          {/* Imagem do barbeiro de fundo */}
          <div className="absolute inset-0">
            <Image
              src="/images/barber/professional-barber.jpg"
              alt="Barbeiro profissional cortando cabelo"
              fill
              className="object-cover"
              priority
            />
            {/* Overlay escuro para melhor contraste */}
            <div className="absolute inset-0 bg-black/20"></div>
          </div>


          {/* Card de Avaliação - Bottom Right (oculto em telas menores) */}
          <div className="hidden lg:block absolute bottom-20 right-8 max-w-sm z-10">
            <div className="bg-primary text-primary-foreground p-6 rounded-lg shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">DG</span>
                </div>
                <div>
                  <div className="font-semibold text-primary-foreground">Diretoria Gamboa</div>
                </div>
              </div>


              <p className="text-sm leading-relaxed text-primary-foreground">
                Aqui, seu visual ganha identidade...
                <br />
                  Do degradê ao navalhado, o corte é feito na régua!
              </p>
            </div>
          </div>

        </div>
      </main>   
    </div>
  );
}
