import { Readable } from "node:stream";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import { groq } from "@ai-sdk/groq";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
} from "ai";
import { fromNodeHeaders } from "better-auth/node";
import dayjs from "dayjs";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

//#region debug-point ai-no-response-bug
const reportDebug = (event: string, data: any) => {
  fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Session-ID": "ai-no-response-bug" },
    body: JSON.stringify({ event, data, timestamp: new Date().toISOString() })
  }).catch(() => {});
};
//#endregion

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
2. **SEMPRE use ferramentas primeiro**: Se o usuário falar de dor, cansaço ou pedir ajuste, você DEVE chamar a ferramenta \`getTodayWorkout\` antes de dar qualquer resposta textual.
3. **Análise de Dados**: Ao receber o resultado de \`getTodayWorkout\`, analise a lista de exercícios. Se o usuário relatou dor, identifique quais exercícios podem ser prejudiciais e sugira a troca.
4. **Falta de Treino hoje**: Se \`getTodayWorkout\` indicar que não há treino para hoje, use \`getWorkoutPlanDetails\` com o \`planId\` para entender o plano e sugerir um ajuste.
5. **Seja Direto**: Não peça permissão para analisar o treino. Apenas faça a análise e apresente a sugestão de ajuste.
6. **Confirmação**: Só use \`updateWorkoutDay\` se o usuário concordar explicitamente com a troca sugerida.

Responda de forma curta, motivadora e direta. Não diga "Vou verificar seu treino", apenas verifique e responda com a solução.`;

