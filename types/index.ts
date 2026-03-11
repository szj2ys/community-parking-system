// 用户角色
export enum UserRole {
  OWNER = 'OWNER',
  TENANT = 'TENANT',
  ADMIN = 'ADMIN',
}

// 用户类型
export interface User {
  id: string;
  phone: string;
  wxOpenid?: string;
  role: UserRole;
  name?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 车位状态
export enum SpotStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  UNAVAILABLE = 'UNAVAILABLE',
}

// 车位类型
export interface ParkingSpot {
  id: string;
  ownerId: string;
  title: string;
  address: string;
  longitude: number;
  latitude: number;
  pricePerHour: number;
  description?: string;
  images: string[];
  status: SpotStatus;
  availableFrom?: Date;
  availableTo?: Date;
  createdAt: Date;
  updatedAt: Date;
  owner?: User;
}

// 订单状态
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

// 订单类型
export interface Order {
  id: string;
  spotId: string;
  tenantId: string;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  status: OrderStatus;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
  spot?: ParkingSpot;
  tenant?: User;
}

// API 统一响应格式
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
