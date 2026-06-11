import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  weightInGrams?: number;
  heightInCentimeters?: number;
  age?: number;
  bodyFatPercentage?: number;
  injuryNotes?: string;
}

interface OutputDto {
  userId: string;
  weightInGrams?: number;
  heightInCentimeters?: number;
  age?: number;
  bodyFatPercentage?: number;
  injuryNotes?: string;
}

export class UpsertUserTrainData {
  async execute(dto: InputDto): Promise<OutputDto> {
    const user = await prisma.user.update({
      where: { id: dto.userId },
      data: {
        weightInGrams: dto.weightInGrams,
        heightInCentimeters: dto.heightInCentimeters,
        age: dto.age,
        bodyFatPercentage: dto.bodyFatPercentage,
        injuryNotes: dto.injuryNotes,
      },
    });

    return {
      userId: user.id,
      weightInGrams: user.weightInGrams ?? undefined,
      heightInCentimeters: user.heightInCentimeters ?? undefined,
      age: user.age ?? undefined,
      bodyFatPercentage: user.bodyFatPercentage ?? undefined,
      injuryNotes: user.injuryNotes ?? undefined,
    };
  }
}
