> !! 请勿提交此文件 !!

# T0-image · Phase 0

> 用户能够上传车位照片，让租户更直观地了解车位情况

## 上下文

- **依赖**: T0-map 已合入 main（地图选址功能已完成）
- **边界**: 本 Track 不修改地图相关代码，专注图片上传功能

## Tasks

### 1. 安装 Vercel Blob SDK

- [x] 安装 `@vercel/blob` 依赖
- **文件**: `package.json`
- **验收**: `npm install` 成功，SDK 可用

### 2. 创建图片上传 API

- [x] 创建 `/api/upload` API route，使用 Vercel Blob 处理图片上传
- **文件**: `app/api/upload/route.ts`（新建）
- **验收**: POST 请求能接收图片文件，返回图片 URL
- **测试**: 上传图片后返回可访问的 URL

### 3. 创建图片上传组件

- [x] 创建可复用的 ImageUploader 组件，支持多图上传、预览、删除
- **文件**: `components/ImageUploader.tsx`（新建）
- **验收**:
  - 支持点击或拖拽上传
  - 支持多图（最多5张）
  - 显示上传进度和预览
  - 可删除已选图片
- **测试**: 组件渲染正常，交互流畅

### 4. 集成到车位发布页

- [x] 在 owner/publish 页面添加图片上传区域
- **文件**: `app/owner/publish/page.tsx`
- **验收**:
  - 页面显示图片上传组件
  - 发布时图片 URL 随表单一起提交
  - 支持编辑时修改图片（通过 PATCH API）

### 5. 更新数据库 Schema

- [x] ParkingSpot 模型已有 images 字段存储图片 URL 数组
- **文件**: `prisma/schema.prisma`
- **验收**: 无需迁移，字段已存在

### 6. 更新车位详情页展示图片

- [x] 在车位详情页显示图片轮播/画廊
- **文件**: `app/parking-spots/[id]/page.tsx`
- **验收**: 有图片时显示图片画廊，无图片时显示占位图

实现好后需要使用 code-simplifier agent 进行代码优化。

## Done When

- [ ] 所有 Tasks checkbox 已勾选
- [ ] `npm run build` 无报错
- [ ] `npx tsc --noEmit` 无类型错误
- [ ] 手动测试：上传图片 → 发布车位 → 查看详情页显示图片

## 测试规约

| 变更类型          | 要求                           |
| ----------------- | ------------------------------ |
| 工具函数 / 纯逻辑 | 单元测试：核心路径 + 边界 case |
| UI 组件           | 组件测试：渲染 + 交互 + 状态   |
| 跨模块 / API 交互 | 集成测试：模拟完整用户流程     |
| 合入 main 前      | 冒烟测试：构建 + 全量测试通过  |
