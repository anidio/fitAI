import prismaPkg from "../src/generated/prisma/index.js";
const { PrismaClient } = prismaPkg;
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar templates existentes (opcional, para evitar duplicatas)
  await prisma.workoutPlan.deleteMany({ where: { isTemplate: true } });

  // Criar templates predefinidos
  const templates = [
    {
      name: "Força - Perna e Glúteo",
      description: "Plano focado em ganho de força nas pernas",
      isTemplate: true,
    },
    {
      name: "Hipertrofia - Peito e Costas",
      description: "Plano para ganho de massa muscular no tronco",
      isTemplate: true,
    },
    {
      name: "Resistência - Full Body",
      description: "Treino de corpo inteiro para resistência",
      isTemplate: true,
    },
    {
      name: "Emagrecimento - HIIT",
      description: "Treino de alta intensidade para queimar gordura",
      isTemplate: true,
    },
    {
      name: "Mobilidade e Flexibilidade",
      description: "Plano focado em mobilidade articular",
      isTemplate: true,
    },
  ];

  for (const template of templates) {
    const { description, ...templateData } = template;
    const created = await prisma.workoutPlan.create({
      data: {
        ...templateData,
        workoutDays: {
          create: [
            {
              name: "Segunda - Aquecimento",
              weekDay: "MONDAY",
              estimatedDurationInSeconds: 1800,
            },
            {
              name: "Terça - Principal",
              weekDay: "TUESDAY",
              estimatedDurationInSeconds: 2400,
            },
            {
              name: "Quarta - Descanso",
              weekDay: "WEDNESDAY",
              estimatedDurationInSeconds: 0,
              isRest: true,
            },
            {
              name: "Quinta - Principal",
              weekDay: "THURSDAY",
              estimatedDurationInSeconds: 2400,
            },
            {
              name: "Sexta - Finalização",
              weekDay: "FRIDAY",
              estimatedDurationInSeconds: 1800,
            },
          ],
        },
      },
    });
    console.log(`✅ Template criado: ${created.name}`);
  }

  console.log("✨ Seed completo!");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
