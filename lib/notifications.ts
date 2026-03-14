import { prisma } from './prisma';
import {
  NotificationType,
  NotificationChannel,
  TemplateVariables,
  smsTemplates,
  wechatTemplates,
  notificationTypeNames,
  defaultNotificationPrefs,
  NotificationPrefs,
  validateNotificationPrefs,
} from './notification-templates';

// 通知发送结果
export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
}

// 通知日志记录
interface NotificationLogData {
  userId: string;
  orderId: string;
  type: NotificationType;
  channel: NotificationChannel;
  content: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  errorMessage?: string;
  retryCount: number;
}

// 内存中的通知日志（实际生产环境应使用数据库表）
const notificationLogs: NotificationLogData[] = [];

// 最大重试次数
const MAX_RETRIES = 3;

// 重试延迟（指数退避）
function getRetryDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt - 1), 30000); // 1s, 2s, 4s, max 30s
}

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 记录通知日志
function logNotification(data: NotificationLogData): void {
  notificationLogs.push({
    ...data,
  });

  // 限制日志数量，防止内存溢出
  if (notificationLogs.length > 10000) {
    notificationLogs.shift();
  }

  // 控制台日志
  const status = data.status === 'SUCCESS' ? '✓' : data.status === 'FAILED' ? '✗' : '⏳';
  console.log(`[Notification] ${status} ${data.type} via ${data.channel} to user ${data.userId}`);
  if (data.errorMessage) {
    console.error(`[Notification] Error: ${data.errorMessage}`);
  }
}

// 发送短信（阿里云 SMS）
async function sendSMSWithAliyun(
  phone: string,
  templateCode: string,
  templateParam: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // 实际实现需要接入阿里云 SDK
  // 这里提供接口框架
  try {
    const { ALIYUN_ACCESS_KEY_ID, ALIYUN_ACCESS_KEY_SECRET, ALIYUN_SMS_SIGN_NAME } = process.env;

    if (!ALIYUN_ACCESS_KEY_ID || !ALIYUN_ACCESS_KEY_SECRET || !ALIYUN_SMS_SIGN_NAME) {
      return { success: false, error: '阿里云 SMS 配置缺失' };
    }

    // TODO: 接入阿里云 SMS SDK
    // const client = new AliyunSMSClient({...})
    // const result = await client.sendSms({...})

    // 模拟成功响应
    console.log(`[SMS Aliyun] Would send to ${phone} with template ${templateCode}:`, templateParam);
    return { success: true, messageId: `mock-${Date.now()}` };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 发送短信（腾讯云 SMS）
async function sendSMSWithTencent(
  phone: string,
  templateId: string,
  templateParam: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { TENCENT_SECRET_ID, TENCENT_SECRET_KEY, TENCENT_SMS_SIGN_NAME, TENCENT_SMS_APP_ID } = process.env;

    if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY || !TENCENT_SMS_SIGN_NAME || !TENCENT_SMS_APP_ID) {
      return { success: false, error: '腾讯云 SMS 配置缺失' };
    }

    // TODO: 接入腾讯云 SMS SDK
    console.log(`[SMS Tencent] Would send to ${phone} with template ${templateId}:`, templateParam);
    return { success: true, messageId: `mock-${Date.now()}` };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 发送微信订阅消息
async function sendWechatMessage(
  openid: string,
  templateId: string,
  data: Record<string, { value: string }>,
  page?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { WECHAT_APP_ID, WECHAT_SECRET } = process.env;

    if (!WECHAT_APP_ID || !WECHAT_SECRET) {
      return { success: false, error: '微信配置缺失' };
    }

    if (!openid) {
      return { success: false, error: '用户未绑定微信' };
    }

    // TODO: 接入微信订阅消息 API
    // 1. 获取 access_token
    // 2. 调用 subscribeMessage.send
    console.log(`[WeChat] Would send to ${openid} with template ${templateId}:`, data);
    return { success: true, messageId: `mock-${Date.now()}` };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 发送短信通知（带重试）
async function sendSMSWithRetry(
  phone: string,
  content: string,
  logData: Omit<NotificationLogData, 'status' | 'errorMessage'>
): Promise<NotificationResult> {
  const provider = process.env.SMS_PROVIDER || 'aliyun';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let result: { success: boolean; messageId?: string; error?: string };

    if (provider === 'tencent') {
      result = await sendSMSWithTencent(phone, 'SMS_TEMPLATE_ID', { content });
    } else {
      result = await sendSMSWithAliyun(phone, 'SMS_TEMPLATE_CODE', { content });
    }

    if (result.success) {
      logNotification({
        ...logData,
        status: 'SUCCESS',
        retryCount: attempt,
      });
      return { success: true, channel: 'SMS', messageId: result.messageId };
    }

    // 记录失败日志
    logNotification({
      ...logData,
      status: 'FAILED',
      errorMessage: result.error,
      retryCount: attempt,
    });

    // 最后一次尝试失败，不再重试
    if (attempt === MAX_RETRIES) {
      return { success: false, channel: 'SMS', error: result.error };
    }

    // 等待重试
    await delay(getRetryDelay(attempt));
  }

  return { success: false, channel: 'SMS', error: 'Max retries exceeded' };
}

// 发送微信通知（带重试）
async function sendWechatWithRetry(
  openid: string,
  type: NotificationType,
  vars: TemplateVariables,
  logData: Omit<NotificationLogData, 'status' | 'errorMessage'>
): Promise<NotificationResult> {
  const template = wechatTemplates[type];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await sendWechatMessage(
      openid,
      template.templateId,
      template.data(vars),
      `/orders/${logData.orderId}`
    );

    if (result.success) {
      logNotification({
        ...logData,
        status: 'SUCCESS',
        retryCount: attempt,
      });
      return { success: true, channel: 'WECHAT', messageId: result.messageId };
    }

    // 记录失败日志
    logNotification({
      ...logData,
      status: 'FAILED',
      errorMessage: result.error,
      retryCount: attempt,
    });

    // 最后一次尝试失败，不再重试
    if (attempt === MAX_RETRIES) {
      return { success: false, channel: 'WECHAT', error: result.error };
    }

    // 等待重试
    await delay(getRetryDelay(attempt));
  }

  return { success: false, channel: 'WECHAT', error: 'Max retries exceeded' };
}

// 主发送函数
export async function sendNotification(
  userId: string,
  orderId: string,
  type: NotificationType,
  vars: TemplateVariables,
  phone?: string,
  openid?: string
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  // 获取用户通知偏好
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      phone: true,
      wxOpenid: true,
      notificationPrefs: true,
    },
  });

  if (!user) {
    console.error(`[Notification] User ${userId} not found`);
    return [{ success: false, channel: 'SMS', error: 'User not found' }];
  }

  // 解析通知偏好
  const prefs = validateNotificationPrefs(user.notificationPrefs);

  const logData: Omit<NotificationLogData, 'status' | 'errorMessage' | 'channel'> = {
    userId,
    orderId,
    type,
    content: JSON.stringify(vars),
    retryCount: 0,
  };

  // 发送短信
  if (prefs[type].SMS && (phone || user.phone)) {
    const smsContent = smsTemplates[type](vars);
    const smsResult = await sendSMSWithRetry(phone || user.phone!, smsContent, {
      ...logData,
      channel: 'SMS',
    });
    results.push(smsResult);
  }

  // 发送微信订阅消息
  if (prefs[type].WECHAT && (openid || user.wxOpenid)) {
    const wechatResult = await sendWechatWithRetry(openid || user.wxOpenid!, type, vars, {
      ...logData,
      channel: 'WECHAT',
    });
    results.push(wechatResult);
  }

  return results;
}

