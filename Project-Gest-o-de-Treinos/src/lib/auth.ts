import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";

import { prisma } from "./db.js";

export const auth = betterAuth({
  trustedOrigins: ["http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  // ADICIONADO: Mapeamento de campos adicionais para o modelo B2B no Better-Auth
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER", // Aluno por padrão
      },
      gymId: {
        type: "string",
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