import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import {
  NotFoundError,
  SessionAlreadyStartedError,
  WorkoutPlanNotActiveError,
} from "../errors/index.js";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/db.js";
import { WeekDay } from "@prisma/client";
import {
  ErrorSchema,
  GetWorkoutDaySchema,
  GetWorkoutPlanSchema,
  ListWorkoutPlansQuerySchema,
  ListWorkoutPlansSchema,
  StartWorkoutSessionSchema,
  UpdateWorkoutSessionBodySchema,
  UpdateWorkoutSessionSchema,
  WorkoutPlanSchema,
} from "../schemas/index.js";
import { CreateWorkoutPlan } from "../usecases/CreateWorkoutPlan.js";
import { GetWorkoutDay } from "../usecases/GetWorkoutDay.js";
import { GetWorkoutPlan } from "../usecases/GetWorkoutPlan.js";
import { ListWorkoutPlans } from "../usecases/ListWorkoutPlans.js";
import { StartWorkoutSession } from "../usecases/StartWorkoutSession.js";
import { UpdateWorkoutSession } from "../usecases/UpdateWorkoutSession.js";

export const workoutPlanRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Workout Plan"],
      summary: "Listar planos de treino",
      description: "Lista os planos de treino do usuário autenticado, com filtro opcional por ativos.",
      querystring: ListWorkoutPlansQuerySchema,
      response: {
        200: ListWorkoutPlansSchema,
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

        const listWorkoutPlans = new ListWorkoutPlans();
        const result = await listWorkoutPlans.execute({
          userId: session.user.id,
          active: request.query.active,
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

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Workout Plan"],
      summary: "Criar plano de treino",
      description: "Cria um novo plano de treino completo para o usuário autenticado.",
      body: WorkoutPlanSchema.omit({ id: true }),
      response: {
        201: WorkoutPlanSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema,
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
        const createWorkoutPlan = new CreateWorkoutPlan();
        const result = await createWorkoutPlan.execute({
          userId: request.body.pendingEmail ? undefined : session.user.id,
          pendingEmail: request.body.pendingEmail,
          creatorId: session.user.id,
          name: request.body.name,
          workoutDays: request.body.workoutDays,
        });
        return reply.status(201).send(result);
      } catch (error) {
        app.log.error(error);
        if (error instanceof NotFoundError) {
          return reply.status(404).send({
            error: error.message,
            code: "NOT_FOUND_ERROR",
          });
        }
        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/:workoutPlanId",
    schema: {
      tags: ["Workout Plan"],
      summary: "Buscar plano de treino",
      description: "Retorna os detalhes de um plano de treino específico do usuário autenticado.",
      params: z.object({
        workoutPlanId: z.uuid(),
      }),
      response: {
        200: GetWorkoutPlanSchema,
        401: ErrorSchema,
        404: ErrorSchema,
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

        const getWorkoutPlan = new GetWorkoutPlan();
        const result = await getWorkoutPlan.execute({
          userId: session.user.id,
          workoutPlanId: request.params.workoutPlanId,
        });

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error(error);

        if (error instanceof NotFoundError) {
          return reply.status(404).send({
            error: error.message,
            code: "NOT_FOUND_ERROR",
          });
        }

        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/:workoutPlanId/days/:workoutDayId",
    schema: {
      tags: ["Workout Plan"],
      summary: "Buscar dia de treino",
      description: "Retorna os detalhes de um dia de treino específico dentro de um plano.",
      params: z.object({
        workoutPlanId: z.uuid(),
        workoutDayId: z.uuid(),
      }),
      response: {
        200: GetWorkoutDaySchema,
        401: ErrorSchema,
        404: ErrorSchema,
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

        const getWorkoutDay = new GetWorkoutDay();
        const result = await getWorkoutDay.execute({
          userId: session.user.id,
          workoutPlanId: request.params.workoutPlanId,
          workoutDayId: request.params.workoutDayId,
        });

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error(error);

        if (error instanceof NotFoundError) {
          return reply.status(404).send({
            error: error.message,
            code: "NOT_FOUND_ERROR",
          });
        }

        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/:workoutPlanId/days/:workoutDayId/sessions",
    schema: {
      tags: ["Workout Plan"],
      summary: "Iniciar sessão de treino",
      description: "Inicia uma nova sessão de treino para o dia selecionado de um plano ativo.",
      params: z.object({
        workoutPlanId: z.uuid(),
        workoutDayId: z.uuid(),
      }),
      response: {
        201: StartWorkoutSessionSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        409: ErrorSchema,
        422: ErrorSchema,
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

        const startWorkoutSession = new StartWorkoutSession();
        const result = await startWorkoutSession.execute({
          userId: session.user.id,
          workoutPlanId: request.params.workoutPlanId,
          workoutDayId: request.params.workoutDayId,
        });

        return reply.status(201).send(result);
      } catch (error) {
        app.log.error(error);

        if (error instanceof NotFoundError) {
          return reply.status(404).send({
            error: error.message,
            code: "NOT_FOUND_ERROR",
          });
        }

        if (error instanceof WorkoutPlanNotActiveError) {
          return reply.status(422).send({
            error: error.message,
            code: "WORKOUT_PLAN_NOT_ACTIVE_ERROR",
          });
        }

        if (error instanceof SessionAlreadyStartedError) {
          return reply.status(409).send({
            error: error.message,
            code: "SESSION_ALREADY_STARTED_ERROR",
          });
        }

        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PATCH",
    url: "/:workoutPlanId/days/:workoutDayId/sessions/:sessionId",
    schema: {
      tags: ["Workout Plan"],
      summary: "Atualizar sessão de treino",
      description: "Atualiza o status de conclusão de uma sessão de treino em andamento.",
      params: z.object({
        workoutPlanId: z.uuid(),
        workoutDayId: z.uuid(),
        sessionId: z.uuid(),
      }),
      body: UpdateWorkoutSessionBodySchema,
      response: {
        200: UpdateWorkoutSessionSchema,
        401: ErrorSchema,
        404: ErrorSchema,
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

        const updateWorkoutSession = new UpdateWorkoutSession();
        const result = await updateWorkoutSession.execute({
          userId: session.user.id,
          workoutPlanId: request.params.workoutPlanId,
          workoutDayId: request.params.workoutDayId,
          sessionId: request.params.sessionId,
          completedAt: request.body.completedAt,
        });

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error(error);

        if (error instanceof NotFoundError) {
          return reply.status(404).send({
            error: error.message,
            code: "NOT_FOUND_ERROR",
          });
        }

        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  // 1. LISTAR TEMPLATES (B2B)
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/templates",
    schema: {
      tags: ["Workout Plan B2B"],
      summary: "Listar templates de treino",
      response: {
        200: z.array(z.object({ id: z.string(), name: z.string(), description: z.string().nullable() })),
        401: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
        if (!session) return reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED" });

        const templates = await prisma.workoutPlan.findMany({ 
          where: { isTemplate: true }, 
          select: { id: true, name: true, description: true } 
        });
        return reply.status(200).send(templates);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
      }
    },
  });

  // 2. ATRIBUIR TEMPLATE A ALUNO (B2B)
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/assign",
    schema: {
      tags: ["Workout Plan B2B"],
      summary: "Atribuir template a um aluno",
      description: "Permite que um personal atribua um template a um aluno pelo e-mail.",
      body: z.object({ templateId: z.string().uuid(), studentEmail: z.string().email() }),
      response: { 201: z.object({ success: z.boolean(), message: z.string() }), 401: ErrorSchema, 403: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema },
    },
    handler: async (request, reply) => {
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

        const { templateId, studentEmail } = request.body;
        const templatePlan = await prisma.workoutPlan.findUnique({
          where: { id: templateId },
          include: { workoutDays: { include: { exercises: true } } },
        });

        if (!templatePlan) return reply.status(404).send({ error: "Template não encontrado", code: "NOT_FOUND_ERROR" });

        const student = await prisma.user.findUnique({ where: { email: studentEmail } });

        // Se o aluno já existe, desativamos os planos anteriores dele
        if (student) {
          await prisma.workoutPlan.updateMany({
            where: { userId: student.id, isActive: true },
            data: { isActive: false },
          });
        } else {
          // Se o aluno ainda não existe, desativamos planos pendentes anteriores para esse e-mail
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
            isActive: true, // Garante que o novo plano seja o ativo
            workoutDays: {
              create: templatePlan.workoutDays.map(
                (day: {
                  name: string;
                  weekDay: WeekDay;
                  estimatedDurationInSeconds: number;
                  coverImageUrl?: string | null;
                  exercises: Array<{
                    name: string;
                    order: number;
                    sets: number;
                    reps: number;
                    restTimeInSeconds: number;
                  }>;
                }) => ({
                  name: day.name,
                  weekDay: day.weekDay,
                  estimatedDurationInSeconds: day.estimatedDurationInSeconds,
                  coverImageUrl: day.coverImageUrl,
                  exercises: {
                    create: day.exercises.map(
                      (ex: {
                        name: string;
                        order: number;
                        sets: number;
                        reps: number;
                        restTimeInSeconds: number;
                      }) => ({
                        name: ex.name,
                        order: ex.order,
                        sets: ex.sets,
                        reps: ex.reps,
                        restTimeInSeconds: ex.restTimeInSeconds,
                      }),
                    ),
                  },
                })),
            },
          },
        });

        return reply.status(201).send({ success: true, message: `Plano atribuído a ${studentEmail}` });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
      }
    },
  });

  // 3. LISTAR ALUNOS DO PERSONAL (B2B)
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/my-students",
    schema: {
      tags: ["Workout Plan B2B"],
      summary: "Listar alunos do personal",
      description: "Retorna os alunos e os planos de treino atribuídos ao personal autenticado.",
      response: {
        200: z.array(z.object({ id: z.string(), name: z.string(), email: z.string(), workoutPlans: z.array(z.object({ id: z.string(), name: z.string(), isActive: z.boolean() })) })),
        401: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
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
    },
  });
};