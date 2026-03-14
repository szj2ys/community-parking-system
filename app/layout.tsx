import type { Metadata, Viewport } from "next";
import Script from "next/script";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { WebSiteStructuredData, OrganizationStructuredData } from "@/components/StructuredData";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "社区车位租赁 - 连接车位业主与租户的智能平台",
    template: "%s - 社区车位租赁",
  },
  description: "发现附近闲置车位，轻松解决停车难题。业主发布车位赚取收益，租户按小时租赁灵活便捷。",
  keywords: ["车位租赁", "社区停车", "共享车位", "小时租", "停车", "车位出租", "附近车位"],
  authors: [{ name: "社区车位租赁" }],
  creator: "社区车位租赁",
  publisher: "社区车位租赁",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "社区车位租赁",
    title: "社区车位租赁 - 连接车位业主与租户的智能平台",
    description: "发现附近闲置车位，轻松解决停车难题。业主发布车位赚取收益，租户按小时租赁灵活便捷。",
    url: "https://parking.example.com",
    images: [
      {
        url: "https://parking.example.com/og-default.png",
        width: 1200,
        height: 630,
        alt: "社区车位租赁",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "社区车位租赁 - 连接车位业主与租户的智能平台",
    description: "发现附近闲置车位，轻松解决停车难题。业主发布车位赚取收益，租户按小时租赁灵活便捷。",
    images: ["https://parking.example.com/og-default.png"],
  },
  alternates: {
    canonical: "https://parking.example.com",
  },
  metadataBase: new URL("https://parking.example.com"),
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
      <body className="antialiased">
        <WebSiteStructuredData
          name="社区车位租赁"
          description="连接车位业主与租户的智能平台"
          url="https://parking.example.com"
          searchUrl="https://parking.example.com/tenant/list?search={search_term_string}"
        />
        <OrganizationStructuredData />
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
