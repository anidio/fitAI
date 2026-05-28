import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import z from "zod";

import {
  NotFoundError,
  SessionAlreadyStartedError,
  WorkoutPlanNotActiveError,
} from "../errors/index.js";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/db.js";
import { WeekDay } from "@prisma/client";
import { CreateWorkoutPlan } from "../usecases/create-workout-plan.js";
import { GetWorkoutDay } from "../usecases/get-workout-day.js";
import { GetWorkoutPlan } from "../usecases/get-workout-plan.js";
import { StartWorkoutSession } from "../usecases/start-workout-session.js";
import { UpdateWorkoutSession } from "../usecases/update-workout-session.js";

export const workoutPlanRoutes = async (app: FastifyInstance) => {

  // =========================================================================
  // 1. LISTAR TEMPLATES GLOBAIS DE TREINO DISPONÍVEIS (B2B) - BLINDADO E ÚNICO
  // =========================================================================
  app.get("/templates", {
    schema: {
      tags: ["Workout Plan B2B"],
      summary: "Listar templates de treino",
      description: "Retorna a lista de templates operacionais de treino cadastrados via seed ou IA.",
    }
  }, async (request, reply) => {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
      if (!session) {
        return reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED" });
      }

      const templates = await prisma.workoutPlan.findMany({ 
        where: { isTemplate: true }, 
        select: { id: true, name: true, description: true } 
      });
      
      return reply.status(200).send(templates);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
    }
  });

  // =========================================================================
  // 2. CRIAR PLANO DE TREINO AVULSO
  // =========================================================================
  app.post("/", {
    schema: {
      tags: ["Workout Plan"],
      summary: "Criar plano de treino",
      description: "Cria um novo plano de treino completo para o usuário autenticado.",
      body: z.any(), // 🌟 BLINDAGEM SWAGGER
    }
  }, async (request, reply) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });
      if (!session) {
        return reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED" });
      }
      
      const createWorkoutPlan = new CreateWorkoutPlan();
      const body = request.body as any;
      const result = await createWorkoutPlan.execute({
        userId: body.pendingEmail ? undefined : session.user.id,
        pendingEmail: body.pendingEmail,
        creatorId: session.user.id,
        name: body.name,
        workoutDays: body.workoutDays as any,
      });
      return reply.status(201).send(result);
    } catch (error) {
      app.log.error(error);
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message, code: "NOT_FOUND_ERROR" });
      }
      return reply.status(500).send({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
    }
  });

  // =========================================================================
  // 3. BUSCAR DETALHES DE UM PLANO DE TREINO ESPECÍFICO
  // =========================================================================
  app.get("/:workoutPlanId", {
    schema: {
      tags: ["Workout Plan"],
      summary: "Buscar plano de treino",
      description: "Retorna os detalhes de um plano de treino específico do usuário autenticado.",
    }
  }, async (request, reply) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });
      if (!session) {
        return reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED" });
      }

      const getWorkoutPlan = new GetWorkoutPlan();
      const result = await getWorkoutPlan.execute({
        userId: session.user.id,
        workoutPlanId: (request.params as any).workoutPlanId,
      });

      return reply.status(200).send(result);
    } catch (error) {
      app.log.error(error);
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message, code: "NOT_FOUND_ERROR" });
      }
      return reply.status(500).send({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
    }
  });

  // =========================================================================
  // 4. BUSCAR DIA DE TREINO ESPECÍFICO DENTRO DE UM PLANO
  // =========================================================================
  app.get("/:workoutPlanId/days/:workoutDayId", {
    schema: {
      tags: ["Workout Plan"],
      summary: "Buscar dia de treino",
      description: "Retorna os detalhes de um dia de treino específico dentro de um plano.",
    }
  }, async (request, reply) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });
      if (!session) {
        return reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED" });
      }

      const getWorkoutDay = new GetWorkoutDay();
      const params = request.params as any;
      const result = await getWorkoutDay.execute({
        userId: session.user.id,
        workoutPlanId: params.workoutPlanId,
        workoutDayId: params.workoutDayId,
      });

      return reply.status(200).send(result);
    } catch (error) {
      app.log.error(error);
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message, code: "NOT_FOUND_ERROR" });
      }
      return reply.status(500).send({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
    }
  });

  // =========================================================================
  // 5. INICIAR UMA SESSÃO DE TREINO ATIVA
  // =========================================================================
  app.post("/:workoutPlanId/days/:workoutDayId/sessions", {
    schema: {
      tags: ["Workout Plan"],
      summary: "Iniciar sessão de treino",
      description: "Inicia uma nova sessão de treino para o dia selecionado de um plano ativo.",
    }
  }, async (request, reply) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });
      if (!session) {
        return reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED" });
      }

      const startWorkoutSession = startWorkoutSession || new StartWorkoutSession();
      const params = request.params as any;
      const result = await startWorkoutSession.execute({
        userId: session.user.id,
        workoutPlanId: params.workoutPlanId,
        workoutDayId: params.workoutDayId,
      });

      return reply.status(201).send(result);
    } catch (error) {
      app.log.error(error);
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message, code: "NOT_FOUND_ERROR" });
      }
      if (error instanceof WorkoutPlanNotActiveError) {
        return reply.status(422).send({ error: error.message, code: "WORKOUT_PLAN_NOT_ACTIVE_ERROR" });
      }
      if (error instanceof SessionAlreadyStartedError) {
        return reply.status(409).send({ error: error.message, code: "SESSION_ALREADY_STARTED_ERROR" });
      }
      return reply.status(500).send({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
    }
  });

  // =========================================================================
  // 6. ATUALIZAR STATUS DE CONCLUSÃO DA SESSÃO DE TREINO (CONCLUIR TREINO)
  // =========================================================================
  app.patch("/:workoutPlanId/days/:workoutDayId/sessions/:sessionId", {
    schema: {
      tags: ["Workout Plan"],
      summary: "Atualizar sessão de treino",
      description: "Atualiza o status de conclusão de uma sessão de treino em andamento.",
      body: z.any(), // 🌟 BLINDAGEM SWAGGER
    }
  }, async (request, reply) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });
      if (!session) {
        return reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED" });
      }

      const updateWorkoutSession = new UpdateWorkoutSession();
      const params = request.params as any;
      const body = request.body as any;
      const result = await updateWorkoutSession.execute({
        userId: session.user.id,
        workoutPlanId: params.workoutPlanId,
        workoutDayId: params.workoutDayId,
        sessionId: params.sessionId,
        completedAt: body.completedAt,
      });

      return reply.status(200).send(result);
    } catch (error) {
      app.log.error(error);
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ error: error.message, code: "NOT_FOUND_ERROR" });
      }
      return reply.status(500).send({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
    }
  });

  // =========================================================================
  // 7. ATRIBUIR TEMPLATE OPERACIONAL A UM ALUNO VIA EMAIL (B2B) - BLINDADO
  // =========================================================================
  app.post("/assign", {
    schema: {
      tags: ["Workout Plan B2B"],
      summary: "Atribuir template a um aluno",
      description: "Permite que um personal atribua um template a um aluno pelo e-mail.",
      body: z.any(), // 🌟 BLINDAGEM SWAGGER
    }
  }, async (request, reply) => {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
      if (!session) return reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED" });

      const userRole = (session.user as any).role;
      if (userRole !== "PERSONAL") {
        return reply.status(403).send({
          error: "Apenas personal trainers podem atribuir templates de treino.",
          code: "FORBIDDEN",
        });
      }

      const body = request.body as any;
      if (!body || !body.templateId || !body.studentEmail) {
        return reply.status(400).send({ error: "Campos templateId e studentEmail são obrigatórios.", code: "BAD_REQUEST" });
      }

      const { templateId, studentEmail } = body;
      const templatePlan = await prisma.workoutPlan.findUnique({
        where: { id: templateId },
        include: { workoutDays: { include: { exercises: true } } },
      });

      if (!templatePlan) return reply.status(404).send({ error: "Template não encontrado", code: "NOT_FOUND_ERROR" });

      const student = await prisma.user.findUnique({ where: { email: studentEmail } });

      if (student) {
        await prisma.workoutPlan.updateMany({
          where: { userId: student.id, isActive: true },
          data: { isActive: false },
        });
      } else {
        await prisma.workoutPlan.updateMany({
          where: { pendingEmail: studentEmail, isActive: true },
          data: { isActive: false },
        });
      }

      await prisma.workoutPlan.create({
        data: {
          name: templatePlan.name,
          description: templatePlan.description,
          isTemplate: false,
          userId: student?.id,
          pendingEmail: student ? null : studentEmail,
          creatorId: session.user.id,
          isActive: true,
          workoutDays: {
            create: templatePlan.workoutDays.map((day: any) => ({
              name: day.name,
              weekDay: day.weekDay,
              estimatedDurationInSeconds: Number(day.estimatedDurationInSeconds || 0),
              coverImageUrl: day.coverImageUrl || null,
              exercises: {
                create: day.exercises.map((ex: any) => ({
                  name: ex.name,
                  order: Number(ex.order || 0),
                  sets: Number(ex.sets || 0),
                  reps: Number(ex.reps || 0),
                  restTimeInSeconds: Number(ex.restTimeInSeconds || 0),
                })),
              },
            })),
          },
        },
      });

      return reply.status(201).send({ success: true, message: `Plano atribuído com sucesso!` });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
    }
  });

  // =========================================================================
  // 8. LISTAR ALUNOS E RESPECTIVOS PLANOS ATIVOS DO PERSONAL (B2B) - BLINDADO
  // =========================================================================
  app.get("/my-students", {
    schema: {
      tags: ["Workout Plan B2B"],
      summary: "Listar alunos do personal",
      description: "Retorna os alunos e os planos de treino atribuídos ao personal autenticado.",
    }
  }, async (request, reply) => {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
      if (!session) return reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED" });

      const plans = await prisma.workoutPlan.findMany({
        where: { creatorId: session.user.id, isTemplate: false },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      const studentMap = new Map();
      for (const plan of plans) {
        if (plan.user) {
          if (!studentMap.has(plan.user.id)) {
            studentMap.set(plan.user.id, { id: plan.user.id, name: plan.user.name, email: plan.user.email, workoutPlans: [] });
          }
          studentMap.get(plan.user.id).workoutPlans.push({ id: plan.id, name: plan.name, isActive: plan.isActive });
        }
      }
      return reply.status(200).send(Array.from(studentMap.values()));
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
    }
  });
};