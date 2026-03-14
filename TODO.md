> !! 请勿提交此文件 !!

# T0-analytics · Phase 0

> 实现真实的数据收集，将用户行为数据发送到后端存储

## 上下文

- **依赖**: 无 - analytics lib 已存在但只打印到 console
- **边界**: 不删除现有 console.log，添加后端存储

## Tasks

### 1. 创建 Analytics API

- [ ] 创建 `app/api/analytics/route.ts`
- **功能**:
  - POST: 接收事件数据 { event, properties, userId, timestamp }
  - 存储到数据库 (AnalyticsEvent 表)
  - 验证事件类型白名单
- [ ] 更新 `prisma/schema.prisma` 添加 AnalyticsEvent 模型
- **模型字段**:
  - id: cuid
  - event: string (事件名)
  - properties: JSON (事件属性)
  - userId: string? (可选，关联用户)
  - sessionId: string
  - pathname: string (页面路径)
  - createdAt: DateTime

### 2. 更新 Analytics Lib

- [ ] 修改 `lib/analytics.ts`
- **改动**:
  - sendEvent 函数改为调用 /api/analytics
  - 保持 console.log 在 development 模式
  - 添加队列机制防止请求堆积
  - 错误处理：发送失败不阻塞用户操作

### 3. 添加页面浏览追踪

- [ ] 更新 `components/AnalyticsProvider.tsx`
- **确保**:
  - 所有页面自动追踪 page_view
  - 包含 pathname, referrer, userAgent 信息

### 4. 运行迁移

- [ ] `npx prisma migrate dev --name add_analytics`
- [ ] `npx prisma generate`

## Done When

- [ ] 所有 Tasks checkbox 已勾选
- [ ] `npm run build` 无报错
- [ ] `npx tsc --noEmit` 通过
- [ ] API 能接收并存储事件
- [ ] 页面浏览自动记录

---

### 验收标准

**场景**: 用户访问页面
- **Given**: 用户浏览任意页面
- **When**: 页面加载完成
- **Then**: AnalyticsEvent 表中增加 page_view 记录

**场景**: 用户点击按钮
- **Given**: 用户点击"立即预订"
- **When**: 点击事件发生
- **Then**: AnalyticsEvent 表中增加 button_click 记录

### 测试

- API 测试: POST /api/analytics 返回 200
- 集成测试: 浏览页面后数据库有记录
