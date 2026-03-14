#!/usr/bin/env tsx
/**
 * Comprehensive Seed Data Generator
 *
 * Generates realistic mock data for development and testing:
 * - 25 users (mix of owners, tenants, and admins)
 * - 60 parking spots across Beijing districts
 * - 40 orders with various statuses
 * - 15 referral records
 *
 * Usage:
 *   npx tsx scripts/seed.ts          # Seed all data
 *   npx tsx scripts/seed.ts --clean  # Reset then seed
 */

import { PrismaClient, UserRole, SpotStatus, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Beijing area coordinates (approximate centers for each district)
const beijingAreas = {
  朝阳区: { center: [116.4074, 39.9042], radius: 0.08 },
  海淀区: { center: [116.2974, 39.9592], radius: 0.1 },
  东城区: { center: [116.4174, 39.9292], radius: 0.04 },
  西城区: { center: [116.3674, 39.9142], radius: 0.04 },
  丰台区: { center: [116.2874, 39.8642], radius: 0.08 },
  石景山区: { center: [116.2274, 39.9062], radius: 0.05 },
  通州区: { center: [116.6574, 39.9092], radius: 0.08 },
  昌平区: { center: [116.2374, 40.2212], radius: 0.1 },
  大兴区: { center: [116.3474, 39.7282], radius: 0.09 },
  顺义区: { center: [116.6574, 40.1302], radius: 0.08 },
};

// Residential and commercial complex names
const complexNames = [
  "阳光花园", "万科金色家园", "龙湖天街", "富力城", "华贸中心",
  "万达广场", "中海紫御", "保利罗兰", "金茂府", "融创壹号",
  "华润橡树湾", "首开常青藤", "中铁建国际城", "绿地中心", "SOHO现代城",
  "中信城", "远洋山水", "合生国际", "世茂奥临", "盘古大观",
  "北辰世纪", "金地国际", "招商局大厦", "金融街中心", "国贸三期",
];

// Street names
const streetNames = [
  "建国路", "长安街", "中关村大街", "三里屯路", "望京街",
  "东直门外大街", "西单北大街", "王府井大街", "金融街", "CBD核心区",
  "五道口", "学院路", "知春路", "清华科技园", "上地信息路",
  "亦庄经济开发区", "丰台科技园", "石景山万达广场", "通州新城", "顺义空港",
];

// Spot title templates
const spotTitleTemplates = [
  "{complex}地下车位 {zone}-{number}",
  "{complex}地面车位 {zone}-{number}",
  "{street}附近停车位 {number}",
  "{complex}机械车位 {zone}-{number}",
  "{complex}VIP车位 {zone}-{number}",
];

// Description templates
const descriptionTemplates = [
  "靠近电梯口，方便进出，限高2.1米，适合轿车",
  "地面车位，有遮阳棚，方便进出",
  "商业区黄金位置，24小时开放，有监控",
  "科技园附近，工作日需求大，交通便利",
  "CBD核心区，价格较高，适合商务需求",
  "望京核心区，SOHO附近，创业人群聚集",
  "老城区稀缺车位，价格实惠，位置便利",
  "高校商圈，学生/教职工需求大",
  "小区内部车位，安全安静，有保安值守",
  "地下二层车位，冬暖夏凉，有充电桩",
  "立体车库，适合小型车，价格优惠",
  "地面固定车位，有地锁，长期出租优先",
];

// User names
const firstNames = [
  "伟", "芳", "娜", "秀英", "敏", "静", "丽", "强", "磊", "军",
  "洋", "勇", "艳", "杰", "娟", "涛", "明", "超", "秀兰", "霞",
  "平", "刚", "桂英", "文", "辉", "鑫", "宇", "博", "浩", "然",
];

const lastNames = [
  "李", "王", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴",
  "徐", "孙", "胡", "朱", "高", "林", "何", "郭", "马", "罗",
];

// Helper functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhone(): string {
  const prefixes = ["138", "139", "137", "136", "135", "134", "159", "158", "157", "150", "151", "152", "188", "187", "186", "185"];
  const prefix = randomItem(prefixes);
  const suffix = randomInt(10000000, 99999999).toString();
  return prefix + suffix;
}

function generateName(): string {
  const lastName = randomItem(lastNames);
  const firstName = randomItem(firstNames);
  return lastName + firstName;
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateCoordinates(district: string): [number, number] {
  const area = beijingAreas[district as keyof typeof beijingAreas] || beijingAreas["朝阳区"];
  const [centerLng, centerLat] = area.center;
  const radius = area.radius;

  const lng = centerLng + (Math.random() - 0.5) * 2 * radius;
  const lat = centerLat + (Math.random() - 0.5) * 2 * radius;

  return [parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))];
}

