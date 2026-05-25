import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import { auth } from "../lib/auth.js";
import { prisma } from "../lib/db.js";
import { ErrorSchema } from "../schemas/index.js";

export const gymRoutes = async (app: FastifyInstance) => {

  // 1. ENDPOINT: Listar todos os alunos vinculados à mesma academia do Personal/Dono
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/students",
    schema: {
      tags: ["Gym B2B"],
      summary: "Listar alunos da academia",
      description: "Retorna a lista de alunos vinculados à mesma academia do usuário autenticado.",
      response: {
        200: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            image: z.string().nullable().optional(),
          })
        ),
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
          return reply.status(401).send({
            error: "Unauthorized",
            code: "UNAUTHORIZED",
          });
        }

        const userGymId = (session.user as any).gymId;
        const userRole = (session.user as any).role;

        // Validação de segurança: Apenas Personais ou Donos podem listar alunos
        if (userRole !== "PERSONAL" && userRole !== "GYM_OWNER") {
          return reply.status(403).send({
            error: "Forbidden",
            code: "FORBIDDEN",
          });
        }

        if (!userGymId) {
          return reply.status(200).send([]); // Se o personal não tiver academia vinculada, retorna vazio
        }

        // Busca apenas usuários cuja role seja 'USER' (Alunos) na mesma academia
        const students = await prisma.user.findMany({
          where: {
            gymId: userGymId,
            role: "USER",
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
          orderBy: {
            name: "asc",
          },
        });

        return reply.status(200).send(students);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  /**
   * REQUISITO 1: Endpoint para criar um novo Dono de Academia
   * Salva a conta do usuário diretamente com a role 'GYM_OWNER'
   */
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/dono",
    schema: {
      tags: ["Academia / Gestão"],
      summary: "Cadastra um novo Dono de Academia",
      description: "Cria uma conta de usuário com a role fixada como 'GYM_OWNER' para gerenciar unidades e treinos.",
      body: z.object({
        name: z.string().min(3, "Nome muito curto"),
        email: z.string().email("E-mail inválido"),
        password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
      }),
      response: {
        201: z.object({
          success: z.boolean(),
          user: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            role: z.string(),
          }),
        }),
        400: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const { name, email, password } = request.body;

        // Verifica se o usuário já existe para evitar duplicidade
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          return reply.status(400).send({
            error: "Este e-mail já está cadastrado no sistema.",
            code: "BAD_REQUEST",
          });
        }

        // Criando o usuário através do ecossistema do Better-Auth para garantir consistência de hash
        const user = await auth.api.signUpEmail({
          body: {
            name,
            email,
            password,
            role: "GYM_OWNER",
          },
        });

        if (!user) {
          return reply.status(500).send({
            error: "Erro ao processar o cadastro do usuário.",
            code: "INTERNAL_SERVER_ERROR",
          });
        }

        return reply.status(201).send({
          success: true,
          user: {
            id: user.user.id,
            name: user.user.name ?? "",
            email: user.user.email,
            role: (user.user as any).role ?? "GYM_OWNER",
          },
        });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          error: "Erro interno do servidor ao criar o dono da academia.",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  /**
   * REQUISITO 2: Dono de academia cadastra uma nova unidade física
   */
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Academia / Gestão"],
      summary: "Dono de academia cadastra uma nova unidade física",
      description: "Permite que um usuário autenticado com a role 'GYM_OWNER' registre uma nova academia no banco de dados.",
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
            code: "FORBIDDEN",
          });
        }

        const { name } = request.body;

        // Cria a unidade no PostgreSQL gerando um ID real automático
        const newGym = await prisma.gym.create({
          data: {
            name,
          },
        });

        // Vincula esse Dono à academia que ele acabou de criar
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

  /**
   * REQUISITO 3: Listar todas as academias ativas no sistema
   */
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Academia / Gestão"],
      summary: "Listar todas as academias ativas no sistema",
      description: "Retorna uma lista simples contendo o ID e o nome de todas as unidades registradas, útil para a seleção de novos usuários.",
      response: {
        200: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
          })
        ),
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const gyms = await prisma.gym.findMany({
          select: { id: true, name: true },
        });
        return gyms;
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Erro ao buscar a lista de academias", code: "INTERNAL_SERVER_ERROR" });
      }
    },
  });
};