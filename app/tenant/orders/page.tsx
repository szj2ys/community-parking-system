import type { Metadata } from "next";
import TenantOrdersClient from "./TenantOrdersClient";

export const metadata: Metadata = {
  title: "我的预订 - 社区车位租赁",
  description: "查看您的车位预订记录，管理待确认、已确认和已完成的订单。随时取消或查看订单详情。",
  keywords: ["我的预订", "订单管理", "车位订单", "预订记录", "租户中心"],
  alternates: {
    canonical: "/tenant/orders",
  },
};

export default function TenantOrdersPage() {
  return <TenantOrdersClient />;
}
