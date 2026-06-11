import { redirect } from "next/navigation";
import { authClient } from "@/app/_lib/auth-client";
import { headers } from "next/headers";
import { getHomeData } from "./_lib/api/fetch-generated";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import { Flame } from "lucide-react";
import { BottomNav } from "./_components/bottom-nav";
import { ConsistencyTracker } from "./_components/consistency-tracker";
import { WorkoutDayCard } from "./_components/workout-day-card";
import { RoleDashboard } from "./_components/role-dashboard";
import { LogoutButton } from "./profile/_components/logout-button";

export default async function Home() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  // 1. Bloqueio de segurança padrão: se não tiver logado, vai para a tela de login
  if (!session.data?.user) redirect("/auth");

  // Captura os dados estendidos do usuário logado (como a role e o vínculo da academia)
  const userRole = (session.data.user as any).role || "USER";
  const userGymId = (session.data.user as any).gymId;

  // 2. REDIRECIONAMENTO POR PERFIL (B2B):
  // Se for PERSONAL ou USER e não tiver academia vinculada, redireciona para a seleção
  if ((userRole === "USER" || userRole === "PERSONAL") && !userGymId) {
    redirect("/select-gym");
  }

  // Se for Personal Trainer ou Gestor, renderiza o painel client-only apropriado
  if (userRole === "PERSONAL" || userRole === "GYM_OWNER") {
    return <RoleDashboard userRole={userRole} userGymId={userGymId} />;
  }

  const today = dayjs();
  const homeData = await getHomeData(today.format("YYYY-MM-DD"));

  // REGRA AJUSTADA (Ajuste 2): Se a academia foi selecionada mas o personal ainda não vinculou o treino
  if (homeData.status !== 200) {
    return (
      <div className="flex min-h-svh flex-col bg-background pb-24">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p
            className="text-[22px] uppercase leading-[1.15] text-foreground"
            style={{ fontFamily: "var(--font-anton)" }}
          >
            Fit.ai
          </p>
          <LogoutButton />
        </div>
        
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <h1 className="text-xl font-bold text-white">Nenhum treino cadastrado</h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-xs">
            Sua conta está vinculada à academia com sucesso! Aguarde o seu Personal Trainer cadastrar o seu plano de treinos para começar.
          </p>
        </div>

        {/* Mantém a barra inferior acessível para navegar pelo perfil/IA mesmo sem treino */}
        <BottomNav activePage="home" />
      </div>
    );
  }

  const { todayWorkoutDay, workoutStreak, consistencyByDay } = homeData.data;
  const userName = session.data.user.name?.split(" ")[0] ?? "";

  return (
    <div className="flex min-h-svh flex-col bg-background pb-24">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <p
          className="text-[22px] uppercase leading-[1.15] text-foreground"
          style={{ fontFamily: "var(--font-anton)" }}
        >
          Fit.ai
        </p>
        <LogoutButton />
      </div>
      
      {/* Banner Principal */}
      <div className="relative flex h-[296px] shrink-0 flex-col items-start justify-between overflow-hidden rounded-b-[20px] px-5 pb-10 pt-5">
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src="/home-banner.jpg"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(243deg, rgba(0,0,0,0) 34%, rgb(0,0,0) 100%)",
            }}
          />
        </div>

        <p className="relative text-[22px] uppercase leading-[1.15] text-background font-black italic">
          Fit.ai
        </p>

        <div className="relative flex w-full items-end justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-semibold leading-[1.05] text-background">
              Olá, {userName}
            </h1>
            <p className="font-heading text-sm leading-[1.15] text-background/70">
              Bora treinar hoje?
            </p>
          </div>
          <div className="rounded-full bg-primary px-4 py-2">
            <span className="font-heading text-sm font-semibold text-primary-foreground">
              Bora!
            </span>
          </div>
        </div>
      </div>

      {/* Rastreamento de Frequência e Consistência (Tela de Consistência do Dia) */}
      <div className="flex flex-col gap-3 px-5 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Consistência
          </h2>
          <button className="font-heading text-xs text-primary">
            Ver histórico
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl border border-border p-5">
            <ConsistencyTracker
              consistencyByDay={consistencyByDay}
              today={today}
            />
          </div>
          <div className="flex items-center gap-2 self-stretch rounded-xl bg-streak px-5 py-2">
            <Flame className="size-5 text-streak-foreground" />
            <span className="font-heading text-base font-semibold text-foreground">
              {workoutStreak}
            </span>
          </div>
        </div>
      </div>

      {/* Exibição do Treino do Dia Atual */}
      {todayWorkoutDay && (
        <div className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Treino de Hoje
            </h2>
            <Link href={`/workout-plans/${todayWorkoutDay.workoutPlanId}`}>
              <button className="font-heading text-xs text-primary">
                Ver planos
              </button>
            </Link>
          </div>

          <Link
            href={`/workout-plans/${todayWorkoutDay.workoutPlanId}/days/${todayWorkoutDay.id}`}
            className="group"
          >
            <WorkoutDayCard
              name={todayWorkoutDay.name}
              weekDay={todayWorkoutDay.weekDay}
              estimatedDurationInSeconds={
                todayWorkoutDay.estimatedDurationInSeconds
              }
              exercisesCount={todayWorkoutDay.exercisesCount}
              coverImageUrl={todayWorkoutDay.coverImageUrl}
            />
          </Link>
        </div>
      )}

      {/* Menu de Navegação Inferior de 5 Ícones */}
      <BottomNav activePage="home" />
    </div>
  );
}