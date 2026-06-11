import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed focado em Planos de Treino e Exercícios...");

  // 1. Limpeza apenas das tabelas de treinos para evitar duplicidades no seed
  // Mantemos as tabelas de 'user', 'gym', 'account' intactas para o seu fluxo manual funcionar!
  await prisma.workoutPlan.deleteMany({
    where: { isTemplate: true },
  });

  // 2. Definição da massa de dados de treinos estruturados e completos
  const templates = [
    {
      name: "Hipertrofia ABC - Avançado",
      description: "Foco em ganho de massa muscular e força geral com divisões bem estruturadas.",
      workoutDays: [
        {
          name: "Treino A - Peito e Tríceps",
          weekDay: "MONDAY",
          estimatedDurationInSeconds: 3000,
          isRest: false,
          exercises: [
            { name: "Supino Reto com Barra", order: 1, sets: 4, reps: 10, restTimeInSeconds: 60 },
            { name: "Supino Inclinado com Halteres", order: 2, sets: 4, reps: 12, restTimeInSeconds: 60 },
            { name: "Tríceps Pulley (Corda)", order: 3, sets: 3, reps: 15, restTimeInSeconds: 45 },
            { name: "Tríceps Testa com Barra W", order: 4, sets: 3, reps: 12, restTimeInSeconds: 45 },
          ]
        },
        {
          name: "Treino B - Costas e Bíceps",
          weekDay: "TUESDAY",
          estimatedDurationInSeconds: 3200,
          isRest: false,
          exercises: [
            { name: "Puxada Alta na Polia", order: 1, sets: 4, reps: 10, restTimeInSeconds: 60 },
            { name: "Remada Baixa Sentada", order: 2, sets: 4, reps: 12, restTimeInSeconds: 60 },
            { name: "Rosca Direta com Barra", order: 3, sets: 3, reps: 12, restTimeInSeconds: 45 },
            { name: "Rosca Martelo Alternada", order: 4, sets: 3, reps: 12, restTimeInSeconds: 45 },
          ]
        },
        {
          name: "Recuperação Ativa (Cardio)",
          weekDay: "WEDNESDAY",
          estimatedDurationInSeconds: 1200,
          isRest: true,
          exercises: []
        },
        {
          name: "Treino C - Pernas Completo",
          weekDay: "THURSDAY",
          estimatedDurationInSeconds: 3600,
          isRest: false,
          exercises: [
            { name: "Agachamento Livre com Barra", order: 1, sets: 4, reps: 10, restTimeInSeconds: 90 },
            { name: "Leg Press 45 Graus", order: 2, sets: 4, reps: 12, restTimeInSeconds: 60 },
            { name: "Cadeira Extensora", order: 3, sets: 3, reps: 15, restTimeInSeconds: 45 },
            { name: "Mesa Flexora", order: 4, sets: 3, reps: 12, restTimeInSeconds: 45 },
          ]
        },
        {
          name: "Treino D - Ombros e Abdômen",
          weekDay: "FRIDAY",
          estimatedDurationInSeconds: 2700,
          isRest: false,
          exercises: [
            { name: "Desenvolvimento com Halteres", order: 1, sets: 4, reps: 10, restTimeInSeconds: 60 },
            { name: "Elevação Lateral na Polia", order: 2, sets: 4, reps: 12, restTimeInSeconds: 45 },
            { name: "Abdominal Infra na Paralela", order: 3, sets: 4, reps: 20, restTimeInSeconds: 30 },
          ]
        },
        {
          name: "Descanso Geral",
          weekDay: "SATURDAY",
          estimatedDurationInSeconds: 0,
          isRest: true,
          exercises: []
        },
        {
          name: "Descanso Geral",
          weekDay: "SUNDAY",
          estimatedDurationInSeconds: 0,
          isRest: true,
          exercises: []
        }
      ]
    },
    {
      name: "Emagrecimento e Definição HIIT",
      description: "Treino de alta intensidade com foco metabólico e queima de gordura.",
      workoutDays: [
        {
          name: "Full Body Funcional",
          weekDay: "MONDAY",
          estimatedDurationInSeconds: 2400,
          isRest: false,
          exercises: [
            { name: "Burpees", order: 1, sets: 4, reps: 15, restTimeInSeconds: 30 },
            { name: "Agachamento Salto", order: 2, sets: 4, reps: 20, restTimeInSeconds: 30 },
            { name: "Flexão de Braço", order: 3, sets: 4, reps: 12, restTimeInSeconds: 30 },
          ]
        },
        {
          name: "Cardio de Alta Intensidade (HIIT)",
          weekDay: "TUESDAY",
          estimatedDurationInSeconds: 1800,
          isRest: false,
          exercises: [
            { name: "Corrida na Esteira (Tiro)", order: 1, sets: 8, reps: 1, restTimeInSeconds: 45 },
            { name: "Polichinelos", order: 2, sets: 4, reps: 50, restTimeInSeconds: 20 },
          ]
        },
        {
          name: "Descanso",
          weekDay: "WEDNESDAY",
          estimatedDurationInSeconds: 0,
          isRest: true,
          exercises: []
        },
        {
          name: "Metabólico - Membros Superiores",
          weekDay: "THURSDAY",
          estimatedDurationInSeconds: 2400,
          isRest: false,
          exercises: [
            { name: "Desenvolvimento Halteres Speed", order: 1, sets: 3, reps: 15, restTimeInSeconds: 30 },
            { name: "Remada Curvada Halteres", order: 2, sets: 3, reps: 15, restTimeInSeconds: 30 },
          ]
        },
        {
          name: "Metabólico - Membros Inferiores",
          weekDay: "FRIDAY",
          estimatedDurationInSeconds: 2400,
          isRest: false,
          exercises: [
            { name: "Afundo com Halteres", order: 1, sets: 3, reps: 15, restTimeInSeconds: 30 },
            { name: "Stiff com Halteres", order: 2, sets: 3, reps: 15, restTimeInSeconds: 30 },
          ]
        },
        {
          name: "Descanso",
          weekDay: "SATURDAY",
          estimatedDurationInSeconds: 0,
          isRest: true,
          exercises: []
        },
        {
          name: "Descanso",
          weekDay: "SUNDAY",
          estimatedDurationInSeconds: 0,
          isRest: true,
          exercises: []
        }
      ]
    },
    {
      name: "Treino Funcional e Cardio - Iniciante",
      description: "Treino focado em mobilidade, fortalecimento geral e condicionamento cardiovascular básico.",
      workoutDays: [
        {
          name: "Core e Mobilidade",
          weekDay: "MONDAY",
          estimatedDurationInSeconds: 1800,
          isRest: false,
          exercises: [
            { name: "Prancha Frontal", order: 1, sets: 3, reps: 30, restTimeInSeconds: 45 },
            { name: "Perdigueiro Estático", order: 2, sets: 3, reps: 12, restTimeInSeconds: 30 },
            { name: "Alongamento Dinâmico de Quadril", order: 3, sets: 2, reps: 10, restTimeInSeconds: 30 },
          ]
        },
        {
          name: "Fortalecimento Geral Pernas",
          weekDay: "TUESDAY",
          estimatedDurationInSeconds: 2000,
          isRest: false,
          exercises: [
            { name: "Agachamento Peso Corporal", order: 1, sets: 3, reps: 15, restTimeInSeconds: 45 },
            { name: "Elevação Pélvica Solo", order: 2, sets: 3, reps: 15, restTimeInSeconds: 45 },
            { name: "Passada Alternada Recuo", order: 3, sets: 3, reps: 12, restTimeInSeconds: 45 },
          ]
        },
        {
          name: "Descanso Ativo",
          weekDay: "WEDNESDAY",
          estimatedDurationInSeconds: 0,
          isRest: true,
          exercises: []
        },
        {
          name: "Fortalecimento Geral Superiores",
          weekDay: "THURSDAY",
          estimatedDurationInSeconds: 2000,
          isRest: false,
          exercises: [
            { name: "Flexão de Braço com Joelhos Apoiados", order: 1, sets: 3, reps: 10, restTimeInSeconds: 45 },
            { name: "Remada com Faixa Elástica", order: 2, sets: 3, reps: 15, restTimeInSeconds: 45 },
            { name: "Abdução de Ombros Sem Peso", order: 3, sets: 3, reps: 15, restTimeInSeconds: 30 },
          ]
        },
        {
          name: "Cardio de Baixo Impacto",
          weekDay: "FRIDAY",
          estimatedDurationInSeconds: 1800,
          isRest: false,
          exercises: [
            { name: "Caminhada Rápida", order: 1, sets: 1, reps: 1, restTimeInSeconds: 0 },
            { name: "Alongamento Geral de Cadeia Posterior", order: 2, sets: 2, reps: 1, restTimeInSeconds: 0 },
          ]
        },
        {
          name: "Descanso Geral",
          weekDay: "SATURDAY",
          estimatedDurationInSeconds: 0,
          isRest: true,
          exercises: []
        },
        {
          name: "Descanso Geral",
          weekDay: "SUNDAY",
          estimatedDurationInSeconds: 0,
          isRest: true,
          exercises: []
        }
      ]
    },
    {
      name: "Powerlifting / Força de Elite (5x5)",
      description: "Treino de força bruta baseado no método 5x5 para os grandes levantamentos.",
      workoutDays: [
        {
          name: "Dia de Força A",
          weekDay: "MONDAY",
          estimatedDurationInSeconds: 3600,
          isRest: false,
          exercises: [
            { name: "Agachamento Livre", order: 1, sets: 5, reps: 5, restTimeInSeconds: 120 },
            { name: "Supino Reto com Barra", order: 2, sets: 5, reps: 5, restTimeInSeconds: 120 },
            { name: "Remada Curvada com Barra", order: 3, sets: 5, reps: 5, restTimeInSeconds: 90 },
          ]
        },
        {
          name: "Descanso",
          weekDay: "TUESDAY",
          estimatedDurationInSeconds: 0,
          isRest: true,
          exercises: []
        },
        {
          name: "Dia de Força B",
          weekDay: "WEDNESDAY",
          estimatedDurationInSeconds: 3600,
          isRest: false,
          exercises: [
            { name: "Agachamento Livre", order: 1, sets: 5, reps: 5, restTimeInSeconds: 120 },
            { name: "Desenvolvimento Militar em Pé", order: 2, sets: 5, reps: 5, restTimeInSeconds: 120 },
            { name: "Levantamento Terra", order: 3, sets: 1, reps: 5, restTimeInSeconds: 180 },
          ]
        },
        {
          name: "Descanso",
          weekDay: "THURSDAY",
          estimatedDurationInSeconds: 0,
          isRest: true,
          exercises: []
        },
        {
          name: "Dia de Força A",
          weekDay: "FRIDAY",
          estimatedDurationInSeconds: 3600,
          isRest: false,
          exercises: [
            { name: "Agachamento Livre", order: 1, sets: 5, reps: 5, restTimeInSeconds: 120 },
            { name: "Supino Reto com Barra", order: 2, sets: 5, reps: 5, restTimeInSeconds: 120 },
            { name: "Remada Curvada com Barra", order: 3, sets: 5, reps: 5, restTimeInSeconds: 90 },
          ]
        },
        {
          name: "Descanso Geral",
          weekDay: "SATURDAY",
          estimatedDurationInSeconds: 0,
          isRest: true,
          exercises: []
        },
        {
          name: "Descanso Geral",
          weekDay: "SUNDAY",
          estimatedDurationInSeconds: 0,
          isRest: true,
          exercises: []
        }
      ]
    },
    {
      name: "Pilates, Mobilidade e Core",
      description: "Melhora da flexibilidade, postura e fortalecimento do powerhouse corporal.",
      workoutDays: [
        {
          name: "Powerhouse e Centro",
          weekDay: "MONDAY",
          estimatedDurationInSeconds: 2100,
          isRest: false,
          exercises: [
            { name: "The Hundred (Pilates)", order: 1, sets: 1, reps: 100, restTimeInSeconds: 30 },
            { name: "Roll Up", order: 2, sets: 3, reps: 10, restTimeInSeconds: 30 },
            { name: "Single Leg Stretch", order: 3, sets: 3, reps: 12, restTimeInSeconds: 30 },
          ]
        },
        {
          name: "Postura e Cadeia Posterior",
          weekDay: "TUESDAY",
          estimatedDurationInSeconds: 2100,
          isRest: false,
          exercises: [
            { name: "Spine Stretch", order: 1, sets: 3, reps: 10, restTimeInSeconds: 30 },
            { name: "The Saw", order: 2, sets: 3, reps: 10, restTimeInSeconds: 30 },
            { name: "Swan Dive Leve", order: 3, sets: 3, reps: 8, restTimeInSeconds: 45 },
          ]
        },
        {
          name: "Descanso",
          weekDay: "WEDNESDAY",
          estimatedDurationInSeconds: 0,
          isRest: true,
          exercises: []
        },
        {
          name: "Estabilização e Glúteos",
          weekDay: "THURSDAY",
          estimatedDurationInSeconds: 2100,
          isRest: false,
          exercises: [
            { name: "Side Kick Series (Chute Lateral)", order: 1, sets: 2, reps: 15, restTimeInSeconds: 30 },
            { name: "Shoulder Bridge (Ponte)", order: 2, sets: 3, reps: 12, restTimeInSeconds: 30 },
          ]
        },
        {
          name: "Coluna Flexível",
          weekDay: "FRIDAY",
          estimatedDurationInSeconds: 2100,
          isRest: false,
          exercises: [
            { name: "Cat Cow Dinâmico", order: 1, sets: 3, reps: 12, restTimeInSeconds: 30 },
            { name: "Pilates Swimming", order: 2, sets: 3, reps: 15, restTimeInSeconds: 30 },
            { name: "Postura da Criança (Alongamento)", order: 3, sets: 1, reps: 1, restTimeInSeconds: 0 },
          ]
        },
        {
          name: "Descanso Geral",
          weekDay: "SATURDAY",
          estimatedDurationInSeconds: 0,
          isRest: true,
          exercises: []
        },
        {
          name: "Descanso Geral",
          weekDay: "SUNDAY",
          estimatedDurationInSeconds: 0,
          isRest: true,
          exercises: []
        }
      ]
    }
  ];

  // 3. Salvando os templates e construindo aninhamento completo (Planos -> Dias -> Exercícios)
  for (const template of templates) {
    const createdTemplate = await prisma.workoutPlan.create({
      data: {
        name: template.name,
        description: template.description,
        isTemplate: true,
        gymId: null,      // Deixamos global para qualquer personal/academia listar
        creatorId: null,  // Disponível universalmente no sistema
        workoutDays: {
          create: template.workoutDays.map((day) => ({
            name: day.name,
            weekDay: day.weekDay as any,
            estimatedDurationInSeconds: day.estimatedDurationInSeconds,
            isRest: day.isRest,
            exercises: {
              create: day.exercises.map((ex) => ({
                name: ex.name,
                order: ex.order,
                sets: ex.sets,
                reps: ex.reps,
                restTimeInSeconds: ex.restTimeInSeconds,
              })),
            },
          })),
        },
      },
    });
    console.log(`✅ Template operacional estruturado: ${createdTemplate.name}`);
  }

  console.log("✨ Seed focado em treinos e exercícios concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante a execução do seed de treinos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });