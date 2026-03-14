import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, UserRole, SpotStatus, OrderStatus } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schemas for batch import
const userSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, "Invalid phone number"),
  name: z.string().min(1).max(50),
  role: z.enum(["OWNER", "TENANT", "ADMIN"]),
  referralCode: z.string().optional(),
  wxOpenid: z.string().optional(),
});

const parkingSpotSchema = z.object({
  title: z.string().min(1).max(100),
  address: z.string().min(1).max(200),
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
  pricePerHour: z.number().min(0).max(1000),
  description: z.string().max(500).optional(),
  status: z.enum(["AVAILABLE", "RENTED", "UNAVAILABLE"]),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
  ownerPhone: z.string(),
});

const orderSchema = z.object({
  spotTitle: z.string(),
  tenantPhone: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  totalPrice: z.number().min(0),
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REJECTED"]),
  note: z.string().optional(),
});

const batchImportSchema = z.object({
  users: z.array(userSchema).optional(),
  parkingSpots: z.array(parkingSpotSchema).optional(),
  orders: z.array(orderSchema).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = batchImportSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { users, parkingSpots, orders } = validationResult.data;
    const results = {
      users: { created: 0, skipped: 0, errors: [] as string[] },
      parkingSpots: { created: 0, skipped: 0, errors: [] as string[] },
      orders: { created: 0, skipped: 0, errors: [] as string[] },
    };

    // Create users
    if (users && users.length > 0) {
      for (const userData of users) {
        try {
          await prisma.user.upsert({
            where: { phone: userData.phone },
            update: {
              name: userData.name,
              role: userData.role as UserRole,
            },
            create: {
              phone: userData.phone,
              name: userData.name,
              role: userData.role as UserRole,
              referralCode: userData.referralCode,
              wxOpenid: userData.wxOpenid,
            },
          });
          results.users.created++;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          results.users.errors.push(`Failed to create user ${userData.phone}: ${message}`);
        }
      }
    }

    // Create parking spots
    if (parkingSpots && parkingSpots.length > 0) {
      for (const spotData of parkingSpots) {
        try {
          const owner = await prisma.user.findUnique({
            where: { phone: spotData.ownerPhone },
          });

          if (!owner) {
            results.parkingSpots.errors.push(
              `Owner with phone ${spotData.ownerPhone} not found for spot ${spotData.title}`
            );
            continue;
          }

          await prisma.parkingSpot.create({
            data: {
              title: spotData.title,
              address: spotData.address,
              longitude: spotData.longitude,
              latitude: spotData.latitude,
              pricePerHour: spotData.pricePerHour,
              description: spotData.description,
              status: spotData.status as SpotStatus,
              availableFrom: spotData.availableFrom
                ? new Date(spotData.availableFrom)
                : null,
              availableTo: spotData.availableTo
                ? new Date(spotData.availableTo)
                : null,
              ownerId: owner.id,
              images: [],
            },
          });
          results.parkingSpots.created++;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          results.parkingSpots.errors.push(
            `Failed to create spot ${spotData.title}: ${message}`
          );
        }
      }
    }

    // Create orders
    if (orders && orders.length > 0) {
      for (const orderData of orders) {
        try {
          const spot = await prisma.parkingSpot.findFirst({
            where: { title: orderData.spotTitle },
          });

          const tenant = await prisma.user.findUnique({
            where: { phone: orderData.tenantPhone },
          });

          if (!spot) {
            results.orders.errors.push(
              `Spot ${orderData.spotTitle} not found for order`
            );
            continue;
          }

          if (!tenant) {
            results.orders.errors.push(
              `Tenant with phone ${orderData.tenantPhone} not found for order`
            );
            continue;
          }

          await prisma.order.create({
            data: {
              spotId: spot.id,
              tenantId: tenant.id,
              startTime: new Date(orderData.startTime),
              endTime: new Date(orderData.endTime),
              totalPrice: orderData.totalPrice,
              status: orderData.status as OrderStatus,
              note: orderData.note,
            },
          });
          results.orders.created++;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          results.orders.errors.push(`Failed to create order: ${message}`);
        }
      }
    }

    const hasErrors =
      results.users.errors.length > 0 ||
      results.parkingSpots.errors.length > 0 ||
      results.orders.errors.length > 0;

    return NextResponse.json({
      success: !hasErrors,
      results,
    });
  } catch (error) {
    console.error("Batch import error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get("confirm");

    if (confirm !== "true") {
      return NextResponse.json(
        {
          success: false,
          error: "Add ?confirm=true to confirm data deletion",
        },
        { status: 400 }
      );
    }

    // Delete in order to respect foreign key constraints
    const orders = await prisma.order.deleteMany();
    const referrals = await prisma.referralRecord.deleteMany();
    const spots = await prisma.parkingSpot.deleteMany();
    const users = await prisma.user.deleteMany();

    return NextResponse.json({
      success: true,
      deleted: {
        orders: orders.count,
        referrals: referrals.count,
        spots: spots.count,
        users: users.count,
      },
    });
  } catch (error) {
    console.error("Data deletion error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
