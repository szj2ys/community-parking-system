import type { Metadata } from "next";
import ListSearchClient from "./ListSearchClient";

export const metadata: Metadata = {
  title: "列表找车位",
  description: "按距离、价格筛选附近可用车位。找到最适合您的社区停车位，按小时租赁，价格实惠。",
  keywords: ["找车位", "车位列表", "附近停车", "按小时租车位", "社区车位"],
  openGraph: {
    title: "列表找车位 - 社区车位租赁",
    description: "按距离、价格筛选附近可用车位。找到最适合您的社区停车位。",
    type: "website",
  },
  alternates: {
    canonical: "/tenant/list",
  },
};

export default function ListSearchPage() {
  return <ListSearchClient />;
}
