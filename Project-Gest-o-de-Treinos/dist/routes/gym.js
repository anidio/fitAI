import { fromNodeHeaders } from "better-auth/node";
import z from "zod";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/db.js";
export const gymRoutes = async (app) => {
    // 1. ENDPOINT: Listar todos os alunos vinculados à mesma academia do Personal/Dono
    app.get("/students", {
        schema: {
            tags: ["Gym B2B"],
            summary: "Listar alunos da academia",
            description: "Retorna a lista de alunos vinculados à mesma academia do usuário autenticado.",
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
            const userGymId = session.user.gymId;
            const userRole = session.user.role;
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
                    workoutPlans: {
                        select: {
                            id: true,
                            name: true,
                            isActive: true,
                        },
                    },
                },
                orderBy: {
                    name: "asc",
                },
            });
            return reply.status(200).send(students);
        }
        catch (error) {
            app.log.error(error);
            return reply.status(500).send({
                error: "Internal server error",
                code: "INTERNAL_SERVER_ERROR",
            });
        }
    });
    /**
     * REQUISITO 1: Endpoint para criar um novo Dono de Academia
     * Salva a conta do usuário diretamente com a role 'GYM_OWNER'
     */
    app.post("/dono", {
        schema: {
            tags: ["Academia / Gestão"],
            summary: "Cadastra um novo Dono de Academia",
            description: "Cria uma conta de usuário com a role fixada como 'GYM_OWNER' para gerenciar unidades e treinos.",
        }
    }, async (request, reply) => {
        try {
            const body = request.body;
            if (!body || !body.name || !body.email || !body.password) {
                return reply.status(400).send({
                    error: "Campos obrigatórios ausentes (name, email, password).",
                    code: "BAD_REQUEST",
                });
            }
            const { name, email, password } = body;
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
                    role: user.user.role ?? "GYM_OWNER",
                },
            });
        }
        catch (error) {
            app.log.error(error);
            return reply.status(500).send({
                error: "Erro interno do servidor ao criar o dono da academia.",
                code: "INTERNAL_SERVER_ERROR",
            });
        }
    });
    /**
     * REQUISITO 2: Dono de academia cadastra uma nova unidade física (BLINDADO)
     */
    /**
     * REQUISITO 2: Dono de academia cadastra uma nova unidade física (BLINDADO)
     */
    app.post("/", {
        schema: {
            tags: ["Academia / Gestão"],
            summary: "Dono de academia cadastra uma nova unidade física",
            description: "Permite que um usuário autenticado com a role 'GYM_OWNER' registre uma nova academia no banco de dados.",
        }
    }, async (request, reply) => {
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(request.headers),
            });
            if (!session || !session.user) {
                return reply.status(401).send({ error: "Não autorizado", code: "UNAUTHORIZED" });
            }
            // 1. SEGURANÇA: Buscar o usuário direto no banco para garantir que temos a role real atualizada
            const dbUser = await prisma.user.findUnique({
                where: { id: session.user.id }
            });
            if (!dbUser) {
                return reply.status(401).send({ error: "Usuário não encontrado no sistema", code: "UNAUTHORIZED" });
            }
            if (dbUser.role !== "GYM_OWNER") {
                return reply.status(403).send({
                    error: "Apenas donos de academia podem registrar unidades corporativas",
                    code: "FORBIDDEN",
                });
            }
            // 2. VALIDAÇÃO MANUAL: Validamos o body de forma isolada
            const body = request.body;
            if (!body || !body.name || body.name.trim().length < 3) {
                return reply.status(400).send({
                    error: "Nome da unidade muito curto ou inválido (mínimo 3 caracteres).",
                    code: "BAD_REQUEST"
                });
            }
            const { name } = body;
            // 3. Cria a unidade no banco e vincula o ownerId
            const newGym = await prisma.gym.create({
                data: {
                    name,
                    ownerId: session.user.id,
                },
            });
            return reply.status(201).send({
                success: true,
                gym: { id: newGym.id, name: newGym.name }
            });
        }
        catch (error) {
            app.log.error(error);
            return reply.status(500).send({
                error: "Erro interno do servidor ao registrar unidade",
                code: "INTERNAL_SERVER_ERROR"
            });
        }
    });
    /**
     * REQUISITO NOVO: Listar academias do dono logado
     */
    app.get("/owner", {
        schema: {
            tags: ["Academia / Gestão"],
            summary: "Listar academias pertencentes ao dono logado",
            description: "Retorna a lista de todas as academias registradas pelo dono autenticado.",
        }
    }, async (request, reply) => {
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(request.headers),
            });
            if (!session || !session.user) {
                return reply.status(401).send({ error: "Não autorizado", code: "UNAUTHORIZED" });
            }
            const dbUser = await prisma.user.findUnique({
                where: { id: session.user.id }
            });
            if (!dbUser || dbUser.role !== "GYM_OWNER") {
                return reply.status(403).send({ error: "Não autorizado", code: "FORBIDDEN" });
            }
            const gyms = await prisma.gym.findMany({
                where: { ownerId: session.user.id },
                select: { id: true, name: true, createdAt: true },
                orderBy: { name: "asc" }
            });
            return reply.status(200).send(gyms);
        }
        catch (error) {
            app.log.error(error);
            return reply.status(500).send({ error: "Erro ao buscar academias do proprietário", code: "INTERNAL_SERVER_ERROR" });
        }
    });
    /**
     * REQUISITO NOVO: Editar nome da academia (Apenas Dono)
     */
    app.put("/:id", {
        schema: {
            tags: ["Academia / Gestão"],
            summary: "Editar nome de uma academia",
            description: "Permite ao dono de uma academia editar o nome da unidade correspondente.",
            params: z.object({
                id: z.string(),
            }),
        }
    }, async (request, reply) => {
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(request.headers),
            });
            if (!session || !session.user) {
                return reply.status(401).send({ error: "Não autorizado", code: "UNAUTHORIZED" });
            }
            const { id } = request.params;
            const body = request.body;
            if (!body || !body.name || body.name.trim().length < 3) {
                return reply.status(400).send({
                    error: "Nome da unidade inválido (mínimo 3 caracteres).",
                    code: "BAD_REQUEST"
                });
            }
            // Verifica propriedade
            const gym = await prisma.gym.findUnique({
                where: { id },
            });
            if (!gym) {
                return reply.status(404).send({ error: "Academia não encontrada", code: "NOT_FOUND" });
            }
            if (gym.ownerId !== session.user.id) {
                return reply.status(403).send({ error: "Você não tem permissão para editar esta academia", code: "FORBIDDEN" });
            }
            const updatedGym = await prisma.gym.update({
                where: { id },
                data: { name: body.name.trim() },
            });
            return reply.status(200).send({ success: true, gym: updatedGym });
        }
        catch (error) {
            app.log.error(error);
            return reply.status(500).send({ error: "Erro ao atualizar nome da academia", code: "INTERNAL_SERVER_ERROR" });
        }
    });
    /**
     * REQUISITO NOVO: Excluir uma academia (Apenas Dono)
     */
    app.delete("/:id", {
        schema: {
            tags: ["Academia / Gestão"],
            summary: "Excluir uma academia",
            description: "Permite ao dono de uma academia excluir a unidade correspondente.",
            params: z.object({
                id: z.string(),
            }),
        }
    }, async (request, reply) => {
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(request.headers),
            });
            if (!session || !session.user) {
                return reply.status(401).send({ error: "Não autorizado", code: "UNAUTHORIZED" });
            }
            const { id } = request.params;
            // Verifica propriedade
            const gym = await prisma.gym.findUnique({
                where: { id },
            });
            if (!gym) {
                return reply.status(404).send({ error: "Academia não encontrada", code: "NOT_FOUND" });
            }
            if (gym.ownerId !== session.user.id) {
                return reply.status(403).send({ error: "Você não tem permissão para excluir esta academia", code: "FORBIDDEN" });
            }
            await prisma.gym.delete({
                where: { id },
            });
            return reply.status(200).send({ success: true, message: "Academia excluída com sucesso" });
        }
        catch (error) {
            app.log.error(error);
            return reply.status(500).send({ error: "Erro ao excluir academia", code: "INTERNAL_SERVER_ERROR" });
        }
    });
    /**
     * REQUISITO 3: Listar todas as academias ativas no sistema (BLINDADO)
     */
    app.get("/", {
        schema: {
            tags: ["Academia / Gestão"],
            summary: "Listar todas as academias ativas no sistema",
            description: "Retorna uma lista simples contendo o ID e o nome de todas as unidades registradas, útil para a seleção de novos usuários.",
        }
    }, async (request, reply) => {
        try {
            const gyms = await prisma.gym.findMany({
                select: { id: true, name: true },
                orderBy: { name: "asc" }
            });
            return reply.status(200).send(gyms);
        }
        catch (error) {
            app.log.error(error);
            return reply.status(500).send({ error: "Erro ao buscar a lista de academias", code: "INTERNAL_SERVER_ERROR" });
        }
    });
};
