import { describe, it, expect } from "vitest";
import {
  seoAreas,
  getAreaBySlug,
  getAreasByCity,
  getAllAreaSlugs,
  calculateDistance,
  findNearestArea,
} from "./seo-areas";

describe("SEO Areas Data", () => {
  describe("seoAreas", () => {
    it("should have 20 areas defined", () => {
      expect(seoAreas.length).toBe(20);
    });

    it("should have unique slugs", () => {
      const slugs = seoAreas.map((area) => area.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    it("should have unique IDs", () => {
      const ids = seoAreas.map((area) => area.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have valid coordinates", () => {
      seoAreas.forEach((area) => {
        expect(area.centerLatitude).toBeGreaterThan(-90);
        expect(area.centerLatitude).toBeLessThan(90);
        expect(area.centerLongitude).toBeGreaterThan(-180);
        expect(area.centerLongitude).toBeLessThan(180);
      });
    });

    it("should have valid price ranges", () => {
      seoAreas.forEach((area) => {
        expect(area.priceRange.min).toBeGreaterThan(0);
        expect(area.priceRange.max).toBeGreaterThan(area.priceRange.min);
      });
    });

    it("should have keywords for each area", () => {
      seoAreas.forEach((area) => {
        expect(area.keywords.length).toBeGreaterThan(0);
        expect(area.keywords.some((k) => k.includes(area.name))).toBe(true);
      });
    });

    it("should have landmarks for each area", () => {
      seoAreas.forEach((area) => {
        expect(area.landmarks.length).toBeGreaterThan(0);
      });
    });

    it("should include Beijing areas", () => {
      const beijingAreas = seoAreas.filter((area) => area.city === "北京");
      expect(beijingAreas.length).toBeGreaterThanOrEqual(5);
      expect(beijingAreas.some((a) => a.slug === "zhongguancun")).toBe(true);
      expect(beijingAreas.some((a) => a.slug === "guomao")).toBe(true);
    });

    it("should include Shanghai areas", () => {
      const shanghaiAreas = seoAreas.filter((area) => area.city === "上海");
      expect(shanghaiAreas.length).toBeGreaterThanOrEqual(5);
      expect(shanghaiAreas.some((a) => a.slug === "lujiazui")).toBe(true);
      expect(shanghaiAreas.some((a) => a.slug === "zhangjiang")).toBe(true);
    });

    it("should include Shenzhen areas", () => {
      const shenzhenAreas = seoAreas.filter((area) => area.city === "深圳");
      expect(shenzhenAreas.length).toBeGreaterThanOrEqual(3);
    });

    it("should include Hangzhou areas", () => {
      const hangzhouAreas = seoAreas.filter((area) => area.city === "杭州");
      expect(hangzhouAreas.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("getAreaBySlug", () => {
    it("should return area by slug", () => {
      const area = getAreaBySlug("zhongguancun");
      expect(area).toBeDefined();
      expect(area?.name).toBe("中关村");
      expect(area?.city).toBe("北京");
    });

    it("should return undefined for invalid slug", () => {
      const area = getAreaBySlug("invalid-slug");
      expect(area).toBeUndefined();
    });
  });

  describe("getAreasByCity", () => {
    it("should return areas for a city", () => {
      const beijingAreas = getAreasByCity("北京");
      expect(beijingAreas.length).toBeGreaterThan(0);
      beijingAreas.forEach((area) => {
        expect(area.city).toBe("北京");
      });
    });

    it("should return empty array for non-existent city", () => {
      const areas = getAreasByCity("不存在的城市");
      expect(areas).toEqual([]);
    });
  });

  describe("getAllAreaSlugs", () => {
    it("should return all slugs", () => {
      const slugs = getAllAreaSlugs();
      expect(slugs.length).toBe(seoAreas.length);
      expect(slugs).toContain("zhongguancun");
      expect(slugs).toContain("lujiazui");
    });
  });

  describe("calculateDistance", () => {
    it("should calculate distance between two points", () => {
      // Distance between Beijing and Shanghai is roughly 1067 km
      const distance = calculateDistance(39.9042, 116.4074, 31.2304, 121.4737);
      expect(distance).toBeGreaterThan(1000);
      expect(distance).toBeLessThan(1100);
    });

    it("should return 0 for same coordinates", () => {
      const distance = calculateDistance(39.9042, 116.4074, 39.9042, 116.4074);
      expect(distance).toBe(0);
    });
  });

  describe("findNearestArea", () => {
    it("should find nearest area to coordinates", () => {
      // Coordinates near Zhongguancun
      const result = findNearestArea(39.985, 116.32);
      expect(result).toBeDefined();
      expect(result?.area.slug).toBe("zhongguancun");
      expect(result?.distance).toBeLessThan(5); // Less than 5km
    });

    it("should find nearest area to Shanghai coordinates", () => {
      const result = findNearestArea(31.23, 121.47);
      expect(result).toBeDefined();
      expect(result?.area.city).toBe("上海");
    });
  });
});