// 异步发送通知（不阻塞主流程）
export function sendNotificationAsync(
  userId: string,
  orderId: string,
  type: NotificationType,
  vars: TemplateVariables,
  phone?: string,
  openid?: string
): void {
  // 使用 setImmediate 确保不阻塞当前事件循环
  setImmediate(async () => {
    try {
      await sendNotification(userId, orderId, type, vars, phone, openid);
    } catch (error) {
      console.error('[Notification] Async send failed:', error);
    }
  });
}

// 获取用户通知偏好
export async function getUserNotificationPrefs(userId: string): Promise<NotificationPrefs> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPrefs: true },
  });

  return validateNotificationPrefs(user?.notificationPrefs);
}

// 更新用户通知偏好
export async function updateUserNotificationPrefs(
  userId: string,
  prefs: NotificationPrefs
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { notificationPrefs: prefs },
  });
}

// 获取通知日志（用于调试和管理）
export function getNotificationLogs(
  userId?: string,
  limit: number = 100
): NotificationLogData[] {
  let logs = notificationLogs;
  if (userId) {
    logs = logs.filter((log) => log.userId === userId);
  }
  return logs.slice(-limit);
}

// 导出配置检查函数
export function checkNotificationConfig(): { sms: boolean; wechat: boolean; errors: string[] } {
  const errors: string[] = [];
  let sms = false;
  let wechat = false;

  // 检查 SMS 配置
  const smsProvider = process.env.SMS_PROVIDER || 'aliyun';
  if (smsProvider === 'aliyun') {
    if (!process.env.ALIYUN_ACCESS_KEY_ID) errors.push('Missing ALIYUN_ACCESS_KEY_ID');
    if (!process.env.ALIYUN_ACCESS_KEY_SECRET) errors.push('Missing ALIYUN_ACCESS_KEY_SECRET');
    if (!process.env.ALIYUN_SMS_SIGN_NAME) errors.push('Missing ALIYUN_SMS_SIGN_NAME');
    if (!errors.some((e) => e.includes('ALIYUN'))) sms = true;
  } else if (smsProvider === 'tencent') {
    if (!process.env.TENCENT_SECRET_ID) errors.push('Missing TENCENT_SECRET_ID');
    if (!process.env.TENCENT_SECRET_KEY) errors.push('Missing TENCENT_SECRET_KEY');
    if (!process.env.TENCENT_SMS_SIGN_NAME) errors.push('Missing TENCENT_SMS_SIGN_NAME');
    if (!process.env.TENCENT_SMS_APP_ID) errors.push('Missing TENCENT_SMS_APP_ID');
    if (!errors.some((e) => e.includes('TENCENT'))) sms = true;
  }

  // 检查微信配置
  if (!process.env.WECHAT_APP_ID) errors.push('Missing WECHAT_APP_ID');
  if (!process.env.WECHAT_SECRET) errors.push('Missing WECHAT_SECRET');
  if (!errors.some((e) => e.includes('WECHAT'))) wechat = true;

  return { sms, wechat, errors };
}

