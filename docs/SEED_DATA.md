# 种子数据管理指南

本文档说明社区停车系统的种子数据生成和管理方式。

## 快速开始

### 生成种子数据

```bash
# 使用 Prisma 种子（推荐用于开发环境）
npx prisma db seed

# 或使用独立脚本（功能更丰富）
npx tsx scripts/seed.ts

# 清理现有数据后重新生成
npx tsx scripts/seed.ts --clean
```

### 重置数据库

```bash
# 仅重置（删除所有数据）
npx tsx scripts/reset-db.ts --force

# 重置并重新生成种子数据
npx tsx scripts/reset-db.ts --seed
```

## 数据内容

种子数据包含以下模拟数据：

### 用户 (25个)
- **业主 (OWNER)**: 40% (约10个)
- **租户 (TENANT)**: 50% (约12个)
- **管理员 (ADMIN)**: 10% (约3个)

每个用户包含：
- 真实格式的手机号 (13XXXXXXXXX)
- 中文姓名 (随机姓氏+名字)
- 唯一邀请码 (6位字母数字)
- 可选的微信openid

### 车位 (60个)
覆盖北京主要区域：
- 朝阳区、海淀区、东城区、西城区
- 丰台区、石景山区、通州区
- 昌平区、大兴区、顺义区

每个车位包含：
- 真实小区/商圈名称
- 详细地址和坐标
- 每小时价格 (2-15元)
- 可用时间段
- 状态：可租/已租/暂不出租

### 订单 (40个)
- 随机时间范围（过去30天到未来30天）
- 多种订单状态：待确认、已确认、进行中、已完成、已取消
- 自动计算总价

### 邀请记录 (15个)
- 用户邀请关系
- 奖励金额 (10-50元)
- 状态：待完成/已完成

## API 批量导入

管理员可通过 API 批量导入数据：

### 导入数据

```bash
POST /api/admin/seed
Content-Type: application/json

{
  "users": [
    {
      "phone": "13800138000",
      "name": "张三",
      "role": "OWNER",
      "referralCode": "ABC123"
    }
  ],
  "parkingSpots": [
    {
      "title": "阳光花园车位 A-01",
      "address": "北京市朝阳区阳光花园",
      "longitude": 116.4074,
      "latitude": 39.9042,
      "pricePerHour": 5.0,
      "status": "AVAILABLE",
      "ownerPhone": "13800138000"
    }
  ],
  "orders": [
    {
      "spotTitle": "阳光花园车位 A-01",
      "tenantPhone": "13900139000",
      "startTime": "2024-01-15T08:00:00Z",
      "endTime": "2024-01-15T18:00:00Z",
      "totalPrice": 50.0,
      "status": "CONFIRMED"
    }
  ]
}
```

### 清空数据

```bash
DELETE /api/admin/seed?confirm=true
```

响应：
```json
{
  "success": true,
  "deleted": {
    "orders": 40,
    "referrals": 15,
    "spots": 60,
    "users": 25
  }
}
```

## 数据结构

### 用户角色
- `OWNER` - 车位业主，可发布车位
- `TENANT` - 车位租户，可预订车位
- `ADMIN` - 管理员，可管理平台

### 车位状态
- `AVAILABLE` - 可租
- `RENTED` - 已租
- `UNAVAILABLE` - 暂不出租

### 订单状态
- `PENDING` - 待确认
- `CONFIRMED` - 已确认
- `IN_PROGRESS` - 进行中
- `COMPLETED` - 已完成
- `CANCELLED` - 已取消
- `REJECTED` - 已拒绝

## 数据生成逻辑

### 坐标生成
每个区域的坐标在中心点周围随机生成，确保数据分布真实：
```typescript
// 朝阳区中心坐标
const center = [116.4074, 39.9042];
const radius = 0.08; // 随机偏移范围
```

### 价格生成
根据区域和车位类型，价格范围：
- 普通小区：2-5元/小时
- 商圈/写字楼：6-10元/小时
- CBD核心区：10-15元/小时

### 订单时间生成
- 过去订单：历史数据，状态多为已完成或已取消
- 当前订单：正在进行或已确认
- 未来订单：待确认或已确认

## 注意事项

1. **生产环境**: 种子数据脚本仅在开发环境使用，生产环境应禁用
2. **数据冲突**: 使用 `--clean` 或 `DELETE /api/admin/seed` 时，所有数据将被清除
3. **外键约束**: 删除数据时按 orders → referrals → spots → users 顺序进行
4. **唯一性**: 手机号和邀请码会保持唯一，重复导入会自动跳过

## 扩展种子数据

如需添加更多种子数据，可编辑以下文件：

- `prisma/seed.ts` - Prisma 种子脚本
- `scripts/seed.ts` - 独立种子脚本（功能更丰富）
- `scripts/reset-db.ts` - 数据库重置脚本

修改 `generateUsers()`, `generateParkingSpots()`, `generateOrders()` 中的数量参数即可。
