import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";

import { prisma } from "./db.js";

export const auth = betterAuth({
  trustedOrigins: [
    "http://localhost:3000",
    "https://fit-ai-bhv2.vercel.app",
    process.env.NEXT_PUBLIC_APP_URL || "",
    process.env.BETTER_AUTH_URL || ""
  ].filter(Boolean),

  // 🌟 COOKIES ESTRUTURADOS PARA CROSS-ORIGIN (VERCEL -> RENDER)
  cookie: {
    secure: true,
    sameSite: "none",
  },

  emailAndPassword: {
    enabled: true,
  },

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // [CORRIGIDO] DatabaseHooks limpos e seguros para não interceptar tipagem de forma malformada
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Vincula planos de treinos pendentes associados ao e-mail do aluno cadastrado
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
        type: "string", // Mantém o tipo primitivo para o Better-Auth compreender o payload
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
});