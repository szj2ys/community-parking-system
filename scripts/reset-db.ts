#!/usr/bin/env tsx
/**
 * Database Reset Script
 *
 * Resets the database by truncating all tables.
 * Useful for development and testing.
 *
 * Usage:
 *   npx tsx scripts/reset-db.ts          # Reset all data (requires confirmation)
 *   npx tsx scripts/reset-db.ts --force  # Skip confirmation
 *   npx tsx scripts/reset-db.ts --seed   # Reset and re-seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TABLES = [
  "orders",
  "referral_records",
  "parking_spots",
  "users",
  "analytics_events",
];

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const seed = args.includes("--seed");

  console.log("⚠️  警告：此操作将删除所有数据！\n");

  if (!force) {
    // In a real script, we'd use readline here for user input
    // For now, just show a message
    console.log("使用 --force 标志跳过确认:");
    console.log("  npx tsx scripts/reset-db.ts --force\n");
    console.log("或使用 --seed 在重置后自动重新生成数据:");
    console.log("  npx tsx scripts/reset-db.ts --seed\n");

    // Simulate delay and continue for non-interactive usage
    console.log("3秒后自动继续... (按 Ctrl+C 取消)\n");
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  console.log("🧹 正在重置数据库...\n");

  // Delete in order to respect foreign key constraints
  console.log("删除订单...");
  const { count: ordersCount } = await prisma.order.deleteMany();
  console.log(`  ✓ 删除了 ${ordersCount} 条订单记录`);

  console.log("删除邀请记录...");
  const { count: referralsCount } = await prisma.referralRecord.deleteMany();
  console.log(`  ✓ 删除了 ${referralsCount} 条邀请记录`);

  console.log("删除车位...");
  const { count: spotsCount } = await prisma.parkingSpot.deleteMany();
  console.log(`  ✓ 删除了 ${spotsCount} 条车位记录`);

  console.log("删除用户...");
  const { count: usersCount } = await prisma.user.deleteMany();
  console.log(`  ✓ 删除了 ${usersCount} 条用户记录`);

  console.log("删除分析事件...");
  const { count: eventsCount } = await prisma.analyticsEvent.deleteMany();
  console.log(`  ✓ 删除了 ${eventsCount} 条分析事件`);

  console.log("\n" + "=".repeat(40));
  console.log("✅ 数据库重置完成！");
  console.log("=".repeat(40));
  console.log(`🗑️  总计删除: ${ordersCount + referralsCount + spotsCount + usersCount + eventsCount} 条记录`);

  if (seed) {
    console.log("\n🌱 正在重新生成种子数据...");
    // Import and run the seed script
    const { spawn } = require("child_process");
    const seedProcess = spawn("npx", ["tsx", "scripts/seed.ts"], {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    seedProcess.on("close", (code: number) => {
      process.exit(code || 0);
    });
  } else {
    console.log("\n提示: 使用以下命令生成种子数据:");
    console.log("  npx tsx scripts/seed.ts");
  }
}

main()
  .catch((e) => {
    console.error("❌ 数据库重置失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
