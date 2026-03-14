import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sendNotification,
  sendNotificationAsync,
  getUserNotificationPrefs,
  updateUserNotificationPrefs,
  checkNotificationConfig,
  NotificationResult,
} from "./notifications";
import {
  formatTemplateVariables,
  validateNotificationPrefs,
  defaultNotificationPrefs,
  smsTemplates,
  wechatTemplates,
  NotificationType,
  TemplateVariables,
} from "./notification-templates";
import { prisma } from "./prisma";

// Mock prisma
vi.mock("./prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("notification-templates", () => {
  describe("formatTemplateVariables", () => {
    it("should format date and time correctly", () => {
      const vars = formatTemplateVariables(
        "Test Address",
        new Date("2024-03-15T10:00:00"),
        new Date("2024-03-15T12:00:00"),
        50,
        "order-123456789"
      );

      expect(vars.spotAddress).toBe("Test Address");
      expect(vars.startTime).toBe("3月15日 10:00");
      expect(vars.endTime).toBe("3月15日 12:00");
      expect(vars.amount).toBe("50.00");
      expect(vars.orderId).toBe("56789"); // Last 8 chars
    });

    it("should truncate long addresses", () => {
      const longAddress = "A".repeat(50);
      const vars = formatTemplateVariables(
        longAddress,
        new Date(),
        new Date(),
        100,
        "order-123"
      );

      expect(vars.spotAddress.length).toBeLessThanOrEqual(23); // 20 + "..."
      expect(vars.spotAddress.endsWith("...")).toBe(true);
    });
  });

  describe("validateNotificationPrefs", () => {
    it("should return default prefs for null input", () => {
      const prefs = validateNotificationPrefs(null);
      expect(prefs).toEqual(defaultNotificationPrefs);
    });

    it("should return default prefs for undefined input", () => {
      const prefs = validateNotificationPrefs(undefined);
      expect(prefs).toEqual(defaultNotificationPrefs);
    });

    it("should merge partial prefs with defaults", () => {
      const partial = {
        NEW_ORDER: { SMS: false, WECHAT: true },
      };
      const prefs = validateNotificationPrefs(partial);

      expect(prefs.NEW_ORDER.SMS).toBe(false);
      expect(prefs.NEW_ORDER.WECHAT).toBe(true);
      expect(prefs.PAYMENT_SUCCESS).toEqual(defaultNotificationPrefs.PAYMENT_SUCCESS);
    });

    it("should ignore invalid values", () => {
      const invalid = {
        NEW_ORDER: { SMS: "invalid", WECHAT: 123 },
      };
      const prefs = validateNotificationPrefs(invalid);

      expect(prefs.NEW_ORDER.SMS).toBe(defaultNotificationPrefs.NEW_ORDER.SMS);
      expect(prefs.NEW_ORDER.WECHAT).toBe(defaultNotificationPrefs.NEW_ORDER.WECHAT);
    });
  });

  describe("smsTemplates", () => {
    const mockVars: TemplateVariables = {
      spotAddress: "Test Street 123",
      startTime: "3月15日 10:00",
      endTime: "3月15日 12:00",
      amount: "50.00",
      orderId: "ABC123",
    };

    it("should render NEW_ORDER template with variables", () => {
      const content = smsTemplates.NEW_ORDER(mockVars);
      expect(content).toContain("Test Street 123");
      expect(content).toContain("3月15日 10:00");
      expect(content).toContain("3月15日 12:00");
      expect(content).toContain("¥50.00");
      expect(content).toContain("ABC123");
    });

    it("should render PAYMENT_SUCCESS template with variables", () => {
      const content = smsTemplates.PAYMENT_SUCCESS(mockVars);
      expect(content).toContain("支付成功");
      expect(content).toContain("Test Street 123");
    });

    it("should render ORDER_CANCELLED template with variables", () => {
      const content = smsTemplates.ORDER_CANCELLED(mockVars);
      expect(content).toContain("已取消");
      expect(content).toContain("Test Street 123");
    });
  });

  describe("wechatTemplates", () => {
    const mockVars: TemplateVariables = {
      spotAddress: "Test Street 123",
      startTime: "3月15日 10:00",
      endTime: "3月15日 12:00",
      amount: "50.00",
      orderId: "ABC123",
    };

    it("should return template config for NEW_ORDER", () => {
      const config = wechatTemplates.NEW_ORDER;
      expect(config.templateId).toBeDefined();
      const data = config.data(mockVars);
      expect(data.thing1.value).toBe(mockVars.spotAddress);
      expect(data.time2.value).toBe(mockVars.startTime);
    });
  });
});

describe("notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getUserNotificationPrefs", () => {
    it("should return user notification prefs from database", async () => {
      const mockUser = {
        notificationPrefs: {
          NEW_ORDER: { SMS: true, WECHAT: false },
        },
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const prefs = await getUserNotificationPrefs("user-123");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
        select: { notificationPrefs: true },
      });
      expect(prefs.NEW_ORDER.SMS).toBe(true);
      expect(prefs.NEW_ORDER.WECHAT).toBe(false);
    });

    it("should return default prefs when user has no prefs", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ notificationPrefs: null } as any);

      const prefs = await getUserNotificationPrefs("user-123");

      expect(prefs).toEqual(defaultNotificationPrefs);
    });

    it("should return default prefs when user not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null as any);

      const prefs = await getUserNotificationPrefs("user-123");

      expect(prefs).toEqual(defaultNotificationPrefs);
    });
  });

  describe("updateUserNotificationPrefs", () => {
    it("should update user notification prefs", async () => {
      const newPrefs = {
        ...defaultNotificationPrefs,
        NEW_ORDER: { SMS: false, WECHAT: true },
      };

      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      await updateUserNotificationPrefs("user-123", newPrefs);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { notificationPrefs: newPrefs },
      });
    });
  });

  describe("checkNotificationConfig", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should return all configs missing when env vars not set", () => {
      delete process.env.ALIYUN_ACCESS_KEY_ID;
      delete process.env.ALIYUN_ACCESS_KEY_SECRET;
      delete process.env.ALIYUN_SMS_SIGN_NAME;
      delete process.env.WECHAT_APP_ID;
      delete process.env.WECHAT_SECRET;

      const config = checkNotificationConfig();

      expect(config.sms).toBe(false);
      expect(config.wechat).toBe(false);
      expect(config.errors.length).toBeGreaterThan(0);
    });

    it("should return sms enabled when Aliyun config is set", () => {
      process.env.ALIYUN_ACCESS_KEY_ID = "test-key";
      process.env.ALIYUN_ACCESS_KEY_SECRET = "test-secret";
      process.env.ALIYUN_SMS_SIGN_NAME = "test-sign";
      delete process.env.WECHAT_APP_ID;
      delete process.env.WECHAT_SECRET;

      const config = checkNotificationConfig();

      expect(config.sms).toBe(true);
      expect(config.wechat).toBe(false);
    });

    it("should return wechat enabled when WeChat config is set", () => {
      delete process.env.ALIYUN_ACCESS_KEY_ID;
      process.env.WECHAT_APP_ID = "test-app-id";
      process.env.WECHAT_SECRET = "test-secret";

      const config = checkNotificationConfig();

      expect(config.sms).toBe(false);
      expect(config.wechat).toBe(true);
    });
  });
});
