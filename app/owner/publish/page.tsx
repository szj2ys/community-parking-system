import type { Metadata } from "next";
import PublishClient from "./PublishClient";

export const metadata: Metadata = {
  title: "发布车位 - 社区车位租赁",
  description: "发布您的闲置车位，设置价格和可用时间，让闲置资源创造价值。轻松赚取额外收入。",
  keywords: ["发布车位", "车位出租", "共享车位", "闲置车位赚钱", "社区车位"],
  alternates: {
    canonical: "/owner/publish",
  },
};

export default function PublishPage() {
  return <PublishClient />;
}
