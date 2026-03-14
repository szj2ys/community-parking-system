import { prisma } from "./prisma";
import { SpotStatus, UserRole } from "@/types";

export async function getPublicSpotById(id: string) {
  const spot = await prisma.parkingSpot.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, name: true, phone: true, role: true, createdAt: true, updatedAt: true },
      },
    },
  });

  if (!spot) return null;

  // Transform Decimal to number, null to undefined, and Prisma types to our types for serialization
  return {
    ...spot,
    pricePerHour: Number(spot.pricePerHour),
    description: spot.description ?? undefined,
    availableFrom: spot.availableFrom ?? undefined,
    availableTo: spot.availableTo ?? undefined,
    status: spot.status as SpotStatus,
    owner: spot.owner ? {
      ...spot.owner,
      role: spot.owner.role as UserRole,
      name: spot.owner.name ?? undefined,
    } : undefined,
  };
}
