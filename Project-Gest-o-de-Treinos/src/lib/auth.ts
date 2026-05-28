import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";

import { prisma } from "./db.js";

export const auth = betterAuth({
  trustedOrigins: [
    "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL || "",
    process.env.BETTER_AUTH_URL || ""
  ].filter(Boolean),

  emailAndPassword: {
    enabled: true,
    // ALINHAMENTO: Captura explicitamente os metadados do formulário para salvar no banco
    async signUp(data: any) {
      return {
        ...data,
        role: (data as any).role || "USER",
        gymId: (data as any).gymId || null,
      };
    },
  },

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await prisma.workoutPlan.updateMany({
            where: {
              pendingEmail: user.email,
              userId: null,
            },
            data: {
              userId: user.id,
              pendingEmail: null,
            },
          });
        },
      },
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "USER",
      },
      gymId: {
        type: "string",
        required: false,
      },
      weightInGrams: {
        type: "number",
        required: false,
      },
      heightInCentimeters: {
        type: "number",
        required: false,
      },
      age: {
        type: "number",
        required: false,
      },
      bodyFatPercentage: {
        type: "number",
        required: false,
      },
      injuryNotes: {
        type: "string",
        required: false,
      }
    }
  },

  plugins: [openAPI()],

  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true
    }
  }
});