"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInWithGoogle } from "./sign-in-with-google";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Dumbbell } from "lucide-react";
import { authClient } from "@/app/_lib/auth-client";

export function AuthFlow() {
  const [step, setStep] = useState<"landing" | "profiles">("landing");
  const router = useRouter();

  const handleMockLogin = async (role: "ADMIN" | "PERSONAL") => {
    // Simulação de login para testes
    document.cookie = `demo-user=true; path=/`;
    document.cookie = `demo-role=${role}; path=/`;
    window.location.href = "/";
  };

  if (step === "landing") {
    return (
      <div className="relative z-10 flex flex-col items-center gap-15 rounded-t-4xl bg-primary px-5 pb-10 pt-12">
        <div className="flex w-full flex-col items-center gap-6">
          <h1 className="w-full text-center font-heading text-[32px] font-semibold leading-[1.05] text-primary-foreground">
            O app que vai transformar a forma como você treina.
          </h1>

          <Button
            onClick={() => setStep("profiles")}
            className="h-12 w-full max-w-[280px] rounded-full bg-white text-base font-medium text-primary hover:bg-white/90"
          >
            Clique aqui para fazer login
          </Button>
        </div>

        <p className="font-heading text-xs leading-[1.4] text-primary-foreground/70">
          ©2026 Copyright FIT.AI. Todos os direitos reservados
        </p>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-col items-center gap-15 rounded-t-4xl bg-primary px-5 pb-10 pt-12">
      <div className="flex w-full flex-col items-center gap-6">
        <h1 className="w-full text-center font-heading text-[32px] font-semibold leading-[1.05] text-primary-foreground">
          O app que vai transformar a forma como você treina.
        </h1>

        <div className="flex w-full flex-col gap-3">
          <SignInWithGoogle />

          <Button
            variant="outline"
            onClick={() => handleMockLogin("ADMIN")}
            className="h-12 w-full rounded-full bg-white text-primary hover:bg-white/90 border-none"
          >
            <ShieldCheck className="mr-2 h-5 w-5" />
            Login como administrador
          </Button>

          <Button
            variant="outline"
            onClick={() => handleMockLogin("PERSONAL")}
            className="h-12 w-full rounded-full bg-white text-primary hover:bg-white/90 border-none"
          >
            <Dumbbell className="mr-2 h-5 w-5" />
            Login como personal Trainer
          </Button>
        </div>
      </div>

      <p className="font-heading text-xs leading-[1.4] text-primary-foreground/70">
        ©2026 Copyright FIT.AI. Todos os direitos reservados
      </p>
    </div>
  );
}
