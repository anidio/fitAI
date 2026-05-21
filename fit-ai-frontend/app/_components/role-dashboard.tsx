"use client";

import { PersonalDashboard } from "./personal-dashboard";
import { GestorDashboard } from "./gestor-dashboard";

type RoleDashboardProps = {
  userRole: string;
  userGymId?: string | null;
};

export function RoleDashboard({ userRole, userGymId }: RoleDashboardProps) {
  if (userRole === "PERSONAL") {
    return <PersonalDashboard />;
  }

  if (userRole === "GYM_OWNER") {
    return <GestorDashboard />;
  }

  return null;
}
