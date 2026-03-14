import type { Metadata } from "next";
import OrdersClient from "./OrdersClient";

export const metadata: Metadata = {
  title: "预订管理 - 社区车位租赁",
  description: "管理租户的预订请求，确认或拒绝订单，跟踪订单状态。高效管理您的车位出租业务。",
  keywords: ["预订管理", "订单处理", "车位订单", "出租管理", "业主中心"],
  alternates: {
    canonical: "/owner/orders",
  },
};

export default function OrdersPage() {
  return <OrdersClient />;
}
