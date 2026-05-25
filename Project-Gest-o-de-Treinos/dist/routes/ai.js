import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { groq } from "@ai-sdk/groq";
import { convertToModelMessages, stepCountIs, streamText, tool, } from "ai";
import { fromNodeHeaders } from "better-auth/node";
import dayjs from "dayjs";
import z from "zod";
import { WeekDay } from "@prisma/client";
import { auth } from "../lib/auth.js";
import { CreateWorkoutPlan } from "../usecases/create-workout-plan.js";
import { GetHomeData } from "../usecases/get-home-data.js";
import { GetUserTrainData } from "../usecases/get-user-train-data.js";
import { GetWorkoutDay } from "../usecases/get-workout-day.js";
import { GetWorkoutPlan } from "../usecases/get-workout-plan.js";
import { ListWorkoutPlans } from "../usecases/list-workout-plans.js";
import { UpdateWorkoutDay } from "../usecases/update-workout-day.js";
import { UpsertUserTrainData } from "../usecases/upsert-user-train-data.js";
const SYSTEM_PROMPT = `Você é um personal trainer virtual especialista em musculação e bem-estar.

## Sua Missão
Ajudar o usuário a ter o melhor treino possível, ajustando-o às suas condições físicas atuais (dores, cansaço, tempo disponível).

## Regras de Ouro (Siga rigorosamente)
1. **NUNCA peça os exercícios ao usuário**. Você tem a ferramenta \`getTodayWorkout\` para isso.
2. **SEMPRE comece buscando informações**: Se o usuário falar de dor, cansaço ou pedir ajuste, chame IMEDIATAMENTE a ferramenta \`getTodayWorkout\`.
3. **Estrutura de Dados**: Quando você chama \`getTodayWorkout\`, você recebe um objeto contendo \`workoutName\` e uma lista de \`exercises\`. Use esses nomes exatos para falar com o usuário.
4. **Falta de Treino hoje**: Se \`getTodayWorkout\` retornar que não há treino para hoje, use \`getWorkoutPlanDetails\` com o \`planId\` retornado para ver os outros dias do plano e sugerir um ajuste.
5. **Não peça confirmação para ver o treino**: Sua primeira ação ao receber um relato de dor é chamar as ferramentas. Só responda após ter os dados.
6. **Identificação**: Chame \`getUserTrainData\` no início para saber o nome do usuário e seu histórico de lesões.

## Fluxo de Ajuste de Treino
1. Usuário relata dor/problema.
2. Você chama \`getTodayWorkout\`.
3. Se for dia de descanso ou não houver treino hoje, chame \`getWorkoutPlanDetails\` para entender o contexto do plano do usuário.
4. Analise os exercícios e sugira mudanças específicas baseadas nos nomes reais dos exercícios (ex: "Vi que você tem Supino hoje...").
5. Se o usuário aceitar, use \`updateWorkoutDay\` para salvar.

Responda de forma curta, motivadora e direta. Não seja repetitivo.`;
export const aiRoutes = async (app) => {
    app.withTypeProvider().route({
        method: "POST",
        url: "/",
        handler: async (request, reply) => {
            console.log("\n--- Nova requisição de AI recebida ---");
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(request.headers),
            });
            if (!session)
                return reply.status(401).send({ error: "Unauthorized" });
            const userId = session.user.id;
            const body = request.body;
            const query = request.query;
            // Forçamos o Groq (Llama) como prioridade absoluta agora
            const providerRequested = query.provider || body.provider || "groq";
            const messages = body.messages;
            // Sequência de tentativa: Groq -> Gemini -> OpenAI
            const providersToTry = ["groq", "google", "openai"];
            console.log(`[AI REQUEST] Usuário: ${userId} | Provedor: ${providerRequested}`);
            const getModel = (p) => {
                if (p === "groq") {
                    if (!process.env.GROQ_API_KEY)
                        throw new Error("GROQ_API_KEY ausente");
                    return groq("llama-3.3-70b-versatile");
                }
                if (p === "google") {
                    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY)
                        throw new Error("GOOGLE_API_KEY ausente");
                    return google("gemini-1.5-flash"); // Voltando para o nome base
                }
                return openai("gpt-4o-mini");
            };
            let lastError = null;
            for (const p of providersToTry) {
                try {
                    console.log(`[AI] Tentando ${p}...`);
                    const model = getModel(p);
                    const result = streamText({
                        model,
                        system: SYSTEM_PROMPT,
                        messages: await convertToModelMessages(messages),
                        stopWhen: stepCountIs(5),
                        tools: {
                            getUserTrainData: tool({
                                description: "Busca dados de treino.",
                                inputSchema: z.object({}),
                                execute: async () => new GetUserTrainData().execute({ userId }),
                            }),
                            updateUserTrainData: tool({
                                description: "Atualiza dados de treino.",
                                inputSchema: z.object({ weightInGrams: z.number(), heightInCentimeters: z.number(), age: z.number(), bodyFatPercentage: z.number(), injuryNotes: z.string().optional() }),
                                execute: async (params) => new UpsertUserTrainData().execute({ userId, ...params }),
                            }),
                            getTodayWorkout: tool({
                                description: "Busca o treino de hoje. Retorna o nome do treino e a lista de exercícios com séries e repetições.",
                                inputSchema: z.object({}),
                                execute: async () => {
                                    try {
                                        const today = dayjs().format("YYYY-MM-DD");
                                        const homeData = await new GetHomeData().execute({ userId, date: today });
                                        if ("status" in homeData && homeData.status === 428) {
                                            return { error: "Usuário ainda não selecionou uma academia ou não possui plano de treino." };
                                        }
                                        const data = homeData;
                                        if (!data.activeWorkoutPlanId) {
                                            return { error: "Usuário não possui um plano de treino ativo no momento." };
                                        }
                                        if (!data.todayWorkoutDay?.id) {
                                            // Se não achou treino para hoje, tenta listar os dias disponíveis do plano
                                            const plan = await new GetWorkoutPlan().execute({ userId, workoutPlanId: data.activeWorkoutPlanId });
                                            const availableDays = plan.workoutDays.map((d) => d.weekDay).join(", ");
                                            return {
                                                error: `Não encontrei um treino específico para hoje (${dayjs().format("dddd")}).`,
                                                message: `O plano ativo '${plan.name}' possui treinos nos dias: ${availableDays}.`,
                                                planId: data.activeWorkoutPlanId
                                            };
                                        }
                                        const workoutDay = await new GetWorkoutDay().execute({
                                            userId,
                                            workoutPlanId: data.activeWorkoutPlanId,
                                            workoutDayId: data.todayWorkoutDay.id
                                        });
                                        if (workoutDay.isRest) {
                                            return {
                                                message: "Hoje é dia de descanso (Rest Day). Não há exercícios previstos.",
                                                workoutName: workoutDay.name,
                                                isRest: true
                                            };
                                        }
                                        return {
                                            workoutName: workoutDay.name,
                                            weekDay: workoutDay.weekDay,
                                            exercises: workoutDay.exercises.map((ex) => ({
                                                name: ex.name,
                                                sets: ex.sets,
                                                reps: ex.reps,
                                                rest: `${ex.restTimeInSeconds}s`
                                            }))
                                        };
                                    }
                                    catch (error) {
                                        console.error("[AI TOOL ERROR] getTodayWorkout:", error.message);
                                        return { error: "Erro ao buscar o treino de hoje: " + error.message };
                                    }
                                },
                            }),
                            getWorkoutPlanDetails: tool({
                                description: "Busca os detalhes completos de um plano de treino específico, incluindo todos os dias e exercícios.",
                                inputSchema: z.object({
                                    workoutPlanId: z.string().describe("O ID do plano de treino")
                                }),
                                execute: async ({ workoutPlanId }) => {
                                    try {
                                        const plan = await new GetWorkoutPlan().execute({ userId, workoutPlanId });
                                        return {
                                            name: plan.name,
                                            days: plan.workoutDays.map((d) => ({
                                                name: d.name,
                                                weekDay: d.weekDay,
                                                isRest: d.isRest,
                                                exercises: d.exercises.map((ex) => ({
                                                    name: ex.name,
                                                    sets: ex.sets,
                                                    reps: ex.reps
                                                }))
                                            }))
                                        };
                                    }
                                    catch (error) {
                                        return { error: "Erro ao buscar detalhes do plano: " + error.message };
                                    }
                                },
                            }),
                            updateWorkoutDay: tool({
                                description: "Atualiza um dia de treino específico (troca exercícios, muda nome ou define como descanso).",
                                inputSchema: z.object({
                                    workoutDayId: z.string().describe("O ID do dia obtido via getTodayWorkout"),
                                    name: z.string().optional(),
                                    isRest: z.boolean().optional(),
                                    exercises: z.array(z.object({
                                        name: z.string(),
                                        sets: z.number(),
                                        reps: z.number(),
                                        restTimeInSeconds: z.number(),
                                        order: z.number()
                                    })).optional()
                                }),
                                execute: async (params) => new UpdateWorkoutDay().execute({ userId, ...params }),
                            }),
                            getWorkoutPlans: tool({
                                description: "Lista todos os planos de treino do usuário.",
                                inputSchema: z.object({}),
                                execute: async () => new ListWorkoutPlans().execute({ userId }),
                            }),
                            createWorkoutPlan: tool({
                                description: "Cria um novo plano de treino completo de 7 dias.",
                                inputSchema: z.object({
                                    name: z.string(),
                                    workoutDays: z.array(z.object({
                                        name: z.string(),
                                        weekDay: z.enum(WeekDay),
                                        isRest: z.boolean(),
                                        estimatedDurationInSeconds: z.number(),
                                        coverImageUrl: z.string().url(),
                                        exercises: z.array(z.object({ order: z.number(), name: z.string(), sets: z.number(), reps: z.number(), restTimeInSeconds: z.number() })),
                                    })),
                                }),
                                execute: async (input) => new CreateWorkoutPlan().execute({ userId, name: input.name, workoutDays: input.workoutDays }),
                            }),
                        },
                    });
                    const response = result.toUIMessageStreamResponse();
                    console.log(`[AI] Sucesso total com ${p}!`);
                    reply.header("X-AI-Provider", p);
                    reply.status(response.status);
                    response.headers.forEach((v, k) => reply.header(k, v));
                    return reply.send(response.body);
                }
                catch (error) {
                    console.error(`[AI] Falha no ${p}: ${error.message}`);
                    lastError = error;
                    // Se for erro de quota ou não encontrado, tenta o próximo
                    continue;
                }
            }
            return reply.status(500).send({ error: lastError?.message || "Falha total" });
        },
    });
};
