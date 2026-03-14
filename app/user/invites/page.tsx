import type { Metadata } from "next";
import InvitesClient from "./InvitesClient";

export const metadata: Metadata = {
  title: "我的邀请 - 社区车位租赁",
  description: "邀请好友加入社区车位租赁平台，赚取推荐奖励。分享您的专属邀请码，好友完成首单您即可获得奖励。",
  keywords: ["邀请好友", "推荐奖励", "分享赚钱", "邀请码", "推广活动"],
  alternates: {
    canonical: "/user/invites",
  },
};

export default function InvitesPage() {
  return <InvitesClient />;
}
