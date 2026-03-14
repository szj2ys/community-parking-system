import { prisma } from "./prisma";
import { OrderStatus } from "@prisma/client";

/**
 * 检查单个车位在指定时间段内的可用性
 *
 * @param spotId - 车位ID
 * @param startTime - 开始时间
 * @param endTime - 结束时间
 * @returns 是否可用（true=可用，false=已被预订）
 */
export async function checkSpotAvailability(
  spotId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  // 验证时间参数
  if (startTime >= endTime) {
    throw new Error("结束时间必须晚于开始时间");
  }

  // 查询是否有时间重叠的订单
  // 时间重叠条件：order.startTime < query.endTime AND order.endTime > query.startTime
  const conflictingOrder = await prisma.order.findFirst({
    where: {
      spotId,
      status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true },
  });

  return conflictingOrder === null;
}

/**
 * 批量检查多个车位的可用性
 *
 * @param spotIds - 车位ID数组
 * @param startTime - 开始时间
 * @param endTime - 结束时间
 * @returns 可用车位ID集合
 */
export async function checkBatchAvailability(
  spotIds: string[],
  startTime: Date,
  endTime: Date
): Promise<Set<string>> {
  if (spotIds.length === 0) {
    return new Set();
  }

  // 验证时间参数
  if (startTime >= endTime) {
    throw new Error("结束时间必须晚于开始时间");
  }

  // 查询所有冲突订单
  const conflictingOrders = await prisma.order.findMany({
    where: {
      spotId: { in: spotIds },
      status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { spotId: true },
  });

  const unavailableSpotIds = new Set(conflictingOrders.map(o => o.spotId));

  // 返回可用的车位ID
  return new Set(spotIds.filter(id => !unavailableSpotIds.has(id)));
}

/**
 * 获取车位指定时间段内的所有预订订单
 *
 * @param spotId - 车位ID
 * @param startTime - 开始时间
 * @param endTime - 结束时间
 * @returns 订单列表（仅包含阻塞状态的订单）
 */
export async function getSpotBookings(
  spotId: string,
  startTime: Date,
  endTime: Date
) {
  return prisma.order.findMany({
    where: {
      spotId,
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
}

/**
 * 检测两个时间段是否重叠
 *
 * @param start1 - 第一个时间段的开始时间
 * @param end1 - 第一个时间段的结束时间
 * @param start2 - 第二个时间段的开始时间
 * @param end2 - 第二个时间段的结束时间
 * @returns 是否重叠
 */
export function isTimeOverlapping(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * 获取"立即可用"的默认时间范围（从当前时间起1小时内）
 *
 * @returns [startTime, endTime] 元组
 */
export function getImmediateAvailabilityWindow(): [Date, Date] {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  return [now, oneHourLater];
}
