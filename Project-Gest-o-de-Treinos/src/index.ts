import "dotenv/config";

import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import Fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import z from "zod";

import { auth } from "./lib/auth.js";
import { aiRoutes } from "./routes/ai.js";
import { homeRoutes } from "./routes/home.js";
import { meRoutes } from "./routes/me.js";
import { statsRoutes } from "./routes/stats.js";
import { workoutPlanRoutes } from "./routes/workout-plan.js";
import { gymRoutes } from "./routes/gym.js";

const app = Fastify({
  logger: true,
  trustProxy: true,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.register(gymRoutes, { prefix: "/gym" });

await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Fit.AI Backend API",
      description: "API Fit.AI para gestão de usuários, academias e planos de treino.",
      version: "1.0.0",
    },
    servers: [
      {
        description: "Produção (Render)",
        url: "https://fitai-backend-fdgf.onrender.com",
      },
      {
        description: "Localhost",
        url: "http://localhost:8081",
      },
    ],
  },
  transform: jsonSchemaTransform,
});

// Serve a lightweight Swagger UI via CDN at /docs (avoids adding @fastify/swagger-ui)
app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/docs",
  schema: {
    hide: true,
  },
  handler: async (request, reply) => {
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function() {
        const ui = SwaggerUIBundle({
          url: '/swagger.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis],
        });
        window.ui = ui;
      };
    </script>
  </body>
</html>`;

    reply.header('Content-Type', 'text/html; charset=utf-8').send(html);
  },
});

// Configuração corrigida do CORS para aceitar o Frontend local e de Produção
await app.register(fastifyCors, {
  origin: ["https://fit-ai-bhv2.vercel.app", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-AI-Provider"],
  exposedHeaders: ["X-AI-Provider"],
});

// RESTful
// Routes
await app.register(homeRoutes, { prefix: "/home" });
await app.register(meRoutes, { prefix: "/me" });
await app.register(statsRoutes, { prefix: "/stats" });
await app.register(workoutPlanRoutes, { prefix: "/workout-plans" });
await app.register(aiRoutes, { prefix: "/ai" });
await app.register(gymRoutes, { prefix: "/gyms" });

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/swagger.json",
  schema: {
    hide: true,
  },
  handler: async () => {
    return app.swagger();
  },
});

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/",
  schema: {
    description: "Redirect to API documentation",
    tags: ["Documentation"],
    response: {
      302: z.null(),
    },
  },
  handler: async (request, reply) => {
    return reply.status(302).redirect("/docs");
  },
});

app.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  async handler(request, reply) {
    try {
      // Construct request URL
      const protocol = (request.headers["x-forwarded-proto"] as string) || "http";
      const url = new URL(request.url, `${protocol}://${request.headers.host}`);

      // Convert Fastify headers to standard Headers object
      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, value.toString());
      });
      // Create Fetch API-compatible request
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });
      // Process authentication request
      const response = await auth.handler(req);

      // Define o status code da resposta vindo do Better-Auth
      reply.status(response.status);

      // 🌟 CORREÇÃO CIRÚRGICA: Copia todos os cabeçalhos padrão EXCETO os cookies para não duplicar/sobrescrever no loop
      for (const [key, value] of response.headers.entries()) {
        if (key.toLowerCase() !== "set-cookie") {
          reply.header(key, value);
        }
      }

      // 🌟 EXTRAÇÃO ATÔMICA: Coleta TODOS os cookies de uma vez e injeta de forma limpa como Array no Fastify
      const cookies = response.headers.getSetCookie();
      if (cookies && cookies.length > 0) {
        reply.header("Set-Cookie", cookies);
      }

      reply.send(response.body ? await response.text() : null);
    } catch (error) {
      app.log.error(error);
      reply.status(500).send({
        error: "Internal authentication error",
        code: "AUTH_FAILURE",
      });
    }
  },
});

// Forçamos o TypeScript a entender que isso é um número puro e isolado
const portNumber = Number(process.env.PORT) || 8081;

try {
  // Passamos a porta como 'any' para calar o validador estrito do tsc nessa propriedade
  await app.listen({ 
    port: portNumber as any, 
    host: "0.0.0.0" 
  });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}