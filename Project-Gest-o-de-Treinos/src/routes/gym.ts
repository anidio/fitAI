import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import { auth } from "../lib/auth.js";
import { prisma } from "../lib/db.js";
import { ErrorSchema } from "../schemas/index.js";

export const gymRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Gym B2B"],
      summary: "Dono de academia cadastra uma nova unidade física",
      body: z.object({
        name: z.string().min(3, "Nome da unidade muito curto"),
        address: z.string().optional(),
      }),
      response: {
        201: z.object({
          success: z.boolean(),
          gym: z.object({
            id: z.string(),
            name: z.string(),
          }),
        }),
        401: ErrorSchema,
        403: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        });

        if (!session) {
          return reply.status(401).send({ error: "Não autorizado", code: "UNAUTHORIZED" });
        }

        // Segurança de Perfil: Bloqueia se quem está tentando criar não for o Dono da Academia
        const userRole = (session.user as any).role;
        if (userRole !== "GYM_OWNER") {
          return reply.status(403).send({ 
            error: "Apenas donos de academia podem registrar unidades corporativas", 
            code: "FORBIDDEN" 
          });
        }

        const { name } = request.body;

        // Cria a unidade no PostgreSQL gerando um ID real automático
        const newGym = await prisma.gym.create({
          data: {
            name,
          },
        });

        // Opcional: Já vincula esse Dono a essa academia que ele acabou de criar
        await prisma.user.update({
          where: { id: session.user.id },
          data: { gymId: newGym.id },
        });

        return reply.status(201).send({ success: true, gym: { id: newGym.id, name: newGym.name } });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Erro interno do servidor", code: "INTERNAL_SERVER_ERROR" });
      }
    },
  });

  // GET para listar as academias reais criadas no banco
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Gym B2B"],
      summary: "Listar todas as academias ativas no sistema",
    },
    handler: async (request, reply) => {
      const gyms = await prisma.gym.findMany({
        select: { id: true, name: true }
      });
      return gyms;
    }
  });
};