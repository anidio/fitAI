import { fromNodeHeaders } from "better-auth/node";
import z from "zod";
import { NotFoundError, SessionAlreadyStartedError, WorkoutPlanNotActiveError, } from "../errors/index.js";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/db.js";
import { ErrorSchema, GetWorkoutDaySchema, GetWorkoutPlanSchema, ListWorkoutPlansQuerySchema, ListWorkoutPlansSchema, StartWorkoutSessionSchema, UpdateWorkoutSessionBodySchema, UpdateWorkoutSessionSchema, WorkoutPlanSchema, } from "../schemas/index.js";
import { CreateWorkoutPlan } from "../usecases/CreateWorkoutPlan.js";
import { GetWorkoutDay } from "../usecases/GetWorkoutDay.js";
import { GetWorkoutPlan } from "../usecases/GetWorkoutPlan.js";
import { ListWorkoutPlans } from "../usecases/ListWorkoutPlans.js";
import { StartWorkoutSession } from "../usecases/StartWorkoutSession.js";
import { UpdateWorkoutSession } from "../usecases/UpdateWorkoutSession.js";
export const workoutPlanRoutes = async (app) => {
    app.withTypeProvider().route({
        method: "GET",
        url: "/",
        schema: {
            tags: ["Workout Plan"],
            summary: "List workout plans",
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
    app.withTypeProvider().route({
        method: "POST",
        url: "/",
        schema: {
            tags: ["Workout Plan"],
            summary: "Create a workout plan",
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
                    userId: session.user.id,
                    name: request.body.name,
                    workoutDays: request.body.workoutDays,
                });
                return reply.status(201).send(result);
            }
            catch (error) {
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
    app.withTypeProvider().route({
        method: "GET",
        url: "/:workoutPlanId",
        schema: {
            tags: ["Workout Plan"],
            summary: "Get a workout plan",
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
            }
            catch (error) {
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
    app.withTypeProvider().route({
        method: "GET",
        url: "/:workoutPlanId/days/:workoutDayId",
        schema: {
            tags: ["Workout Plan"],
            summary: "Get a workout day",
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
            }
            catch (error) {
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
    app.withTypeProvider().route({
        method: "POST",
        url: "/:workoutPlanId/days/:workoutDayId/sessions",
        schema: {
            tags: ["Workout Plan"],
            summary: "Start a workout session",
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
            }
            catch (error) {
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
    // 1. NOVO ENDPOINT B2B: Listar todos os planos de treino marcados como template corporativo
    app.withTypeProvider().route({
        method: "GET",
        url: "/templates",
        schema: {
            tags: ["Workout Plan B2B"],
            summary: "Personal lista os templates de treinos disponiveis no sistema",
            response: {
                200: z.array(z.object({
                    id: z.string(),
                    name: z.string(),
                    description: z.string().nullable(),
                })),
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
                    return reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED" });
                }
                // Busca no banco todos os planos configurados como template genérico
                const templates = await prisma.workoutPlan.findMany({
                    where: {
                        isTemplate: true,
                    },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                });
                return reply.status(200).send(templates);
            }
            catch (error) {
                app.log.error(error);
                return reply.status(500).send({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
            }
        },
    });
    // 2. NOVO ENDPOINT B2B: Personal vincula um template existente a um aluno usando o e-mail
    app.withTypeProvider().route({
        method: "POST",
        url: "/assign",
        schema: {
            tags: ["Workout Plan B2B"],
            summary: "Personal clona um template de treino e vincula ao e-mail de um aluno matriculado",
            body: z.object({
                templateId: z.string(),
                studentEmail: z.string().email("E-mail de aluno invalido"),
            }),
            response: {
                201: z.object({ success: z.boolean(), message: z.string() }),
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
                    return reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED" });
                }
                const { templateId, studentEmail } = request.body;
                // 1. Busca a estrutura completa do modelo (WorkoutPlan -> WorkoutDays -> Exercises)
                const templatePlan = await prisma.workoutPlan.findUnique({
                    where: { id: templateId },
                    include: {
                        workoutDays: {
                            include: {
                                exercises: true,
                            },
                        },
                    },
                });
                if (!templatePlan) {
                    return reply.status(404).send({ error: "Template de treino nao encontrado", code: "NOT_FOUND" });
                }
                // 2. Procura o Aluno pelo e-mail no sistema corporativo
                const student = await prisma.user.findUnique({ where: { email: studentEmail } });
                // If student not found, create a pending assignment
                if (!student) {
                    await prisma.workoutPlan.create({
                        data: {
                            name: templatePlan.name,
                            description: templatePlan.description,
                            isTemplate: false,
                            pendingEmail: studentEmail,
                            creatorId: session.user.id,
                            workoutDays: {
                                create: templatePlan.workoutDays.map((day) => ({
                                    name: day.name,
                                    weekDay: day.weekDay,
                                    estimatedDurationInSeconds: day.estimatedDurationInSeconds,
                                    coverImageUrl: day.coverImageUrl,
                                    exercises: {
                                        create: day.exercises.map((exercise) => ({
                                            name: exercise.name,
                                            order: exercise.order,
                                            sets: exercise.sets,
                                            reps: exercise.reps,
                                            restTimeInSeconds: exercise.restTimeInSeconds,
                                        })),
                                    },
                                })),
                            },
                        },
                    });
                    return reply.status(201).send({ success: true, message: `Aluno nao cadastrado. Plano pendente criado para ${studentEmail}` });
                }
                // 3. CLONAGEM CIRÚRGICA: Cria o plano para o Aluno desvinculando a flag 'isTemplate'
                await prisma.workoutPlan.create({
                    data: {
                        name: templatePlan.name,
                        description: templatePlan.description,
                        isTemplate: false, // Esse agora pertence ao Aluno de forma fixa
                        userId: student.id, // ID do Aluno matriculado
                        creatorId: session.user.id, // ID do Personal Trainer que vinculou
                        workoutDays: {
                            create: templatePlan.workoutDays.map((day) => ({
                                name: day.name,
                                weekDay: day.weekDay,
                                estimatedDurationInSeconds: day.estimatedDurationInSeconds,
                                coverImageUrl: day.coverImageUrl,
                                exercises: {
                                    create: day.exercises.map((exercise) => ({
                                        name: exercise.name,
                                        order: exercise.order,
                                        sets: exercise.sets,
                                        reps: exercise.reps,
                                        restTimeInSeconds: exercise.restTimeInSeconds,
                                    })),
                                },
                            })),
                        },
                    },
                });
                return reply.status(201).send({
                    success: true,
                    message: `Plano '${templatePlan.name}' clonado e atribuido com sucesso para ${student.name || studentEmail}!`
                });
            }
            catch (error) {
                app.log.error(error);
                return reply.status(500).send({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
            }
        },
    });
    // 3. NOVO ENDPOINT: Personal lista seus alunos e os treinos atribuídos
    app.withTypeProvider().route({
        method: "GET",
        url: "/my-students",
        schema: {
            tags: ["Workout Plan B2B"],
            summary: "Personal lista seus alunos e treinos atribuídos",
            response: {
                200: z.array(z.object({
                    id: z.string(),
                    name: z.string(),
                    email: z.string(),
                    workoutPlans: z.array(z.object({
                        id: z.string(),
                        name: z.string(),
                        isActive: z.boolean(),
                    })),
                })),
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
                // Find all workout plans where creatorId is the current personal
                const plans = await prisma.workoutPlan.findMany({
                    where: { creatorId: session.user.id, isTemplate: false },
                    include: { user: { select: { id: true, name: true, email: true } } },
                });
                // Group by user
                const studentMap = new Map();
                for (const plan of plans) {
                    if (plan.user) {
                        if (!studentMap.has(plan.user.id)) {
                            studentMap.set(plan.user.id, {
                                id: plan.user.id,
                                name: plan.user.name,
                                email: plan.user.email,
                                workoutPlans: [],
                            });
                        }
                        studentMap.get(plan.user.id).workoutPlans.push({
                            id: plan.id,
                            name: plan.name,
                            isActive: plan.isActive,
                        });
                    }
                }
                return reply.status(200).send(Array.from(studentMap.values()));
            }
            catch (error) {
                app.log.error(error);
                return reply.status(500).send({ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
            }
        },
    });
    app.withTypeProvider().route({
        method: "PATCH",
        url: "/:workoutPlanId/days/:workoutDayId/sessions/:sessionId",
        schema: {
            tags: ["Workout Plan"],
            summary: "Update a workout session",
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
            }
            catch (error) {
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
};
