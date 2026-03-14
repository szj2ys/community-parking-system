import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, PUT } from "./route";
import { auth } from "@/lib/auth";
import { getUserNotificationPrefs, updateUserNotificationPrefs } from "@/lib/notifications";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  getUserNotificationPrefs: vi.fn(),
  updateUserNotificationPrefs: vi.fn(),
}));

describe("GET /api/user/notifications/preferences", () => {
  const mockSession = {
    user: {
      id: "user-123",
    },
  };

  const mockPrefs = {
    NEW_ORDER: { SMS: true, WECHAT: true },
    PAYMENT_SUCCESS: { SMS: false, WECHAT: true },
    ORDER_CANCELLED: { SMS: false, WECHAT: true },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user notification preferences", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(getUserNotificationPrefs).mockResolvedValue(mockPrefs as any);

    const request = new NextRequest("http://localhost/api/user/notifications/preferences");
    const response = await GET(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockPrefs);
    expect(getUserNotificationPrefs).toHaveBeenCalledWith("user-123");
  });

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const request = new NextRequest("http://localhost/api/user/notifications/preferences");
    const response = await GET(request);
    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNAUTHORIZED");
  });
});

describe("POST /api/user/notifications/preferences", () => {
  const mockSession = {
    user: {
      id: "user-123",
    },
  };

  const mockPrefs = {
    NEW_ORDER: { SMS: false, WECHAT: true },
    PAYMENT_SUCCESS: { SMS: false, WECHAT: true },
    ORDER_CANCELLED: { SMS: false, WECHAT: true },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update user notification preferences", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(updateUserNotificationPrefs).mockResolvedValue(undefined);

    const request = new NextRequest("http://localhost/api/user/notifications/preferences", {
      method: "POST",
      body: JSON.stringify(mockPrefs),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockPrefs);
    expect(updateUserNotificationPrefs).toHaveBeenCalledWith("user-123", mockPrefs);
  });

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const request = new NextRequest("http://localhost/api/user/notifications/preferences", {
      method: "POST",
      body: JSON.stringify(mockPrefs),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNAUTHORIZED");
  });

  it("should return 400 for invalid request body", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);

    const request = new NextRequest("http://localhost/api/user/notifications/preferences", {
      method: "POST",
      body: "invalid json",
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error).toBe("INVALID_DATA");
  });
});

describe("PUT /api/user/notifications/preferences", () => {
  const mockSession = {
    user: {
      id: "user-123",
    },
  };

  const mockPrefs = {
    NEW_ORDER: { SMS: false, WECHAT: true },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delegate to POST handler", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    vi.mocked(updateUserNotificationPrefs).mockResolvedValue(undefined);

    const request = new NextRequest("http://localhost/api/user/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify(mockPrefs),
    });

    const response = await PUT(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
  });
});
