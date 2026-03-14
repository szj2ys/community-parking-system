import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as sendNotificationHandler } from "./route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  sendNotificationAsync: vi.fn(),
  formatTemplateVariables: vi.fn(() => ({
    spotAddress: "Test Address",
    startTime: "3月15日 10:00",
    endTime: "3月15日 12:00",
    amount: "50.00",
    orderId: "ABC123",
  })),
}));

describe("POST /api/notifications/orders", () => {
  const mockOrder = {
    id: "order-123",
    spot: {
      address: "Test Street 123",
      owner: {
        id: "owner-123",
        phone: "13800138000",
        wxOpenid: "wx-openid-123",
      },
    },
    tenantId: "tenant-123",
    startTime: new Date("2024-03-15T10:00:00"),
    endTime: new Date("2024-03-15T12:00:00"),
    totalPrice: 50,
  };

  const mockSession = {
    user: {
      id: "tenant-123",
      role: "TENANT",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send notification when user is authenticated and authorized", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

    const request = new NextRequest("http://localhost/api/notifications/orders", {
      method: "POST",
      body: JSON.stringify({
        orderId: "order-123",
        type: "NEW_ORDER",
      }),
    });

    const response = await sendNotificationHandler(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.orderId).toBe("order-123");
    expect(result.data.type).toBe("NEW_ORDER");
  });

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const request = new NextRequest("http://localhost/api/notifications/orders", {
      method: "POST",
      body: JSON.stringify({
        orderId: "order-123",
        type: "NEW_ORDER",
      }),
    });

    const response = await sendNotificationHandler(request);
    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNAUTHORIZED");
  });

  it("should return 400 for invalid request body", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);

    const request = new NextRequest("http://localhost/api/notifications/orders", {
      method: "POST",
      body: JSON.stringify({
        orderId: "",
        type: "INVALID_TYPE",
      }),
    });

    const response = await sendNotificationHandler(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error).toBe("INVALID_DATA");
  });

  it("should return 404 when order does not exist", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null as any);

    const request = new NextRequest("http://localhost/api/notifications/orders", {
      method: "POST",
      body: JSON.stringify({
        orderId: "non-existent-order",
        type: "NEW_ORDER",
      }),
    });

    const response = await sendNotificationHandler(request);
    const result = await response.json();

    expect(response.status).toBe(404);
    expect(result.success).toBe(false);
    expect(result.error).toBe("NOT_FOUND");
  });

  it("should return 403 when user is not related to the order", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "other-user", role: "TENANT" },
    } as any);
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

    const request = new NextRequest("http://localhost/api/notifications/orders", {
      method: "POST",
      body: JSON.stringify({
        orderId: "order-123",
        type: "NEW_ORDER",
      }),
    });

    const response = await sendNotificationHandler(request);
    const result = await response.json();

    expect(response.status).toBe(403);
    expect(result.success).toBe(false);
    expect(result.error).toBe("FORBIDDEN");
  });
});
