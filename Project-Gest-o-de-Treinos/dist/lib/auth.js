import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";
import { prisma } from "./db.js";
export const auth = betterAuth({
    // Configura as origens confiáveis dinamicamente para não quebrar no Render/Vercel
    trustedOrigins: [
        "http://localhost:3000",
        process.env.NEXT_PUBLIC_APP_URL || "",
        process.env.BETTER_AUTH_URL || ""
    ].filter(Boolean),
    emailAndPassword: {
        enabled: true,
    },
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // Quando um usuário é criado, verificamos se existem planos de treino vinculados ao e-mail dele
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
    // Mapeamento completo de campos adicionais para o modelo B2B e IA no Better-Auth
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: "USER", // Aluno por padrão caso não seja enviado no cadastro
            },
            gymId: {
                type: "string",
                required: false,
            },
            // Dados Físicos adicionados para sincronia com o schema.prisma e leitura da IA
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
    // O plugin openAPI expõe os endpoints do Better-Auth de forma limpa no seu Swagger
    plugins: [openAPI()],
});
