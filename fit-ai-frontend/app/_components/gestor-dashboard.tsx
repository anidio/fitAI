"use client";

import { ChevronLeft, Users, Activity, MessageSquare, Star, ArrowUpRight, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

const STAT_CARDS = [
  { label: "Total de Usuários", value: "1,245", change: "+12.5% vs mês anterior", icon: Users, color: "bg-blue-50 text-blue-600", trend: "text-green-600" },
  { label: "Taxa de Frequência", value: "78.5%", change: "+3.2% vs mês anterior", icon: Activity, color: "bg-green-50 text-green-600", trend: "text-green-600" },
  { label: "Uso do Chatbot", value: "892", change: "+18.2% vs mês anterior", icon: MessageSquare, color: "bg-orange-50 text-orange-600", trend: "text-green-600" },
  { label: "Planos Premium", value: "456", change: "+23.1% vs mês anterior", icon: Star, color: "bg-indigo-50 text-indigo-600", trend: "text-green-600" },
];

const RECENT_ACTIVITIES = [
  { id: 1, user: "João Silva", action: "Completou treino de perna", time: "há 5 min", initial: "J", color: "bg-blue-600" },
  { id: 2, user: "Maria Santos", action: "Atingiu 30 dias de sequência", time: "há 12 min", initial: "M", color: "bg-indigo-600" },
  { id: 3, user: "Carlos Oliveira", action: "Assinou plano premium", time: "há 25 min", initial: "C", color: "bg-blue-500" },
  { id: 4, user: "Ana Costa", action: "Usou chatbot para dúvidas", time: "há 54 min", initial: "A", color: "bg-blue-700" },
];

export function GestorDashboard() {
  return (
    <div className="flex min-h-svh flex-col bg-background pb-10">
      {/* Header */}
      <div className="relative h-[180px] w-full overflow-hidden rounded-b-[32px] bg-black p-6">
        <div className="absolute inset-0 opacity-40">
           <div className="h-full w-full bg-gradient-to-b from-transparent to-black" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-4 pt-2">
          <Link href="/auth" className="flex items-center gap-1 text-sm text-white/70">
            <ChevronLeft className="size-4" /> Sair
          </Link>
          <div>
            <p className="font-heading text-xs uppercase tracking-widest text-blue-500">FIT.AI</p>
            <h1 className="font-heading text-2xl font-bold text-white">Dashboard do Gestor</h1>
            <p className="text-sm text-white/60">Visão geral do sistema</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-5 -mt-6 relative z-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {STAT_CARDS.map((stat, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-3xl bg-card p-4 shadow-sm border border-border/50">
              <div className={`flex size-10 items-center justify-center rounded-2xl ${stat.color}`}>
                <stat.icon className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-medium">{stat.label}</span>
                <span className="text-xl font-bold text-foreground">{stat.value}</span>
                <span className={`text-[8px] font-medium ${stat.trend}`}>{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Activity Chart Placeholder */}
        <div className="flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm border border-border/50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Atividade Semanal</h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-1.5">
                 <div className="size-2 rounded-full bg-blue-600" />
                 <span className="text-[10px] text-muted-foreground">Treinos</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <div className="size-2 rounded-full bg-orange-500" />
                 <span className="text-[10px] text-muted-foreground">Chatbot</span>
               </div>
            </div>
          </div>
          
          <div className="flex h-[140px] items-end justify-between gap-1 pt-4">
             {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
               <div key={i} className="flex flex-1 flex-col items-center gap-1">
                 <div className="relative flex w-full flex-col items-center justify-end gap-0.5 h-full">
                    <div className="w-full rounded-t-sm bg-orange-500" style={{ height: `${h * 0.6}%` }} />
                    <div className="w-full rounded-t-sm bg-blue-600" style={{ height: `${h}%` }} />
                 </div>
                 <span className="text-[8px] text-muted-foreground uppercase">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i]}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-foreground px-1">Atividades Recentes</h3>
          <div className="flex flex-col gap-2">
            {RECENT_ACTIVITIES.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between rounded-2xl bg-card p-3 shadow-sm border border-border/50">
                <div className="flex items-center gap-3">
                  <Avatar className={`size-10 ${activity.color}`}>
                    <AvatarFallback className={`${activity.color} text-white text-xs font-bold`}>
                      {activity.initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{activity.user}</span>
                    <span className="text-[10px] text-muted-foreground">{activity.action}</span>
                  </div>
                </div>
                <span className="text-[9px] text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-blue-50 p-3">
            <span className="text-sm font-bold text-blue-900">94%</span>
            <span className="text-[8px] text-center text-blue-800/70 uppercase font-medium leading-tight">Taxa de Satisfação</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-green-50 p-3">
            <span className="text-sm font-bold text-green-900">328</span>
            <span className="text-[8px] text-center text-green-800/70 uppercase font-medium leading-tight">Treinos hoje</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-orange-50 p-3">
            <span className="text-sm font-bold text-orange-900">15.2h</span>
            <span className="text-[8px] text-center text-orange-800/70 uppercase font-medium leading-tight">Tempo Médio</span>
          </div>
        </div>
      </div>
    </div>
  );
}
