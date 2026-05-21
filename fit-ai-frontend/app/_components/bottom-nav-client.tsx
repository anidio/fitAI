"use client";

import Link from "next/link";
import { House, Calendar, ChartNoAxesColumn, UserRound } from "lucide-react";
import { useQueryStates, parseAsBoolean, parseAsString } from "nuqs";
import { ChatOpenButton } from "@/app/_components/chat-open-button";
import { cn } from "@/lib/utils";

type BottomNavClientProps = Readonly<{
  activePage?: "home" | "calendar" | "stats" | "profile";
  calendarHref: string;
}>;

export function BottomNavClient({ activePage = "home", calendarHref }: BottomNavClientProps) {
  const [, setChatParams] = useQueryStates({
    chat_open: parseAsBoolean.withDefault(false),
    chat_initial_message: parseAsString,
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-6 rounded-t-4xl border border-border bg-background px-6 py-4">
      <Link 
        href="/" 
        onClick={() => setChatParams({ chat_open: false, chat_initial_message: null })}
        className="p-3" 
        aria-label="Tela inicial"
      >
        <House
          className={cn(
            "size-6",
            activePage === "home" ? "text-foreground" : "text-muted-foreground",
          )}
        />
      </Link>

      <Link 
        href={calendarHref || "/"} 
        onClick={() => setChatParams({ chat_open: false, chat_initial_message: null })}
        className="p-3" 
        aria-label="Treino do dia"
      >
        <Calendar
          className={cn(
            "size-6",
            activePage === "calendar" ? "text-foreground" : "text-muted-foreground",
          )}
        />
      </Link>

      <ChatOpenButton />

      <Link 
        href="/stats" 
        onClick={() => setChatParams({ chat_open: false, chat_initial_message: null })}
        className="p-3" 
        aria-label="Frequência e consistência"
      >
        <ChartNoAxesColumn
          className={cn(
            "size-6",
            activePage === "stats" ? "text-foreground" : "text-muted-foreground",
          )}
        />
      </Link>

      <Link 
        href="/profile" 
        onClick={() => setChatParams({ chat_open: false, chat_initial_message: null })}
        className="p-3" 
        aria-label="Perfil"
      >
        <UserRound
          className={cn(
            "size-6",
            activePage === "profile" ? "text-foreground" : "text-muted-foreground",
          )}
        />
      </Link>
    </nav>
  );
}
