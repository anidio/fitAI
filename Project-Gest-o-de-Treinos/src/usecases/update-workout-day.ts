import { Prisma } from "@prisma/client";
import { NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  workoutDayId: string;
  name?: string;
  isRest?: boolean;
  exercises?: Array<{
    name: string;
    sets: number;
    reps: number;
    restTimeInSeconds: number;
    order: number;
  }>;
}

export class UpdateWorkoutDay {
  async execute(dto: InputDto) {
    const workoutDay = await prisma.workoutDay.findUnique({
      where: { id: dto.workoutDayId },
      include: { workoutPlan: true },
    });

    if (!workoutDay || workoutDay.workoutPlan.userId !== dto.userId) {
      throw new NotFoundError("Workout day not found or unauthorized");
    }

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Se houver novos exercícios, remove os antigos e insere os novos
      if (dto.exercises) {
        await tx.workoutExercise.deleteMany({
          where: { workoutDayId: dto.workoutDayId },
        });

        if (dto.exercises.length > 0) {
          await tx.workoutExercise.createMany({
            data: dto.exercises.map((ex) => ({
              ...ex,
              workoutDayId: dto.workoutDayId,
            })),
          });
        }
      }

      // Atualiza os dados básicos do dia
      return await tx.workoutDay.update({
        where: { id: dto.workoutDayId },
        data: {
          name: dto.name ?? workoutDay.name,
          isRest: dto.isRest ?? workoutDay.isRest,
        },
        include: {
          exercises: { orderBy: { order: "asc" } },
        },
      });
    });
  }
}