function generateSpotTitle(): string {
  const template = randomItem(spotTitleTemplates);
  const district = randomItem(Object.keys(beijingAreas));
  const complex = randomItem(complexNames);
  const street = randomItem(streetNames);
  const zone = String.fromCharCode(65 + randomInt(0, 25)); // A-Z
  const number = randomInt(1, 999).toString().padStart(2, "0");

  return template
    .replace("{complex}", complex)
    .replace("{street}", street)
    .replace("{district}", district)
    .replace("{zone}", zone)
    .replace("{number}", number);
}

function generateAddress(): string {
  const district = randomItem(Object.keys(beijingAreas));
  const street = randomItem(streetNames);
  const complex = randomItem(complexNames);
  const number = randomInt(1, 100);

  return `北京市${district}${street}${number}号${complex}`;
}

function generatePrice(): number {
  // Prices range from 2 to 15 yuan per hour
  const prices = [2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 10, 12, 15];
  return randomItem(prices);
}

// Data generators
async function generateUsers(count: number) {
  const users = [];
  const usedPhones = new Set<string>();
  const usedReferralCodes = new Set<string>();

  for (let i = 0; i < count; i++) {
    let phone = generatePhone();
    while (usedPhones.has(phone)) {
      phone = generatePhone();
    }
    usedPhones.add(phone);

    let referralCode = generateReferralCode();
    while (usedReferralCodes.has(referralCode)) {
      referralCode = generateReferralCode();
    }
    usedReferralCodes.add(referralCode);

    // Role distribution: 40% owners, 50% tenants, 10% admins
    const roleRoll = Math.random();
    let role: UserRole;
    if (roleRoll < 0.4) {
      role = "OWNER";
    } else if (roleRoll < 0.9) {
      role = "TENANT";
    } else {
      role = "ADMIN";
    }

    users.push({
      phone,
      role,
      name: generateName(),
      referralCode,
      wxOpenid: Math.random() > 0.3 ? `wx_${randomInt(10000000, 99999999)}` : null,
    });
  }

  return users;
}

async function generateParkingSpots(owners: { id: string }[], count: number) {
  const spots = [];

  for (let i = 0; i < count; i++) {
    const district = randomItem(Object.keys(beijingAreas));
    const [longitude, latitude] = generateCoordinates(district);
    const price = generatePrice();

    // Generate available hours
    const availableFrom = new Date();
    availableFrom.setHours(randomInt(0, 8), 0, 0, 0);
    const availableTo = new Date();
    availableTo.setHours(randomInt(18, 23), 59, 0, 0);

    // Status distribution: 70% available, 20% rented, 10% unavailable
    const statusRoll = Math.random();
    let status: SpotStatus;
    if (statusRoll < 0.7) {
      status = "AVAILABLE";
    } else if (statusRoll < 0.9) {
      status = "RENTED";
    } else {
      status = "UNAVAILABLE";
    }

    spots.push({
      ownerId: randomItem(owners).id,
      title: generateSpotTitle(),
      address: generateAddress(),
      longitude,
      latitude,
      pricePerHour: price,
      description: randomItem(descriptionTemplates),
      images: [],
      status,
      availableFrom,
      availableTo,
    });
  }

  return spots;
}

async function generateOrders(
  tenants: { id: string }[],
  spots: { id: string; pricePerHour: number }[],
  count: number
) {
  const orders = [];
  const usedCombinations = new Set<string>();

  for (let i = 0; i < count; i++) {
    const tenant = randomItem(tenants);
    const spot = randomItem(spots);
    const combinationKey = `${tenant.id}-${spot.id}`;

    // Avoid too many duplicate tenant-spot combinations
    if (usedCombinations.has(combinationKey) && Math.random() > 0.3) {
      continue;
    }
    usedCombinations.add(combinationKey);

    // Generate random time range
    const now = new Date();
    const daysOffset = randomInt(-30, 30);
    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() + daysOffset);
    startTime.setHours(randomInt(8, 18), randomInt(0, 59), 0, 0);

    const duration = randomInt(1, 8); // 1-8 hours
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + duration);

    const totalPrice = parseFloat((spot.pricePerHour * duration).toFixed(2));

    // Status based on time
    let status: OrderStatus;
    if (daysOffset < -1) {
      // Past orders
      status = Math.random() > 0.2 ? "COMPLETED" : "CANCELLED";
    } else if (daysOffset > 1) {
      // Future orders
      status = Math.random() > 0.3 ? "CONFIRMED" : "PENDING";
    } else {
      // Current orders
      status = Math.random() > 0.5 ? "IN_PROGRESS" : "CONFIRMED";
    }

    orders.push({
      spotId: spot.id,
      tenantId: tenant.id,
      startTime,
      endTime,
      totalPrice,
      status,
      note: Math.random() > 0.7 ? "请准时到达，谢谢合作" : null,
    });
  }

  return orders;
}

