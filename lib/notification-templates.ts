// 通知模板类型
export type NotificationType = 'NEW_ORDER' | 'PAYMENT_SUCCESS' | 'ORDER_CANCELLED';

// 通知渠道类型
export type NotificationChannel = 'SMS' | 'WECHAT';

// 模板变量接口
export interface TemplateVariables {
  spotAddress: string;
  startTime: string;
  endTime: string;
  amount: string;
  orderId: string;
}

// 通知模板配置
export interface NotificationTemplate {
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  content: string;
  templateCode?: string; // 短信服务商模板代码
}

// 短信模板内容（用于直接发送，非模板代码模式）
export const smsTemplates: Record<NotificationType, (vars: TemplateVariables) => string> = {
  NEW_ORDER: (vars) =>
    `【社区车位】您收到新订单！车位：${vars.spotAddress}，时间：${vars.startTime}至${vars.endTime}，金额：¥${vars.amount}。订单号：${vars.orderId}。请及时处理。`,

  PAYMENT_SUCCESS: (vars) =>
    `【社区车位】订单支付成功！车位：${vars.spotAddress}，时间：${vars.startTime}至${vars.endTime}，金额：¥${vars.amount}。订单号：${vars.orderId}。`,

  ORDER_CANCELLED: (vars) =>
    `【社区车位】订单已取消。车位：${vars.spotAddress}，时间：${vars.startTime}至${vars.endTime}，订单号：${vars.orderId}。`,
};

// 微信订阅消息模板（使用微信官方的模板ID）
export const wechatTemplates: Record<NotificationType, { templateId: string; data: (vars: TemplateVariables) => Record<string, { value: string }> }> = {
  NEW_ORDER: {
    templateId: '{{NEW_ORDER_TEMPLATE_ID}}', // 需要在微信后台配置
    data: (vars) => ({
      thing1: { value: vars.spotAddress }, // 车位地址
      time2: { value: vars.startTime },    // 开始时间
      time3: { value: vars.endTime },      // 结束时间
      amount4: { value: `¥${vars.amount}` }, // 金额
      character_string5: { value: vars.orderId }, // 订单号
    }),
  },

  PAYMENT_SUCCESS: {
    templateId: '{{PAYMENT_SUCCESS_TEMPLATE_ID}}',
    data: (vars) => ({
      thing1: { value: vars.spotAddress },
      time2: { value: vars.startTime },
      time3: { value: vars.endTime },
      amount4: { value: `¥${vars.amount}` },
      character_string5: { value: vars.orderId },
    }),
  },

  ORDER_CANCELLED: {
    templateId: '{{ORDER_CANCELLED_TEMPLATE_ID}}',
    data: (vars) => ({
      thing1: { value: vars.spotAddress },
      time2: { value: vars.startTime },
      time3: { value: vars.endTime },
      character_string6: { value: vars.orderId },
    }),
  },
};

// 通知类型中文名称
export const notificationTypeNames: Record<NotificationType, string> = {
  NEW_ORDER: '新订单通知',
  PAYMENT_SUCCESS: '订单支付成功',
  ORDER_CANCELLED: '订单取消',
};

// 默认通知偏好配置
export const defaultNotificationPrefs: NotificationPrefs = {
  NEW_ORDER: { SMS: true, WECHAT: true },
  PAYMENT_SUCCESS: { SMS: false, WECHAT: true },
  ORDER_CANCELLED: { SMS: false, WECHAT: true },
};

// 通知偏好类型定义
export type NotificationPrefs = {
  [K in NotificationType]: {
    [C in NotificationChannel]: boolean;
  };
};

// 格式化模板变量
export function formatTemplateVariables(
  spotAddress: string,
  startTime: Date,
  endTime: Date,
  amount: number,
  orderId: string
): TemplateVariables {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return {
    spotAddress: spotAddress.length > 20 ? spotAddress.slice(0, 20) + '...' : spotAddress,
    startTime: formatDate(startTime),
    endTime: formatDate(endTime),
    amount: amount.toFixed(2),
    orderId: orderId.slice(-5), // 取订单号后5位
  };
}

// 验证通知偏好数据结构
export function validateNotificationPrefs(prefs: unknown): NotificationPrefs {
  if (!prefs || typeof prefs !== 'object') {
    return defaultNotificationPrefs;
  }

  const types: NotificationType[] = ['NEW_ORDER', 'PAYMENT_SUCCESS', 'ORDER_CANCELLED'];
  const channels: NotificationChannel[] = ['SMS', 'WECHAT'];
  const result = { ...defaultNotificationPrefs };

  for (const type of types) {
    const typePrefs = (prefs as Record<string, unknown>)[type];
    if (typePrefs && typeof typePrefs === 'object') {
      for (const channel of channels) {
        const value = (typePrefs as Record<string, boolean>)[channel];
        if (typeof value === 'boolean') {
          result[type][channel] = value;
        }
      }
    }
  }

  return result;
}
