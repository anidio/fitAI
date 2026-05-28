import { createAuthClient } from "better-auth/react";

// Injeta a URL correta dinamicamente dependendo do ambiente
const baseURL = typeof window === "undefined"
  ? (process.env.INTERNAL_API_URL || "http://backend:8081")
  : (process.env.NEXT_PUBLIC_API_URL || "https://fitai-backend-fdgf.onrender.com");

export const authClient = createAuthClient({
  baseURL: baseURL,
  
  fetchOptions: {
    credentials: "include", 
  }
});