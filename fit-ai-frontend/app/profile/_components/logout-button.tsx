"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/app/_lib/auth-client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type LogoutButtonProps = {
  compact?: boolean;
  label?: string;
};

export function LogoutButton({ compact = false, label = "Sair da conta" }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await authClient.signOut();
    setLoading(false);

    if (error) {
      console.error(error.message);
      return;
    }

    router.push("/auth");
  };

  const baseClass = compact ? "inline-flex items-center gap-2 text-sm text-white/70" : "gap-2 text-destructive hover:text-destructive";

  return (
    <Button variant={compact ? undefined : "ghost"} onClick={handleLogout} className={baseClass} type="button" disabled={loading}>
      <span className={compact ? "font-heading text-sm" : "font-heading text-base font-semibold"}>{loading ? "Saindo..." : label}</span>
      <LogOut className="size-4" />
    </Button>
  );
}
