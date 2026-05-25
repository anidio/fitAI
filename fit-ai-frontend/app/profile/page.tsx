import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authClient } from "@/app/_lib/auth-client";
import { getUserTrainData } from "@/app/_lib/api/fetch-generated";
import { BottomNav } from "@/app/_components/bottom-nav";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Weight, Ruler, BicepsFlexed, User, Pencil } from "lucide-react";
import { LogoutButton } from "./_components/logout-button";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "./_components/profile-form";

export default async function ProfilePage() {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers() },
  });

  if (!session.data?.user) redirect("/auth");

  // Aluno sem academia cadastrada vai para a seleção mandatoriamente
  const userGymId = (session.data.user as any).gymId;
  if (!userGymId) redirect("/select-gym");

  const trainData = await getUserTrainData();

  const user = session.data.user;
  const data = trainData.status === 200 ? trainData.data : null;

  const weightInKg = data?.weightInGrams != null ? (data.weightInGrams / 1000).toFixed(1) : "-";
  const heightInCm = data?.heightInCentimeters ?? "-";
  const bodyFatPercentage = data?.bodyFatPercentage != null ? `${data.bodyFatPercentage}%` : "-";
  const age = data?.age ?? "-";

  return (
    <div className="flex min-h-svh flex-col bg-background pb-24">
      <div className="flex h-[56px] items-center px-5">
        <p
          className="text-[22px] uppercase leading-[1.15] text-foreground"
          style={{ fontFamily: "var(--font-anton)" }}
        >
          Fit.ai
        </p>
      </div>

      <div className="flex flex-col items-center gap-5 px-5 pt-5">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-[64px] border-2 border-primary/20">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                {user.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-xl font-bold leading-tight text-foreground">
                {user.name}
              </h1>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Plano Ativo
                </span>
                <span className="text-[12px] text-muted-foreground">
                  ID: {user.id.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>
          
          <ProfileForm 
            initialData={{
              weightInGrams: data?.weightInGrams ?? 0,
              heightInCentimeters: data?.heightInCentimeters ?? 0,
              age: data?.age ?? 0,
              bodyFatPercentage: data?.bodyFatPercentage ?? 0,
            }}
          />
        </div>

        <div className="grid w-full grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-5 rounded-xl bg-primary/8 p-5">
            <div className="flex items-center rounded-full bg-primary/8 p-[9px]">
              <Weight className="size-4 text-primary" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="font-heading text-2xl font-semibold leading-[1.15] text-foreground">
                {weightInKg}
              </span>
              <span className="font-heading text-xs uppercase leading-[1.4] text-muted-foreground">
                Kg
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5 rounded-xl bg-primary/8 p-5">
            <div className="flex items-center rounded-full bg-primary/8 p-[9px]">
              <Ruler className="size-4 text-primary" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="font-heading text-2xl font-semibold leading-[1.15] text-foreground">
                {heightInCm}
              </span>
              <span className="font-heading text-xs uppercase leading-[1.4] text-muted-foreground">
                Cm
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5 rounded-xl bg-primary/8 p-5">
            <div className="flex items-center rounded-full bg-primary/8 p-[9px]">
              <BicepsFlexed className="size-4 text-primary" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="font-heading text-2xl font-semibold leading-[1.15] text-foreground">
                {bodyFatPercentage}
              </span>
              <span className="font-heading text-xs uppercase leading-[1.4] text-muted-foreground">
                Gc
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5 rounded-xl bg-primary/8 p-5">
            <div className="flex items-center rounded-full bg-primary/8 p-[9px]">
              <User className="size-4 text-primary" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="font-heading text-2xl font-semibold leading-[1.15] text-foreground">
                {age}
              </span>
              <span className="font-heading text-xs uppercase leading-[1.4] text-muted-foreground">
                Anos
              </span>
            </div>
          </div>
        </div>

        <LogoutButton />
      </div>

      <BottomNav activePage="profile" />
    </div>
  );
}