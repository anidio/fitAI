import crypto from "node:crypto";
import { NotFoundError } from "../errors/index.js";
import { WeekDay } from "../generated/prisma/index.js";
import { prisma } from "../lib/db.js";

// Data Transfer Object
interface InputDto {
  userId?: string;
  pendingEmail?: string;
  creatorId?: string;
  name: string;
  workoutDays: Array<{
    name: string;
    weekDay: WeekDay;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    coverImageUrl?: string;
    exercises: Array<{
      order: number;
      name: string;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }>;
  }>;
}

interface OutputDto {
  id: string;
  name: string;
  workoutDays: Array<{
    name: string;
    weekDay: WeekDay;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    coverImageUrl?: string;
    exercises: Array<{
      order: number;
      name: string;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }>;
  }>;
}

export class CreateWorkoutPlan {
  async execute(dto: InputDto): Promise<OutputDto> {
    let finalUserId = dto.userId;

    // Se tiver pendingEmail mas não tiver userId, tentamos encontrar o usuário pelo e-mail
    if (!finalUserId && dto.pendingEmail) {
      const user = await prisma.user.findUnique({
        where: { email: dto.pendingEmail },
      });
      if (user) {
        finalUserId = user.id;
      }
    }

    // Buscamos o plano ativo do usuário (se houver usuário vinculado)
    const existingWorkoutPlan = finalUserId 
      ? await prisma.workoutPlan.findFirst({
          where: {
            userId: finalUserId,
            isActive: true,
          },
        })
      : null;

    // Transaction - Atomicidade
    return prisma.$transaction(async (tx) => {
      if (existingWorkoutPlan) {
        await tx.workoutPlan.update({
          where: { id: existingWorkoutPlan.id },
          data: { isActive: false },
        });
      }

      const workoutPlan = await tx.workoutPlan.create({
        data: {
          id: crypto.randomUUID(),
          name: dto.name,
          userId: finalUserId,
          pendingEmail: finalUserId ? null : dto.pendingEmail,
          creatorId: dto.creatorId,
          isActive: true,
          workoutDays: {
            create: dto.workoutDays.map((workoutDay: InputDto["workoutDays"][number]) => ({
              name: workoutDay.name,
              weekDay: workoutDay.weekDay,
              isRest: workoutDay.isRest,
              estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
              coverImageUrl: workoutDay.coverImageUrl,
              exercises: {
                create: workoutDay.exercises.map(
                  (exercise: InputDto["workoutDays"][number]["exercises"][number]) => ({
                    name: exercise.name,
                    order: exercise.order,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    restTimeInSeconds: exercise.restTimeInSeconds,
                  }),
                ),
              },
            })),
          },
        },
      });

      const result = await tx.workoutPlan.findUnique({
        where: { id: workoutPlan.id },
        include: {
          workoutDays: {
            include: {
              exercises: true,
            },
          },
        },
      });

      if (!result) {
        throw new NotFoundError("Workout plan not found");
      }

      return {
        id: result.id,
        name: result.name,
        workoutDays: result.workoutDays.map(
          (day: any) => ({
            name: day.name,
            weekDay: day.weekDay,
            isRest: day.isRest,
            estimatedDurationInSeconds: day.estimatedDurationInSeconds,
            coverImageUrl: day.coverImageUrl ?? undefined,
            exercises: day.exercises.map(
              (exercise: any) => ({
                order: exercise.order,
                name: exercise.name,
                sets: exercise.sets,
                reps: exercise.reps,
                restTimeInSeconds: exercise.restTimeInSeconds,
              }),
            ),
          }),
        ),
      };
    });
  }
}