export const aiRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    handler: async (request, reply) => {
      console.log("\n--- Nova requisição de AI recebida ---");
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session) return reply.status(401).send({ error: "Unauthorized" });

      const userId = session.user.id;
      const body = request.body as any;
      const query = request.query as any;
      
      const providerRequested = query.provider || body.provider || "groq";
      // O useChat do Vercel AI SDK envia 'messages' no corpo
      const messages = body.messages || [];
      const coreMessages = await convertToModelMessages(messages);

      console.log(`[AI REQUEST] Usuário: ${userId} | Provedor: ${providerRequested} | Mensagens: ${coreMessages.length}`);

      const getModel = (p: string) => {
        if (p === "groq") {
          if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY ausente");
          return groq("llama-3.3-70b-versatile");
        }
        if (p === "xai") {
          if (!process.env.XAI_API_KEY) throw new Error("XAI_API_KEY ausente");
          return xai("grok-2-1212");
        }
        if (p === "google") {
          if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) throw new Error("GOOGLE_API_KEY ausente");
          return google("gemini-1.5-flash"); 
        }
        if (p === "openai") {
          if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY ausente");
          return openai("gpt-4o-mini");
        }
        throw new Error(`Provedor ${p} não suportado`);
      };

      try {
        const model = getModel(providerRequested);
        
        console.log(`[AI] Criando stream com modelo ${providerRequested}`);
        const result = streamText({
          model: model as any,
          system: SYSTEM_PROMPT,
          messages: coreMessages,
          stopWhen: stepCountIs(5),
          tools: {
            getUserTrainData: (tool as any)({
              description: "Busca dados de treino.",
              parameters: z.object({}),
              execute: async () => {
                console.log(`[TOOL] Executando getUserTrainData para ${userId}`);
                return new GetUserTrainData().execute({ userId });
              },
            }),
            updateUserTrainData: (tool as any)({
              description: "Atualiza os dados de treino do usuário (peso em gramas, altura em centímetros, idade, percentual de gordura e notas de lesão). Todos os parâmetros são opcionais, envie apenas o que for alterado.",
              parameters: z.object({
                weightInGrams: z.number().optional(),
                heightInCentimeters: z.number().optional(),
                age: z.number().optional(),
                bodyFatPercentage: z.number().optional(),
                injuryNotes: z.string().optional(),
              }),
              execute: async (params: any) => {
                console.log(`[TOOL] Executando updateUserTrainData para ${userId}`);
                return new UpsertUserTrainData().execute({ userId, ...params });
              },
            }),
            getTodayWorkout: (tool as any)({
              description: "Busca o treino de hoje. Retorna o ID do dia, nome do treino e a lista de exercícios com séries e repetições.",
              parameters: z.object({}),
              execute: async () => {
                console.log(`[TOOL] Executando getTodayWorkout para ${userId}`);
                try {
                  const today = dayjs().format("YYYY-MM-DD");
                  const homeData = await new GetHomeData().execute({ userId, date: today });
                  
                  if ("status" in homeData && homeData.status === 428) {
                    return { error: "Usuário ainda não selecionou uma academia ou não possui plano de treino." };
                  }

                  const data = homeData as any;
                  if (!data.activeWorkoutPlanId) {
                    return { error: "Usuário não possui um plano de treino ativo no momento." };
                  }

                  if (!data.todayWorkoutDay?.id) {
                    const plan = await new GetWorkoutPlan().execute({ userId, workoutPlanId: data.activeWorkoutPlanId });
                    const availableDays = plan.workoutDays.map((d: any) => d.weekDay).join(", ");
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
                    workoutDayId: data.todayWorkoutDay.id,
                    workoutName: workoutDay.name,
                    weekDay: workoutDay.weekDay,
                    exercises: workoutDay.exercises.map((ex: any) => ({
                      name: ex.name,
                      sets: ex.sets,
                      reps: ex.reps,
                      rest: `${ex.restTimeInSeconds}s`
                    }))
                  };
                } catch (error: any) {
                  console.error("[AI TOOL ERROR] getTodayWorkout:", error.message);
                  return { error: "Erro ao buscar o treino de hoje: " + error.message };
                }
              },
            }),
            getWorkoutPlanDetails: (tool as any)({
              description: "Busca os detalhes completos de um plano de treino específico, incluindo todos os dias e exercícios.",
              parameters: z.object({ 
                workoutPlanId: z.string().describe("O ID do plano de treino") 
              }),
              execute: async (params: any) => {
                const { workoutPlanId } = params;
                console.log(`[TOOL] Executando getWorkoutPlanDetails para ${userId}`);
                try {
                  const plan = await new GetWorkoutPlan().execute({ userId, workoutPlanId });
                  return {
                    name: plan.name,
                    days: plan.workoutDays.map((d: any) => ({
                      name: d.name,
                      weekDay: d.weekDay,
                      isRest: d.isRest,
                      exercises: d.exercises.map((ex: any) => ({
                        name: ex.name,
                        sets: ex.sets,
                        reps: ex.reps
                      }))
                    }))
                  };
                } catch (error: any) {
                  return { error: "Erro ao buscar detalhes do plano: " + error.message };
                }
              },
            }),
            updateWorkoutDay: (tool as any)({
              description: "Atualiza um dia de treino específico (troca exercícios, muda nome ou define como descanso).",
              parameters: z.object({ 
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
              execute: async (params: any) => {
                console.log(`[TOOL] Executando updateWorkoutDay para ${userId}`);
                return new UpdateWorkoutDay().execute({ userId, ...params });
              },
            }),
            getWorkoutPlans: (tool as any)({
              description: "Lista todos os planos de treino do usuário.",
              parameters: z.object({}),
              execute: async () => new ListWorkoutPlans().execute({ userId }),
            }),
            createWorkoutPlan: (tool as any)({
              description: "Cria um novo plano de treino completo de 7 dias.",
              parameters: z.object({
                name: z.string(),
                workoutDays: z.array(z.object({
                  name: z.string(),
                  weekDay: z.enum(Object.keys(WeekDay) as [string, ...string[]]),
                  isRest: z.boolean(),
                  estimatedDurationInSeconds: z.number(),
                  coverImageUrl: z.string().url(),
                  exercises: z.array(z.object({ order: z.number(), name: z.string(), sets: z.number(), reps: z.number(), restTimeInSeconds: z.number() })),
                })),
              }),
              execute: async (input: any) => new CreateWorkoutPlan().execute({ userId, name: input.name, workoutDays: input.workoutDays as any }),
            }),
          },
          onStepFinish: (event) => {
            console.log(`[AI STEP] Passo finalizado. Tool calls: ${event.toolCalls?.length || 0}`);
          },
          onFinish: () => {
            console.log(`[AI] Stream finalizada com sucesso para ${userId}`);
          }
        });

        console.log(`[AI] Iniciando stream de dados para ${providerRequested}`);
        reportDebug("stream-start", { userId, provider: providerRequested });
        
        const origin = request.headers.origin || "http://localhost:3000";
        
        const dataStreamResponse = result.toUIMessageStreamResponse({
          originalMessages: messages,
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "X-AI-Provider": providerRequested,
          }
        });

        // Copiar headers para o Fastify
        dataStreamResponse.headers.forEach((value, key) => {
          reply.header(key, value);
        });

        reportDebug("stream-ready", { status: dataStreamResponse.status });

        if (!dataStreamResponse.body) {
          return reply.status(500).send({ error: "Failed to generate stream body" });
        }

        const nodeStream = Readable.fromWeb(dataStreamResponse.body as any);
        return reply.status(dataStreamResponse.status).send(nodeStream);

      } catch (error: any) {
        console.error(`[AI ERROR]`, error);
        
        // Se já começamos a enviar a resposta, não podemos usar reply.status().send()
        if (reply.raw.headersSent) {
          console.error("[AI ERROR] Erro ocorreu após headers terem sido enviados.");
          reply.raw.end();
          return;
        }
        
        return reply.status(500).send({ 
          error: "Erro na comunicação com o provedor de IA",
          details: error.message 
        });
      }
    },
  });
};
