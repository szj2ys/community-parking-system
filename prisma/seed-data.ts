// 社区车位租赁系统 - 种子数据
// 在 Prisma Studio 或数据库控制台执行

export const seedParkingSpots = [
  {
    title: "阳光花园地下车位 B-101",
    address: "北京市朝阳区阳光花园小区地下停车场 B区101号",
    longitude: 116.4074,
    latitude: 39.9042,
    pricePerHour: 5.00,
    description: "靠近电梯口，方便进出，限高2.1米，适合轿车",
    status: "AVAILABLE",
    availableFrom: "08:00",
    availableTo: "22:00",
  },
  {
    title: "万科金色家园地面车位 A-05",
    address: "北京市海淀区万科金色家园地面停车场 A区05号",
    longitude: 116.3974,
    latitude: 39.9142,
    pricePerHour: 3.50,
    description: "地面车位，有遮阳棚，方便货车进出",
    status: "AVAILABLE",
    availableFrom: "00:00",
    availableTo: "23:59",
  },
  {
    title: "万达广场写字楼车位 L3-88",
    address: "北京市朝阳区万达广场写字楼地下三层 L3-88",
    longitude: 116.4574,
    latitude: 39.9242,
    pricePerHour: 8.00,
    description: "商业区黄金位置，24小时开放，有监控",
    status: "AVAILABLE",
    availableFrom: "00:00",
    availableTo: "23:59",
  },
  {
    title: "中关村软件园车位 C-203",
    address: "北京市海淀区中关村软件园地下停车场 C区203号",
    longitude: 116.3074,
    latitude: 39.9842,
    pricePerHour: 6.00,
    description: "科技园附近，工作日需求大，周末可长租",
    status: "AVAILABLE",
    availableFrom: "07:00",
    availableTo: "20:00",
  },
  {
    title: "国贸CBD车位 D-15",
    address: "北京市朝阳区国贸CBD地下停车场 D区15号",
    longitude: 116.4474,
    latitude: 39.9042,
    pricePerHour: 10.00,
    description: "CBD核心区，价格较高，适合商务需求",
    status: "AVAILABLE",
    availableFrom: "06:00",
    availableTo: "23:00",
  },
  {
    title: "望京SOHO车位 E-66",
    address: "北京市朝阳区望京SOHO地下停车场 E区66号",
    longitude: 116.4874,
    latitude: 39.9942,
    pricePerHour: 7.00,
    description: "望京核心区，SOHO附近，创业人群聚集",
    status: "AVAILABLE",
    availableFrom: "08:00",
    availableTo: "21:00",
  },
  {
    title: "东直门小区地面车位 F-12",
    address: "北京市东城区东直门内小区地面停车场 F-12号",
    longitude: 116.4274,
    latitude: 39.9342,
    pricePerHour: 4.00,
    description: "老城区稀缺车位，价格实惠",
    status: "AVAILABLE",
    availableFrom: "07:00",
    availableTo: "22:00",
  },
  {
    title: "五道口商圈车位 G-33",
    address: "北京市海淀区五道口购物中心地下停车场 G-33号",
    longitude: 116.3374,
    latitude: 39.9942,
    pricePerHour: 6.50,
    description: "高校商圈，学生/教职工需求大",
    status: "AVAILABLE",
    availableFrom: "09:00",
    availableTo: "22:00",
  },
];

// 执行说明：
// 1. 先创建业主用户
// INSERT INTO users (id, phone, role, name, created_at, updated_at)
// VALUES ('seed-owner-001', '13800138000', 'OWNER', '种子业主', NOW(), NOW());
//
// 2. 然后插入车位数据
// INSERT INTO parking_spots (...) VALUES (...);
