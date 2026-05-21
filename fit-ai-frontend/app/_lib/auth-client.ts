import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Ao buscar direto do process.env no momento da execução, o Next.js é forçado a pegar o valor atualizado
  baseURL: typeof window === "undefined"
    ? (process.env.INTERNAL_API_URL || "http://backend:8081")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"),
});