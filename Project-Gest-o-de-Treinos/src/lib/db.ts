import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client"; // Importação universal e segura

const connectionString = `${process.env.DATABASE_URL}`;

// Cria o pool do pg que o adaptador do Prisma necessita
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Tipagem e verificação do escopo global de forma limpa para o TypeScript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;