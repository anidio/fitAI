import { PrismaPg } from "@prisma/adapter-pg";
import * as prismaPkg from "../generated/prisma/client.js";
const { PrismaClient } = prismaPkg;
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = prisma;
