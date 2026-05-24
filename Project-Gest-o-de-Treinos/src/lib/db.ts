import { PrismaPg } from "@prisma/adapter-pg";

import * as prismaPkg from "../generated/prisma/index.js";
const { PrismaClient } = prismaPkg;

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });

type PrismaClientType = InstanceType<typeof PrismaClient>;
const globalForPrisma = globalThis as unknown as { prisma: PrismaClientType };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
