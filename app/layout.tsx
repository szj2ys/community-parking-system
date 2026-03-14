import type { Metadata } from "next";
import Script from "next/script";
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
      <head>
        <Script id="amap-security-config" strategy="beforeInteractive">
          {`window._AMapSecurityConfig = { securityJsCode: '${process.env.NEXT_PUBLIC_AMAP_SECURITY_CONFIG || ""}' }`}
        </Script>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
