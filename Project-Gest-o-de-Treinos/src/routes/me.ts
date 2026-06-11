import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import z from "zod";

import { auth } from "../lib/auth.js";
import { prisma } from "../lib/db.js"; // Importa a conexão com o banco
import { GetUserTrainData } from "../usecases/get-user-train-data.js";
import { UpsertUserTrainData } from "../usecases/upsert-user-train-data.js";

export const meRoutes = async (app: FastifyInstance) => {
  
  // 1. ENDPOINT: Buscar dados do usuário (Atualizado com auto-atribuição automática)
  app.get("/", {
    schema: {
      tags: ["Me"],
      summary: "Buscar dados do usuário",
      description: "Retorna informações de treino do usuário e indica se precisa selecionar academia.",
    }
  }, async (request, reply) => {
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

      // Regra: Aluno (USER) ou Personal (PERSONAL) que não tem gymId precisa selecionar academia
      const requiresGymSelection = (userRole === "USER" || userRole === "PERSONAL") && !gymId;

      // Busca treinos pendentes criados pelo Personal antes do cadastro
      const pendingPlans = await prisma.workoutPlan.findMany({
        where: { pendingEmail: userEmail.toLowerCase().trim() },
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
  });

  // 2. ENDPOINT: Atualizar peso/altura
  app.put("/", {
    schema: {
      tags: ["Me"],
      summary: "Atualizar dados de treino",
      description: "Atualiza peso, altura, idade e percentual de gordura do usuário autenticado.",
    }
  }, async (request, reply) => {
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

      const body = request.body as any;
      if (!body) {
        return reply.status(400).send({
          error: "Corpo da requisição ausente.",
          code: "BAD_REQUEST",
        });
      }

      const { weightInGrams, heightInCentimeters, age, bodyFatPercentage } = body;
      const upsertUserTrainData = new UpsertUserTrainData();
      const result = await upsertUserTrainData.execute({
        userId: session.user.id,
        weightInGrams,
        heightInCentimeters,
        age,
        bodyFatPercentage,
      });

      return reply.status(200).send(result);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({
        error: "Internal server error",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  });

  // 3. ENDPOINT B2B: Vincular a academia selecionada ao Aluno
  app.patch("/gym", {
    schema: {
      tags: ["Me B2B"],
      summary: "Vincular academia ao usuário",
      description: "Vincula a academia selecionada ao usuário autenticado para liberar o acesso ao treino.",
    }
  }, async (request, reply) => {
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

      const body = request.body as any;
      if (!body || !body.gymId) {
        return reply.status(400).send({
          error: "O parâmetro gymId é obrigatório no corpo da requisição.",
          code: "BAD_REQUEST",
        });
      }

      const { gymId } = body;

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
  });

  // 4. ENDPOINT: Aplicar planos pendentes atrelados ao e-mail do usuário
  app.post("/pending-assignments/apply", {
    schema: {
      tags: ["Me B2B"],
      summary: "Aplicar planos pendentes",
      description: "Aplica ao usuário todos os planos atribuídos por e-mail antes de seu cadastro.",
    }
  }, async (request, reply) => {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
      if (!session) {
        return reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED" });
      }

      // Busca os planos de treino com o campo pendingEmail igual ao e-mail do usuário
      const pending = await prisma.workoutPlan.findMany({ where: { pendingEmail: session.user.email.toLowerCase().trim() } });

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
  });
};