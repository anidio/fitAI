import { fromNodeHeaders } from "better-auth/node";
import z from "zod";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/db.js"; // Importa a conexão com o banco
import { ErrorSchema, UpsertUserTrainDataBodySchema, UpsertUserTrainDataSchema, UserTrainDataSchema, } from "../schemas/index.js";
import { GetUserTrainData } from "../usecases/GetUserTrainData.js";
import { UpsertUserTrainData } from "../usecases/UpsertUserTrainData.js";
export const meRoutes = async (app) => {
    // 1. Endpoint Existente: Buscar dados do usuário
    app.withTypeProvider().route({
        method: "GET",
        url: "/",
        schema: {
            tags: ["Me"],
            summary: "Buscar dados do usuário",
            description: "Retorna informações de treino do usuário autenticado.",
            response: {
                200: UserTrainDataSchema.nullable(),
                401: ErrorSchema,
                500: ErrorSchema,
            },
        },
        handler: async (request, reply) => {
            try {
                const session = await auth.api.getSession({
                    headers: fromNodeHeaders(request.headers),
                });
                if (!session) {
                    return reply.status(401).send({
                        error: "Unauthorized",
                        code: "UNAUTHORIZED",
                    });
                }
                const getUserTrainData = new GetUserTrainData();
                const result = await getUserTrainData.execute({
                    userId: session.user.id,
                });
                return reply.status(200).send(result);
            }
            catch (error) {
                app.log.error(error);
                return reply.status(500).send({
                    error: "Internal server error",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        },
    });
    // 2. Endpoint Existente: Atualizar peso/altura
    app.withTypeProvider().route({
        method: "PUT",
        url: "/",
        schema: {
            tags: ["Me"],
            summary: "Atualizar dados de treino",
            description: "Atualiza peso, altura, idade e percentual de gordura do usuário autenticado.",
            body: UpsertUserTrainDataBodySchema,
            response: {
                200: UpsertUserTrainDataSchema,
                401: ErrorSchema,
                500: ErrorSchema,
            },
        },
        handler: async (request, reply) => {
            try {
                const session = await auth.api.getSession({
                    headers: fromNodeHeaders(request.headers),
                });
                if (!session) {
                    return reply.status(401).send({
                        error: "Unauthorized",
                        code: "UNAUTHORIZED",
                    });
                }
                const upsertUserTrainData = new UpsertUserTrainData();
                const result = await upsertUserTrainData.execute({
                    userId: session.user.id,
                    weightInGrams: request.body.weightInGrams,
                    heightInCentimeters: request.body.heightInCentimeters,
                    age: request.body.age,
                    bodyFatPercentage: request.body.bodyFatPercentage,
                });
                return reply.status(200).send(result);
            }
            catch (error) {
                app.log.error(error);
                return reply.status(500).send({
                    error: "Internal server error",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        },
    });
    // 3. NOVO ENDPOINT B2B: Vincular a academia selecionada ao Aluno
    app.withTypeProvider().route({
        method: "PATCH",
        url: "/gym",
        schema: {
            tags: ["Me B2B"],
            summary: "Vincular academia ao usuário",
            description: "Vincula a academia selecionada ao usuário autenticado para liberar o acesso ao treino.",
            body: z.object({
                gymId: z.string(),
            }),
            response: {
                200: z.object({ success: z.boolean(), gymId: z.string() }),
                401: ErrorSchema,
                500: ErrorSchema,
            },
        },
        handler: async (request, reply) => {
            try {
                const session = await auth.api.getSession({
                    headers: fromNodeHeaders(request.headers),
                });
                if (!session) {
                    return reply.status(401).send({
                        error: "Unauthorized",
                        code: "UNAUTHORIZED",
                    });
                }
                const { gymId } = request.body;
                // Atualiza a tabela User no banco vinculando o ID corporativo da academia
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { gymId },
                });
                return reply.status(200).send({ success: true, gymId });
            }
            catch (error) {
                app.log.error(error);
                return reply.status(500).send({
                    error: "Internal server error",
                    code: "INTERNAL_SERVER_ERROR",
                });
            }
        },
    });
    // 4. NOVO ENDPOINT: Aplicar planos pendentes atrelados ao e-mail do usuário
    app.withTypeProvider().route({
        method: "POST",
        url: "/pending-assignments/apply",
        schema: {
            tags: ["Me B2B"],
            summary: "Aplicar planos pendentes",
            description: "Aplica ao usuário todos os planos atribuídos por e-mail antes de seu cadastro.",
            response: {
                200: z.object({ applied: z.number() }),
                401: ErrorSchema,
                500: ErrorSchema,
            },
        },
        handler: async (request, reply) => {
            try {
                const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
                if (!session) {
                    return reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED" });
                }
                // Find workout plans with pendingEmail equal to user's email and not yet linked
                const pending = await prisma.workoutPlan.findMany({ where: { pendingEmail: session.user.email } });
                let applied = 0;
                for (const plan of pending) {
                    await prisma.workoutPlan.update({ where: { id: plan.id }, data: { userId: session.user.id, pendingEmail: null } });
                    applied++;
                }
                return reply.status(200).send({ applied });
            }
            catch (error) {
                app.log.error(error);
                return reply.status(500).send({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
            }
        },
    });
};
