import { fromNodeHeaders } from "better-auth/node";
import { NotFoundError } from "../errors/index.js";
import { auth } from "../lib/auth.js";
import { ErrorSchema, StatsQuerySchema, StatsSchema, } from "../schemas/index.js";
import { GetStats } from "../usecases/get-stats.js";
export const statsRoutes = async (app) => {
    app.withTypeProvider().route({
        method: "GET",
        url: "/",
        schema: {
            tags: ["Stats"],
            summary: "Buscar estatísticas de treino do usuário",
            description: "Retorna dados de consistência, streak e tempo total de treino para o usuário autenticado.",
            querystring: StatsQuerySchema,
            response: {
                200: StatsSchema,
                401: ErrorSchema,
                404: ErrorSchema,
                500: ErrorSchema,
            },
        },
        handler: async (request, reply) => {
            const { from, to } = request.query;
            const { userId } = request;
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
                const getStats = new GetStats();
                const result = await getStats.execute({
                    userId: session.user.id,
                    from: request.query.from,
                    to: request.query.to,
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