// 发送推荐奖励到账通知
export async function sendRewardNotification(
  referrerId: string,
  rewardAmount: number,
  refereeName: string | null,
  orderAmount: number,
  triggeredByOrderId: string
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  // 获取邀请人信息
  const referrer = await prisma.user.findUnique({
    where: { id: referrerId },
    select: {
      phone: true,
      wxOpenid: true,
      notificationPrefs: true,
    },
  });

  if (!referrer) {
    console.error(`[Notification] Referrer ${referrerId} not found`);
    return [{ success: false, channel: 'SMS', error: 'Referrer not found' }];
  }

  // 解析通知偏好
  const prefs = validateNotificationPrefs(referrer.notificationPrefs);

  const displayName = refereeName || '好友';
  const truncatedOrderId = triggeredByOrderId.slice(-6);

  const logData: Omit<NotificationLogData, 'status' | 'errorMessage' | 'channel'> = {
    userId: referrerId,
    orderId: triggeredByOrderId,
    type: 'REFERRAL_REWARD',
    content: JSON.stringify({ rewardAmount, refereeName: displayName, orderAmount }),
    retryCount: 0,
  };

  // 发送短信通知
  if (prefs.REFERRAL_REWARD.SMS && referrer.phone) {
    const smsContent = `【社区车位】恭喜！您邀请的${displayName}已完成首单，您获得推荐奖励¥${rewardAmount.toFixed(2)}元。奖励已到账，可前往"我的-推荐奖励"查看。`;
    const smsResult = await sendSMSWithRetry(referrer.phone, smsContent, {
      ...logData,
      channel: 'SMS',
    });
    results.push(smsResult);
  }

  // 发送微信订阅消息
  if (prefs.REFERRAL_REWARD.WECHAT && referrer.wxOpenid) {
    const templateData = {
      thing1: { value: `邀请${displayName}成功` },
      amount2: { value: `¥${rewardAmount.toFixed(2)}` },
      thing3: { value: `首单消费¥${orderAmount.toFixed(2)}` },
      character_string4: { value: truncatedOrderId },
    };

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const result = await sendWechatMessage(
        referrer.wxOpenid,
        '{{REFERRAL_REWARD_TEMPLATE_ID}}',
        templateData,
        '/user/rewards'
      );

      if (result.success) {
        logNotification({
          ...logData,
          status: 'SUCCESS',
          retryCount: attempt,
          channel: 'WECHAT',
        });
        results.push({ success: true, channel: 'WECHAT', messageId: result.messageId });
        break;
      }

      logNotification({
        ...logData,
        status: 'FAILED',
        errorMessage: result.error,
        retryCount: attempt,
        channel: 'WECHAT',
      });

      if (attempt === MAX_RETRIES) {
        results.push({ success: false, channel: 'WECHAT', error: result.error });
      } else {
        await delay(getRetryDelay(attempt));
      }
    }
  }

  return results;
}

// 异步发送奖励通知（不阻塞主流程）
export function sendRewardNotificationAsync(
  referrerId: string,
  rewardAmount: number,
  refereeName: string | null,
  orderAmount: number,
  triggeredByOrderId: string
): void {
  sendRewardNotification(referrerId, rewardAmount, refereeName, orderAmount, triggeredByOrderId)
    .catch((error) => {
      console.error('[Notification] Async reward send failed:', error);
    });
}
