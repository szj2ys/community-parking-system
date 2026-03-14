import { describe, it, expect } from "vitest";
import {
  generateMetaTags,
  generateStructuredData,
  generateSitemap,
  generateCanonicalUrl,
  generateAreaSEO,
  generateOGImageUrl,
  BASE_URL,
  type StructuredDataType,
} from "./seo";

describe("SEO Utils", () => {
  describe("generateMetaTags", () => {
    it("should generate valid meta tags with default values", () => {
      const meta = generateMetaTags();

      expect(meta.title).toContain("社区车位租赁");
      expect(meta.description).toContain("发现附近闲置车位");
      expect(meta.keywords).toContain("车位租赁");
      expect(meta.openGraph).toBeDefined();
      expect(meta.twitter).toBeDefined();
    });

    it("should generate valid meta tags with custom values", () => {
      const meta = generateMetaTags({
        title: "中关村车位租赁",
        description: "中关村附近车位出租",
        keywords: ["中关村车位", "中关村停车"],
        canonicalUrl: "https://example.com/areas/zhongguancun",
      });

      expect(meta.title).toBe("中关村车位租赁 - 社区车位租赁");
      expect(meta.description).toBe("中关村附近车位出租");
      expect(meta.keywords).toBe("中关村车位, 中关村停车");
      expect(meta.alternates?.canonical).toBe("https://example.com/areas/zhongguancun");
    });

    it("should handle noIndex and noFollow", () => {
      const meta = generateMetaTags({
        noIndex: true,
        noFollow: true,
      });

      expect(meta.robots).toBe("noindex, nofollow");
    });

    it("should include Open Graph data", () => {
      const meta = generateMetaTags({
        title: "Test Title",
        ogType: "article",
      });

      expect(meta.openGraph?.type).toBe("article");
      expect(meta.openGraph?.title).toContain("Test Title");
    });
  });

  describe("generateStructuredData", () => {
    it("should generate valid Organization structured data", () => {
      const data = generateStructuredData("Organization", {
        name: "社区车位租赁",
        description: "连接车位业主与租户",
        url: "https://example.com",
        logo: "https://example.com/logo.png",
      });

      expect(data).toEqual({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "社区车位租赁",
        description: "连接车位业主与租户",
        url: "https://example.com",
        logo: "https://example.com/logo.png",
      });
    });

    it("should generate valid WebSite structured data", () => {
      const data = generateStructuredData("WebSite", {
        name: "社区车位租赁",
        description: "连接车位业主与租户",
        url: "https://example.com",
        searchUrl: "https://example.com/search?q={search_term_string}",
      });

      expect(data["@context"]).toBe("https://schema.org");
      expect(data["@type"]).toBe("WebSite");
      expect(data.name).toBe("社区车位租赁");
      expect(data.potentialAction).toBeDefined();
    });

    it("should generate valid LocalBusiness structured data", () => {
      const data = generateStructuredData("LocalBusiness", {
        name: "中关村车位租赁",
        description: "中关村附近车位",
        url: "https://example.com/areas/zhongguancun",
        priceRange: "¥8-25",
        address: {
          addressLocality: "北京",
          addressRegion: "北京市",
          addressCountry: "CN",
        },
        geo: {
          latitude: 39.9845,
          longitude: 116.315,
        },
      });

      expect(data["@type"]).toBe("ParkingFacility");
      expect(data.geo).toEqual({
        "@type": "GeoCoordinates",
        latitude: 39.9845,
        longitude: 116.315,
      });
    });

    it("should generate valid Place structured data", () => {
      const data = generateStructuredData("Place", {
        name: "中关村",
        description: "北京科技园区",
        address: "北京市海淀区中关村",
        geo: {
          latitude: 39.9845,
          longitude: 116.315,
        },
      });

      expect(data["@type"]).toBe("Place");
      expect(data.address).toEqual({
        "@type": "PostalAddress",
        streetAddress: "北京市海淀区中关村",
      });
    });
  });

  describe("generateSitemap", () => {
    it("should generate valid XML sitemap", () => {
      const urls = [
        {
          url: "https://example.com/",
          lastModified: new Date("2024-01-01"),
          changeFrequency: "daily" as const,
          priority: 1.0,
        },
        {
          url: "https://example.com/areas/zhongguancun",
          changeFrequency: "weekly" as const,
          priority: 0.8,
        },
      ];

      const sitemap = generateSitemap(urls);

      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(sitemap).toContain("<loc>https://example.com/</loc>");
      expect(sitemap).toContain("<loc>https://example.com/areas/zhongguancun</loc>");
      expect(sitemap).toContain("<changefreq>daily</changefreq>");
      expect(sitemap).toContain("<priority>1.0</priority>");
    });

    it("should handle URLs without optional fields", () => {
      const urls = [
        {
          url: "https://example.com/simple",
        },
      ];

      const sitemap = generateSitemap(urls);

      expect(sitemap).toContain("<loc>https://example.com/simple</loc>");
      expect(sitemap).not.toContain("<lastmod>");
      expect(sitemap).not.toContain("<changefreq>");
      expect(sitemap).not.toContain("<priority>");
    });
  });

  describe("generateCanonicalUrl", () => {
    it("should generate canonical URL with base URL", () => {
      const url = generateCanonicalUrl("/areas/zhongguancun", "https://example.com");
      expect(url).toBe("https://example.com/areas/zhongguancun");
    });

    it("should handle root path", () => {
      const url = generateCanonicalUrl("/", "https://example.com");
      expect(url).toBe("https://example.com/");
    });

    it("should remove trailing slashes from path", () => {
      const url = generateCanonicalUrl("/areas/zhongguancun/", "https://example.com/");
      expect(url).toBe("https://example.com/areas/zhongguancun");
    });
  });

  describe("generateAreaSEO", () => {
    it("should generate SEO data for an area", () => {
      const seo = generateAreaSEO("中关村", "zhongguancun", 15, { min: 8, max: 25 });

      expect(seo.title).toBe("中关村车位租赁 - 15个车位可租");
      expect(seo.description).toContain("中关村附近15个闲置车位可租");
      expect(seo.description).toContain("价格8元-25元/小时");
      expect(seo.keywords).toContain("中关村车位");
      expect(seo.keywords).toContain("中关村停车");
      expect(seo.keywords).toContain("车位租赁");
      expect(seo.canonicalUrl).toBe(`${BASE_URL}/areas/zhongguancun`);
    });
  });

  describe("generateOGImageUrl", () => {
    it("should generate OG image URL with all params", () => {
      const url = generateOGImageUrl({
        title: "中关村车位租赁",
        subtitle: "15个车位可租",
        spotCount: 15,
      });

      expect(url).toContain("/api/og?");
      expect(url).toContain("title=%E4%B8%AD%E5%85%B3%E6%9D%91%E8%BD%A6%E4%BD%8D%E7%A7%9F%E8%B5%81");
      expect(url).toContain("subtitle=15%E4%B8%AA%E8%BD%A6%E4%BD%8D%E5%8F%AF%E7%A7%9F");
      expect(url).toContain("spots=15");
    });

    it("should generate OG image URL with minimal params", () => {
      const url = generateOGImageUrl({
        title: "车位租赁",
      });

      expect(url).toContain("title=%E8%BD%A6%E4%BD%8D%E7%A7%9F%E8%B5%81");
      expect(url).not.toContain("subtitle");
      expect(url).not.toContain("spots");
    });
  });
});
