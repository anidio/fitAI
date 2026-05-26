import z from "zod";

import { WeekDay } from "@prisma/client";

export const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
});

export const MessageErrorSchema = ErrorSchema.extend({
  message: z.string().optional(),
});

export const StartWorkoutSessionSchema = z.object({
  userWorkoutSessionId: z.string().uuid(),
});

export const UpdateWorkoutSessionBodySchema = z.object({
  completedAt: z.string().datetime(),
});

export const UpdateWorkoutSessionSchema = z.object({
  id: z.string().uuid(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
});

export const StatsQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export const StatsSchema = z.object({
  workoutStreak: z.number(),
  consistencyByDay: z.record(
    z.string().datetime(),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean(),
    }),
  ),
  completedWorkoutsCount: z.number(),
  conclusionRate: z.number(),
  totalTimeInSeconds: z.number(),
});

export const HomeDataSchema = z.object({
  activeWorkoutPlanId: z.string().uuid(),
  todayWorkoutDay: z.object({
    workoutPlanId: z.string().uuid(),
    id: z.string().uuid(),
    name: z.string(),
    isRest: z.boolean(),
    weekDay: z.enum(Object.keys(WeekDay) as [string, ...string[]]),
    estimatedDurationInSeconds: z.number(),
    coverImageUrl: z.string().url().optional(),
    exercisesCount: z.number(),
  }),
  workoutStreak: z.number(),
  consistencyByDay: z.record(
    z.string().datetime(),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean(),
    }),
  ),
});

export const GetWorkoutDaySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isRest: z.boolean(),
  coverImageUrl: z.string().url().optional(),
  estimatedDurationInSeconds: z.number(),
  weekDay: z.enum(Object.keys(WeekDay) as [string, ...string[]]),
  exercises: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      order: z.number(),
      workoutDayId: z.string().uuid(),
      sets: z.number(),
      reps: z.number(),
      restTimeInSeconds: z.number(),
    }),
  ),
  sessions: z.array(
    z.object({
      id: z.string().uuid(),
      workoutDayId: z.string().uuid(),
      startedAt: z.string().datetime().optional(),
      completedAt: z.string().datetime().optional(),
    }),
  ),
});

export const GetWorkoutPlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  workoutDays: z.array(
    z.object({
      id: z.string().uuid(),
      weekDay: z.enum(Object.keys(WeekDay) as [string, ...string[]]),
      name: z.string(),
      isRest: z.boolean(),
      coverImageUrl: z.string().url().optional(),
      estimatedDurationInSeconds: z.number(),
      exercisesCount: z.number(),
    }),
  ),
});

export const ListWorkoutPlansQuerySchema = z.object({
  active: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export const ListWorkoutPlansSchema = z.array(
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    isActive: z.boolean(),
    workoutDays: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        weekDay: z.enum(Object.keys(WeekDay) as [string, ...string[]]),
        isRest: z.boolean(),
        estimatedDurationInSeconds: z.number(),
        coverImageUrl: z.string().url().optional(),
        exercises: z.array(
          z.object({
            id: z.string().uuid(),
            order: z.number(),
            name: z.string(),
            sets: z.number(),
            reps: z.number(),
            restTimeInSeconds: z.number(),
          }),
        ),
      }),
    ),
  }),
);

export const UpsertUserTrainDataBodySchema = z.object({
  weightInGrams: z.number().min(0),
  heightInCentimeters: z.number().min(0),
  age: z.number().min(0),
  bodyFatPercentage: z.number().min(0).max(100),
});

export const UserTrainDataSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  weightInGrams: z.number(),
  heightInCentimeters: z.number(),
  age: z.number(),
  bodyFatPercentage: z.number().min(0).max(100),
});

export const UpsertUserTrainDataSchema = z.object({
  userId: z.string(),
  weightInGrams: z.number(),
  heightInCentimeters: z.number(),
  age: z.number(),
  bodyFatPercentage: z.number(),
});

export const WorkoutPlanSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1),
  pendingEmail: z.string().email().optional(),
  workoutDays: z.array(
    z.object({
      name: z.string().trim().min(1),
      weekDay: z.enum(Object.keys(WeekDay) as [string, ...string[]]),
      isRest: z.boolean().default(false),
      estimatedDurationInSeconds: z.number().min(1),
      coverImageUrl: z.string().url().optional(),
      exercises: z.array(
        z.object({
          order: z.number().min(0),
          name: z.string().trim().min(1),
          sets: z.number().min(1),
          reps: z.number().min(1),
          restTimeInSeconds: z.number().min(1),
        }),
      ),
    }),
  ),
});
