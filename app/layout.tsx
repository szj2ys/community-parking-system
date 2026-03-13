import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "社区车位租赁",
  description: "连接车位业主与租户的智能平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
