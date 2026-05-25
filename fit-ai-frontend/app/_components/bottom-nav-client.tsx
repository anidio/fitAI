"use client";

import { House, Calendar, ChartNoAxesColumn, UserRound } from "lucide-react";
import Link from "next/link";
import { ChatOpenButton } from "@/app/_components/chat-open-button";
import { cn } from "@/lib/utils";

type BottomNavClientProps = Readonly<{
  activePage?: "home" | "calendar" | "stats" | "profile";
  calendarHref: string;
}>;

export function BottomNavClient({ activePage = "home", calendarHref }: BottomNavClientProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-6 rounded-t-4xl border border-border bg-background px-6 py-4">
      
      {/* Ícone 1: HOME */}
      <Link 
        href="/"
        className="p-3 focus:outline-none" 
        aria-label="Tela inicial"
      >
        <House className={cn("size-6 transition-colors duration-200", activePage === "home" ? "text-foreground" : "text-muted-foreground")} />
      </Link>

      {/* Ícone 2: TREINO DO DIA */}
      <Link 
        href={calendarHref}
        className="p-3 focus:outline-none" 
        aria-label="Treino do dia"
      >
        <Calendar className={cn("size-6 transition-colors duration-200", activePage === "calendar" ? "text-foreground" : "text-muted-foreground")} />
      </Link>

      {/* Ícone 3: CONVERSA COM A IA */}
      <ChatOpenButton />

      {/* Ícone 4: ESTATÍSTICAS */}
      <Link 
        href="/stats"
        className="p-3 focus:outline-none" 
        aria-label="Frequência e consistência"
      >
        <ChartNoAxesColumn className={cn("size-6 transition-colors duration-200", activePage === "stats" ? "text-foreground" : "text-muted-foreground")} />
      </Link>

      {/* Ícone 5: PERFIL DO USUÁRIO */}
      <Link 
        href="/profile"
        className="p-3 focus:outline-none" 
        aria-label="Perfil"
      >
        <UserRound className={cn("size-6 transition-colors duration-200", activePage === "profile" ? "text-foreground" : "text-muted-foreground")} />
      </Link>
      
    </nav>
  );
}