async function generateReferrals(
  users: { id: string; referralCode: string | null }[],
  count: number
) {
  const referrals = [];
  const usedReferees = new Set<string>();

  const referrers = users.filter((u) => u.referralCode);

  for (let i = 0; i < count; i++) {
    const referrer = randomItem(referrers);
    const referee = randomItem(users);

    if (referrer.id === referee.id || usedReferees.has(referee.id)) {
      continue;
    }
    usedReferees.add(referee.id);

    const status = Math.random() > 0.3 ? "completed" : "pending";
    const rewardAmount = status === "completed" ? randomInt(10, 50) : 0;

    referrals.push({
      referrerId: referrer.id,
      refereeId: referee.id,
      rewardAmount,
      status,
      rewardedAt: status === "completed" ? randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()) : null,
    });
  }

  return referrals;
}

// Main seed function
async function main() {
  const args = process.argv.slice(2);
  const shouldClean = args.includes("--clean");

  console.log("🌱 开始生成种子数据...\n");

  if (shouldClean) {
    console.log("🧹 清理现有数据...");
    await prisma.order.deleteMany();
    await prisma.referralRecord.deleteMany();
    await prisma.parkingSpot.deleteMany();
    await prisma.user.deleteMany();
    console.log("✅ 数据清理完成\n");
  }

  // 1. Create users
  console.log("👥 创建用户...");
  const userData = await generateUsers(25);
  const createdUsers = [];

  for (const user of userData) {
    const created = await prisma.user.upsert({
      where: { phone: user.phone },
      update: {},
      create: user,
    });
    createdUsers.push(created);
  }
  console.log(`✅ 创建了 ${createdUsers.length} 个用户`);

  // 2. Create parking spots
  console.log("\n🚗 创建车位...");
  const owners = createdUsers.filter((u) => u.role === "OWNER");
  if (owners.length === 0) {
    console.log("⚠️  没有业主用户，使用第一个用户作为业主");
    owners.push(createdUsers[0]);
  }

  const spotData = await generateParkingSpots(owners, 60);
  const createdSpots = [];

  for (const spot of spotData) {
    const created = await prisma.parkingSpot.create({ data: spot });
    createdSpots.push(created);
  }
  console.log(`✅ 创建了 ${createdSpots.length} 个车位`);

  // 3. Create orders
  console.log("\n📋 创建订单...");
  const tenants = createdUsers.filter((u) => u.role === "TENANT");
  if (tenants.length === 0) {
    console.log("⚠️  没有租户用户，使用非业主用户作为租户");
    tenants.push(...createdUsers.filter((u) => u.role !== "OWNER"));
  }

  const orderData = await generateOrders(
    tenants,
    createdSpots.map((s) => ({ id: s.id, pricePerHour: parseFloat(s.pricePerHour.toString()) })),
    40
  );
  const createdOrders = [];

  for (const order of orderData) {
    const created = await prisma.order.create({ data: order });
    createdOrders.push(created);
  }
  console.log(`✅ 创建了 ${createdOrders.length} 个订单`);

  // 4. Create referrals
  console.log("\n🎁 创建邀请记录...");
  const referralData = await generateReferrals(createdUsers, 15);
  const createdReferrals = [];

  for (const referral of referralData) {
    const created = await prisma.referralRecord.create({
      data: referral as any,
    });
    createdReferrals.push(created);
  }
  console.log(`✅ 创建了 ${createdReferrals.length} 个邀请记录`);

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 种子数据生成完成！");
  console.log("=".repeat(50));
  console.log(`👤 用户: ${createdUsers.length}`);
  console.log(`   - 业主: ${createdUsers.filter((u) => u.role === "OWNER").length}`);
  console.log(`   - 租户: ${createdUsers.filter((u) => u.role === "TENANT").length}`);
  console.log(`   - 管理员: ${createdUsers.filter((u) => u.role === "ADMIN").length}`);
  console.log(`🚗 车位: ${createdSpots.length}`);
  console.log(`📋 订单: ${createdOrders.length}`);
  console.log(`🎁 邀请: ${createdReferrals.length}`);
  console.log("=".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ 种子数据生成失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
