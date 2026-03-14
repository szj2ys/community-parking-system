import type { Metadata } from "next";
import MapSearchClient from "./MapSearchClient";

export const metadata: Metadata = {
  title: "地图找车位",
  description: "在地图上发现附近可用车位。实时查看车位位置、价格和距离，轻松找到最近的社区停车位。",
  keywords: ["地图找车位", "附近停车", "车位地图", "社区停车", "实时车位"],
  openGraph: {
    title: "地图找车位 - 社区车位租赁",
    description: "在地图上发现附近可用车位。实时查看车位位置、价格和距离。",
    type: "website",
  },
  alternates: {
    canonical: "/tenant/map",
  },
};

export default function MapSearchPage() {
  return <MapSearchClient />;
}
