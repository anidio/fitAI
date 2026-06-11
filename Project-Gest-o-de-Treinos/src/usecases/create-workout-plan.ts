import crypto from "node:crypto";
import { NotFoundError } from "../errors/index.js";
import { WeekDay } from "@prisma/client"; // Importação universal limpa
import { prisma } from "../lib/db.js";

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

    if (!finalUserId && dto.pendingEmail) {
      const user = await prisma.user.findUnique({
        where: { email: dto.pendingEmail?.toLowerCase().trim() },
      });
      if (user) {
        finalUserId = user.id;
      }
    }

    const existingWorkoutPlan = finalUserId 
      ? await prisma.workoutPlan.findFirst({
          where: {
            userId: finalUserId,
            isActive: true,
          },
        })
      : null;

    const existingPendingPlan = (!finalUserId && dto.pendingEmail)
      ? await prisma.workoutPlan.findFirst({
          where: {
            pendingEmail: dto.pendingEmail?.toLowerCase().trim(),
            isActive: true,
          },
        })
      : null;

    return prisma.$transaction(async (tx) => {
      if (existingWorkoutPlan) {
        await tx.workoutPlan.update({
          where: { id: existingWorkoutPlan.id },
          data: { isActive: false },
        });
      }

      if (existingPendingPlan) {
        await tx.workoutPlan.update({
          where: { id: existingPendingPlan.id },
          data: { isActive: false },
        });
      }

      const workoutPlan = await tx.workoutPlan.create({
        data: {
          id: crypto.randomUUID(),
          name: dto.name,
          userId: finalUserId,
          pendingEmail: finalUserId ? null : dto.pendingEmail?.toLowerCase().trim(),
          creatorId: dto.creatorId,
          isActive: true,
          workoutDays: {
            create: mapWorkoutDays(dto.workoutDays), // [CORRIGIDO AQUI] Chamando a função certa
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
        workoutDays: result.workoutDays.map((day) => ({
          name: day.name,
          weekDay: day.weekDay as WeekDay,
          isRest: day.isRest,
          estimatedDurationInSeconds: day.estimatedDurationInSeconds,
          coverImageUrl: day.coverImageUrl ?? undefined,
          exercises: day.exercises.map((exercise) => ({
            order: exercise.order,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            restTimeInSeconds: exercise.restTimeInSeconds,
          })),
        })),
      };
    });
  }
}

// Função auxiliar universal para mapear os dias e exercícios
function mapWorkoutDays(days: InputDto["workoutDays"]) {
  return days.map((day) => ({
    name: day.name,
    weekDay: day.weekDay,
    isRest: day.isRest,
    estimatedDurationInSeconds: day.estimatedDurationInSeconds,
    coverImageUrl: day.coverImageUrl,
    exercises: {
      create: day.exercises.map((ex) => ({
        name: ex.name,
        order: ex.order,
        sets: ex.sets,
        reps: ex.reps,
        restTimeInSeconds: ex.restTimeInSeconds,
      })),
    },
  }));
}