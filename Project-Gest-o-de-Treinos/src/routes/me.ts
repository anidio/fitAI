import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import { auth } from "../lib/auth.js";
import { prisma } from "../lib/db.js"; // Importa a conexão com o banco
import {
  ErrorSchema,
  UpsertUserTrainDataBodySchema,
  UpsertUserTrainDataSchema,
  UserTrainDataSchema,
} from "../schemas/index.js";
import { GetUserTrainData } from "../usecases/get-user-train-data.js";
import { UpsertUserTrainData } from "../usecases/upsert-user-train-data.js";

export const meRoutes = async (app: FastifyInstance) => {
  
  // 1. Endpoint Existente: Buscar dados do usuário (Atualizado com auto-atribuição automática)
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Me"],
      summary: "Buscar dados do usuário",
      description: "Retorna informações de treino do usuário e indica se precisa selecionar academia.",
      response: {
        200: z.any(), // Permite o retorno customizado com o controle de tela
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

        const userEmail = session.user.email;
        const userId = session.user.id;
        const userRole = (session.user as any).role;
        const gymId = (session.user as any).gymId;

        // Regra: Aluno (USER) que não tem gymId precisa selecionar academia
        const requiresGymSelection = userRole === "USER" && !gymId;

        // Busca treinos pendentes criados pelo Personal antes do cadastro
        const pendingPlans = await prisma.workoutPlan.findMany({
          where: { pendingEmail: userEmail },
        });

        if (pendingPlans.length > 0) {
          await prisma.workoutPlan.updateMany({
            where: { userId: userId, isActive: true },
            data: { isActive: false },
          });

          for (const plan of pendingPlans) { 
            await prisma.workoutPlan.update({
              where: { id: plan.id },
              data: { userId: userId, pendingEmail: null },
            });
          }
        }

        const getUserTrainData = new GetUserTrainData();
        const trainData = await getUserTrainData.execute({
          userId: userId,
        });

        // Retorna os dados agregados incluindo o controle de fluxo de telas
        return reply.status(200).send({
          ...trainData,
          role: userRole,
          gymId: gymId,
          requiresGymSelection,
        });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  // 2. Endpoint Existente: Atualizar peso/altura
  app.withTypeProvider<ZodTypeProvider>().route({
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
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  // 3. NOVO ENDPOINT B2B: Vincular a academia selecionada ao Aluno
  app.withTypeProvider<ZodTypeProvider>().route({
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
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  // 4. NOVO ENDPOINT: Aplicar planos pendentes atrelados ao e-mail do usuário
  app.withTypeProvider<ZodTypeProvider>().route({
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

        // Busca os planos de treino com o campo pendingEmail igual ao e-mail do usuário
        const pending = await prisma.workoutPlan.findMany({ where: { pendingEmail: session.user.email } });

        let applied = 0;
        for (const plan of pending) {
          await prisma.workoutPlan.update({ where: { id: plan.id }, data: { userId: session.user.id, pendingEmail: null } });
          applied++;
        }

        return reply.status(200).send({ applied });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
      }
    },
  });
};