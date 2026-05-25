import { redirect } from "next/navigation";
import { authClient } from "@/app/_lib/auth-client";
import { headers } from "next/headers";
import {
  getStats,
  getHomeData,
} from "@/app/_lib/api/fetch-generated";
import dayjs from "dayjs";
import { CircleCheck, CirclePercent, Hourglass } from "lucide-react";
import { BottomNav } from "@/app/_components/bottom-nav";
import { LogoutButton } from "@/app/profile/_components/logout-button";
import { StreakBanner } from "./_components/streak-banner";
import { StatsHeatmap } from "./_components/stats-heatmap";
import { StatCard } from "./_components/stat-card";
import Image from "next/image";

function formatTotalTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h${minutes.toString().padStart(2, "0")}m`;
}

export default async function StatsPage() {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });

  if (!session.data?.user) redirect("/auth");

  // Trava de segurança mandatória (Regra 5): Se o aluno não confirmou a academia, manda pra seleção sempre
  const userGymId = (session.data.user as any).gymId;
  if (!userGymId) redirect("/select-gym");

  const today = dayjs();
  const from = today.subtract(2, "month").startOf("month").format("YYYY-MM-DD");
  const to = today.endOf("month").format("YYYY-MM-DD");

  const [statsResponse, homeData] = await Promise.all([
    getStats({ from, to }),
    getHomeData(today.format("YYYY-MM-DD")),
  ]);

  // Se o personal ainda não atribuiu treino, renderizamos a tela com dados zerados de forma amigável
  const hasNoStats = statsResponse.status !== 200;

  const workoutStreak = hasNoStats ? 0 : statsResponse.data.workoutStreak;
  const consistencyByDay = hasNoStats ? {} : statsResponse.data.consistencyByDay;
  const completedWorkoutsCount = hasNoStats ? 0 : statsResponse.data.completedWorkoutsCount;
  const conclusionRate = hasNoStats ? 0 : statsResponse.data.conclusionRate;
  const totalTimeInSeconds = hasNoStats ? 0 : statsResponse.data.totalTimeInSeconds;

  return (
    <div className="flex min-h-svh flex-col bg-background pb-24">
      <div className="flex h-14 items-center justify-between px-5">
        <p
          className="text-[22px] uppercase leading-[1.15] text-foreground"
          style={{ fontFamily: "var(--font-anton)" }}
        >
          Fit.ai
        </p>
        <div>
          <LogoutButton />
        </div>
      </div>

      <div className="px-5">
        <StreakBanner workoutStreak={workoutStreak} />
      </div>

      <div className="flex flex-col gap-3 p-5">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Consistência Geral
        </h2>

        <StatsHeatmap consistencyByDay={consistencyByDay} today={today} />

        <div className="relative mt-2 h-[120px] w-full overflow-hidden rounded-xl border border-border p-5">
          <Image
            src="/stats-banner.png"
            alt=""
            fill
            className="pointer-events-none object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="relative flex h-full flex-col justify-center">
            <p className="font-heading text-xs font-semibold uppercase text-primary">Tempo Total</p>
            <p className="font-heading text-3xl font-bold text-foreground">{formatTotalTime(totalTimeInSeconds)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={CircleCheck}
            value={String(completedWorkoutsCount)}
            label="Treinos Feitos"
          />
          <StatCard
            icon={CirclePercent}
            value={`${Math.round(conclusionRate * 100)}%`}
            label="Taxa de conclusão"
          />
        </div>
      </div>

      <BottomNav activePage="stats" />
    </div>
  );
}