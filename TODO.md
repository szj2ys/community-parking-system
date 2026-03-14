> !! 请勿提交此文件 !!

# T0-invite · Phase 0

> 用户能够查看自己的邀请码、分享邀请链接、查看邀请奖励记录

## 上下文

- **依赖**: 无 - referral system backend 已存在
- **边界**: 不修改 lib/referral.ts 核心逻辑，仅添加 UI

## Tasks

### 1. 创建用户邀请页面

- [ ] 创建 `app/user/invites/page.tsx`
- **功能**:
  - 显示用户自己的邀请码（从 /api/user/referrals 获取）
  - 一键复制邀请码
  - 生成分享链接（微信/复制链接）
  - 显示邀请统计数据：已邀请人数、已获得奖励、待发放奖励
  - 显示邀请记录列表（被邀请人、注册时间、奖励状态）
- **UI设计**:
  - 顶部：邀请码卡片（大字体显示 CPXXXXXX 格式）
  - 中部：统计数据（3列：已邀请/已奖励/待发放）
  - 底部：邀请记录列表
  - 分享按钮：复制链接、微信分享（模拟）

### 2. 添加导航入口

- [ ] 在 `app/page.tsx` 添加"我的邀请"快捷入口卡片
- **位置**: 在 Quick Actions 区域，根据角色显示

### 3. 完善邀请 API

- [ ] 检查 `app/api/user/referrals/route.ts` 返回数据是否完整
- **需要字段**:
  - referralCode: 用户自己的邀请码
  - stats: { totalInvited, totalRewarded, pendingRewards }
  - records: [{ id, refereeName, status, rewardAmount, createdAt }]

## Done When

- [ ] 所有 Tasks checkbox 已勾选
- [ ] `npm run build` 无报错
- [ ] 页面能正常访问 /user/invites
- [ ] 邀请码正确显示
- [ ] 分享功能工作正常

---

### 验收标准

**场景**: 用户访问邀请页面
- **Given**: 用户已登录且有邀请码
- **When**: 访问 /user/invites
- **Then**: 看到自己的邀请码、统计数据、邀请记录

**场景**: 用户分享邀请
- **Given**: 用户在邀请页面
- **When**: 点击"复制链接"
- **Then**: 链接格式为 `https://parking.app/auth/login?ref=CPXXXXXX`

### 测试

- 组件测试: 邀请码显示、复制按钮、统计数据渲染
- 集成测试: 访问页面获取数据流程
