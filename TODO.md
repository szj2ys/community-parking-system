> !! 请勿提交此文件 !!

# T0-map · Phase 0

> 用户能在真实地图上查看车位位置，业主发布时可在地图选址

## 上下文

- **依赖**: 无
- **边界**: 不修改认证系统、订单系统
- **高德地图**: 使用 JS API 2.0，需要申请 Key

## Tasks

### 1. 集成高德地图 JS API

- [ ] 申请高德地图 Key（Web端 JS API）
- [ ] 创建 `components/map/` 目录
- [ ] 实现 `MapContainer` 组件（基础地图容器）
- [ ] 实现 `MapMarker` 组件（车位标记）
- [ ] 在 `app/layout.tsx` 添加高德地图脚本
- **文件**: `components/map/MapContainer.tsx`（新建）
- **验收**: Given 地图组件挂载, When 页面加载, Then 显示真实地图
- **测试**: 组件测试 · `should render map when API loaded`

### 2. 实现车位标记展示

- [ ] 在地图上显示多个车位标记
- [ ] 标记显示价格（¥X/小时）
- [ ] 点击标记显示车位详情卡片
- [ ] 标记聚合（当车位密集时）
- **文件**: `components/map/ParkingSpotMarkers.tsx`（新建）
- **验收**: Given 多个车位坐标, When 地图渲染, Then 正确显示所有标记
- **测试**: 组件测试 · `should show price on marker`

### 3. 替换租户地图页面

- [ ] 修改 `app/tenant/map/page.tsx`
- [ ] 移除 emoji 模拟地图
- [ ] 集成真实地图组件
- [ ] 侧边栏列表与地图联动（点击列表项地图定位）
- **文件**: `app/tenant/map/page.tsx`（修改）
- **验收**: Given 用户访问地图页, When 授权定位, Then 显示真实地图和附近车位
- **测试**: E2E测试 · `should display real map with spots`

### 4. 业主发布页地图选址

- [ ] 修改 `app/owner/publish/page.tsx`
- [ ] 添加地图选址组件（可拖拽标记选位置）
- [ ] 选择位置后自动回填经纬度字段
- [ ] 地址解析（反向地理编码）
- **文件**: `app/owner/publish/page.tsx`（修改）
- **验收**: Given 业主发布车位, When 在地图选择位置, Then 自动填充经纬度和地址
- **测试**: 组件测试 · `should update coordinates on marker drag`

## Done When

- [ ] 所有 Tasks checkbox 已勾选
- [ ] `npm run build` 无报错
- [ ] 地图页显示真实高德地图
- [ ] 发布页可在地图选址
- [ ] 无 lint / type 错误

---

### 技术方案

```bash
# 高德地图 Key 配置（添加到 .env）
NEXT_PUBLIC_AMAP_KEY=your_amap_key
```

**组件设计**:
```tsx
// components/map/MapContainer.tsx
interface MapContainerProps {
  center: { lat: number; lng: number };
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  children?: React.ReactNode;
}

// components/map/ParkingSpotMarker.tsx
interface MarkerProps {
  position: { lat: number; lng: number };
  price: number;
  onClick?: () => void;
}
```

**依赖库**:
- `@amap/amap-jsapi-loader` - 高德地图加载器

---

### 测试规约

| 变更类型 | 要求 |
|---------|------|
| 地图组件 | 组件测试：渲染 + 交互 + 加载状态 |
| 页面集成 | E2E测试：完整用户流程 |
| API 调用 | 单元测试：高德 API 封装 |
