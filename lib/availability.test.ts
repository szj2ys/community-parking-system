import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkSpotAvailability,
  checkBatchAvailability,
  getSpotBookings,
  isTimeOverlapping,
  getImmediateAvailabilityWindow,
} from "./availability";
import { prisma } from "./prisma";
import { OrderStatus } from "@prisma/client";

// Mock prisma
vi.mock("./prisma", () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe("availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkSpotAvailability", () => {
    it("should return true when spot has no overlapping orders", async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

      const startTime = new Date("2026-03-15T10:00:00");
      const endTime = new Date("2026-03-15T12:00:00");

      const result = await checkSpotAvailability("spot-1", startTime, endTime);

      expect(result).toBe(true);
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: {
          spotId: "spot-1",
          status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        select: { id: true },
      });
    });

    it("should return false when spot has overlapping order", async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue({ id: "order-1" });

      const startTime = new Date("2026-03-15T10:00:00");
      const endTime = new Date("2026-03-15T12:00:00");

      const result = await checkSpotAvailability("spot-1", startTime, endTime);

      expect(result).toBe(false);
    });

    it("should throw error when endTime is not after startTime", async () => {
      const startTime = new Date("2026-03-15T12:00:00");
      const endTime = new Date("2026-03-15T10:00:00");

      await expect(
        checkSpotAvailability("spot-1", startTime, endTime)
      ).rejects.toThrow("结束时间必须晚于开始时间");
    });

    it("should throw error when endTime equals startTime", async () => {
      const time = new Date("2026-03-15T10:00:00");

      await expect(
        checkSpotAvailability("spot-1", time, time)
      ).rejects.toThrow("结束时间必须晚于开始时间");
    });
  });

  describe("checkBatchAvailability", () => {
    it("should return empty set when spotIds is empty", async () => {
      const result = await checkBatchAvailability(
        [],
        new Date("2026-03-15T10:00:00"),
        new Date("2026-03-15T12:00:00")
      );

      expect(result.size).toBe(0);
    });

    it("should return all spotIds when none have conflicting orders", async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);

      const spotIds = ["spot-1", "spot-2", "spot-3"];
      const startTime = new Date("2026-03-15T10:00:00");
      const endTime = new Date("2026-03-15T12:00:00");

      const result = await checkBatchAvailability(spotIds, startTime, endTime);

      expect(result.size).toBe(3);
      expect(result.has("spot-1")).toBe(true);
      expect(result.has("spot-2")).toBe(true);
      expect(result.has("spot-3")).toBe(true);
    });

    it("should exclude spots with conflicting orders", async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        { spotId: "spot-2" },
      ]);

      const spotIds = ["spot-1", "spot-2", "spot-3"];
      const startTime = new Date("2026-03-15T10:00:00");
      const endTime = new Date("2026-03-15T12:00:00");

      const result = await checkBatchAvailability(spotIds, startTime, endTime);

      expect(result.size).toBe(2);
      expect(result.has("spot-1")).toBe(true);
      expect(result.has("spot-2")).toBe(false);
      expect(result.has("spot-3")).toBe(true);
    });

    it("should throw error when endTime is not after startTime", async () => {
      await expect(
        checkBatchAvailability(
          ["spot-1"],
          new Date("2026-03-15T12:00:00"),
          new Date("2026-03-15T10:00:00")
        )
      ).rejects.toThrow("结束时间必须晚于开始时间");
    });
  });

  describe("getSpotBookings", () => {
    it("should return overlapping orders for a spot", async () => {
      const mockOrders = [
        { id: "order-1", startTime: new Date(), endTime: new Date(), status: OrderStatus.CONFIRMED },
      ];
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders);

      const startTime = new Date("2026-03-15T10:00:00");
      const endTime = new Date("2026-03-15T12:00:00");

      const result = await getSpotBookings("spot-1", startTime, endTime);

      expect(result).toEqual(mockOrders);
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          spotId: "spot-1",
          status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
        },
        orderBy: { startTime: "asc" },
      });
    });
  });

  describe("isTimeOverlapping", () => {
    it("should return true when time ranges overlap", () => {
      const start1 = new Date("2026-03-15T10:00:00");
      const end1 = new Date("2026-03-15T12:00:00");
      const start2 = new Date("2026-03-15T11:00:00");
      const end2 = new Date("2026-03-15T13:00:00");

      expect(isTimeOverlapping(start1, end1, start2, end2)).toBe(true);
    });

    it("should return false when time ranges do not overlap", () => {
      const start1 = new Date("2026-03-15T10:00:00");
      const end1 = new Date("2026-03-15T12:00:00");
      const start2 = new Date("2026-03-15T12:00:00");
      const end2 = new Date("2026-03-15T14:00:00");

      expect(isTimeOverlapping(start1, end1, start2, end2)).toBe(false);
    });

    it("should return true when one range is completely within another", () => {
      const start1 = new Date("2026-03-15T09:00:00");
      const end1 = new Date("2026-03-15T15:00:00");
      const start2 = new Date("2026-03-15T10:00:00");
      const end2 = new Date("2026-03-15T12:00:00");

      expect(isTimeOverlapping(start1, end1, start2, end2)).toBe(true);
    });

    it("should return false when ranges are adjacent but not overlapping", () => {
      const start1 = new Date("2026-03-15T10:00:00");
      const end1 = new Date("2026-03-15T11:00:00");
      const start2 = new Date("2026-03-15T11:00:00");
      const end2 = new Date("2026-03-15T12:00:00");

      expect(isTimeOverlapping(start1, end1, start2, end2)).toBe(false);
    });
  });

  describe("getImmediateAvailabilityWindow", () => {
    it("should return 1 hour window from current time", () => {
      const before = Date.now();
      const [startTime, endTime] = getImmediateAvailabilityWindow();
      const after = Date.now();

      expect(startTime.getTime()).toBeGreaterThanOrEqual(before);
      expect(startTime.getTime()).toBeLessThanOrEqual(after);
      expect(endTime.getTime() - startTime.getTime()).toBe(60 * 60 * 1000);
    });
  });
});
