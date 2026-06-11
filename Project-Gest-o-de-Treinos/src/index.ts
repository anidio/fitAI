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

// Registros de rotas
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

// Docs e Redirecionamentos
app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/docs",
  schema: { hide: true },
  handler: async (request, reply) => {
    const html = `<!doctype html><html><head><meta charset="utf-8" /><title>API Docs</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css" /></head><body><div id="swagger-ui"></div><script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js"></script><script>window.onload = function() { SwaggerUIBundle({ url: '/swagger.json', dom_id: '#swagger-ui', deepLinking: true, presets: [SwaggerUIBundle.presets.apis] }); };</script></body></html>`;
    reply.header('Content-Type', 'text/html; charset=utf-8').send(html);
  },
});

await app.register(fastifyCors, {
  origin: (origin, cb) => {
    const allowedOrigins = ["https://fit-ai-bhv2.vercel.app", "http://localhost:3000", process.env.NEXT_PUBLIC_APP_URL || ""];
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-AI-Provider"],
  exposedHeaders: ["X-AI-Provider"],
});

await app.register(homeRoutes, { prefix: "/home" });
await app.register(meRoutes, { prefix: "/me" });
await app.register(statsRoutes, { prefix: "/stats" });
await app.register(workoutPlanRoutes, { prefix: "/workout-plans" });
await app.register(aiRoutes, { prefix: "/ai" });
await app.register(gymRoutes, { prefix: "/gyms" });

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/swagger.json",
  schema: { hide: true },
  handler: async () => app.swagger(),
});

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/",
  schema: { response: { 302: z.null() } },
  handler: async (request, reply) => reply.status(302).redirect("/docs"),
});

// Rota Curinga de Autenticação
app.route({
  method: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  url: "/api/auth/*",
  async handler(request, reply) {
    const origin = request.headers.origin;
    const allowedOrigins = ["https://fit-ai-bhv2.vercel.app", "http://localhost:3000", process.env.NEXT_PUBLIC_APP_URL || ""];
    
    if (origin && allowedOrigins.includes(origin)) {
      reply.header("Access-Control-Allow-Origin", origin);
      reply.header("Access-Control-Allow-Credentials", "true");
      reply.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, X-AI-Provider");
    }

    if (request.method === "OPTIONS") {
      return reply.status(204).send();
    }

    const protocol = (request.headers["x-forwarded-proto"] as string) || "http";
    const url = new URL(request.url, `${protocol}://${request.headers.host}`);

    const headers = new Headers();
    Object.entries(request.headers).forEach(([key, value]) => {
      if (value && key !== "host") {
        if (Array.isArray(value)) {
          value.forEach(v => headers.append(key, v));
        } else {
          headers.set(key, value.toString());
        }
      }
    });

    // [CORRIGIDO] Garante que o body está correto para better-auth
    let reqBody: BodyInit | null = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      if (typeof request.body === "object" && request.body !== null) {
        // Se Fastify já parseou o body, stringifica de volta para JSON
        reqBody = JSON.stringify(request.body);
        headers.set("Content-Type", "application/json");
      } else {
        reqBody = request.body as BodyInit;
      }
    }

    const req = new Request(url.toString(), {
      method: request.method,
      headers,
      body: reqBody,
    });

    const response = await auth.handler(req);

    reply.status(response.status);
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() !== "set-cookie") {
        reply.header(key, value);
      }
    }

    // [CORRIGIDO] Para Render/Vercel: adiciona cada cookie individualmente
    const cookies = response.headers.getSetCookie();
    if (cookies && cookies.length > 0) {
      for (const cookie of cookies) {
        // Ajusta o cookie para produção
        let adjustedCookie = cookie;
        if (process.env.NODE_ENV === "production") {
          // Garante SameSite=None; Secure para Vercel/Render
          if (!adjustedCookie.includes("SameSite")) {
            adjustedCookie += "; SameSite=None; Secure";
          } else if (adjustedCookie.includes("SameSite=Lax") || adjustedCookie.includes("SameSite=Strict")) {
            adjustedCookie = adjustedCookie.replace(/SameSite=(Lax|Strict)/, "SameSite=None");
            if (!adjustedCookie.includes("Secure")) {
              adjustedCookie += "; Secure";
            }
          }
        }
        reply.header("Set-Cookie", adjustedCookie);
      }
    }

    // Lê o corpo da resposta do better-auth
    const responseBody = await response.text();
    reply.send(responseBody);
  },
});

const portNumber = Number(process.env.PORT) || 8081;

try {
  await app.listen({ port: portNumber as any, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}