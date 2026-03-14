import type { Metadata } from "next";
import SpotsClient from "./SpotsClient";

export const metadata: Metadata = {
  title: "我的车位 - 社区车位租赁",
  description: "管理您发布的车位，查看出租状态、编辑信息、上下架操作。轻松掌控所有车位资源。",
  keywords: ["我的车位", "车位管理", "车位状态", "出租管理", "业主中心"],
  alternates: {
    canonical: "/owner/spots",
  },
};

export default function SpotsPage() {
  return <SpotsClient />;
}
