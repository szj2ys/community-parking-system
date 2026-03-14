import { Metadata } from "next";

// Base URL configuration
export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://parking.example.com";

// Default SEO configuration
export const defaultSEO = {
  title: "社区车位租赁 - 连接车位业主与租户的智能平台",
  description: "发现附近闲置车位，轻松解决停车难题。业主发布车位赚取收益，租户按小时租赁灵活便捷。让闲置车位创造价值。",
  keywords: ["车位租赁", "社区停车", "共享车位", "小时租", "停车", "车位出租", "附近车位", "闲置车位"],
  siteName: "社区车位租赁",
  locale: "zh_CN",
  twitterHandle: "@parkingapp",
};

// Meta tags generator interface
export interface MetaTagsOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  twitterCard?: "summary" | "summary_large_image";
  noIndex?: boolean;
  noFollow?: boolean;
}

/**
 * Generate comprehensive meta tags for SEO
 */
export function generateMetaTags(options: MetaTagsOptions = {}): Metadata {
  const {
    title = defaultSEO.title,
    description = defaultSEO.description,
    keywords = defaultSEO.keywords,
    canonicalUrl,
    ogImage = `${BASE_URL}/api/og`,
    ogType = "website",
    twitterCard = "summary_large_image",
    noIndex = false,
    noFollow = false,
  } = options;

  const fullTitle = title.includes(defaultSEO.siteName) ? title : `${title} - ${defaultSEO.siteName}`;

  const robots = [];
  if (noIndex) robots.push("noindex");
  if (noFollow) robots.push("nofollow");

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(", "),
    authors: [{ name: defaultSEO.siteName }],
    creator: defaultSEO.siteName,
    publisher: defaultSEO.siteName,
    robots: robots.length > 0 ? robots.join(", ") : "index, follow",
    openGraph: {
      type: ogType,
      locale: defaultSEO.locale,
      siteName: defaultSEO.siteName,
      title: fullTitle,
      description,
      url: canonicalUrl || BASE_URL,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: twitterCard,
      title: fullTitle,
      description,
      images: [ogImage],
      creator: defaultSEO.twitterHandle,
    },
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    metadataBase: new URL(BASE_URL),
  };
}

// Schema.org structured data types
export interface OrganizationData {
  name: string;
  description: string;
  url: string;
  logo?: string;
  sameAs?: string[];
}

export interface WebSiteData {
  name: string;
  description: string;
  url: string;
  searchUrl?: string;
}

export interface LocalBusinessData {
  name: string;
  description: string;
  url: string;
  image?: string;
  telephone?: string;
  priceRange?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
}

export interface PlaceData {
  name: string;
  description?: string;
  address: string;
  geo?: {
    latitude: number;
    longitude: number;
  };
}

export type StructuredDataType = "Organization" | "WebSite" | "LocalBusiness" | "Place";

/**
 * Generate Schema.org structured data (JSON-LD)
 */
export function generateStructuredData(
  type: StructuredDataType,
  data: OrganizationData | WebSiteData | LocalBusinessData | PlaceData
): object {
  const base = {
    "@context": "https://schema.org",
    "@type": type,
  };

  switch (type) {
    case "Organization":
      const orgData = data as OrganizationData;
      return {
        ...base,
        name: orgData.name,
        description: orgData.description,
        url: orgData.url,
        ...(orgData.logo && { logo: orgData.logo }),
        ...(orgData.sameAs && { sameAs: orgData.sameAs }),
      };

    case "WebSite":
      const webData = data as WebSiteData;
      const websiteStructured: Record<string, unknown> = {
        ...base,
        name: webData.name,
        description: webData.description,
        url: webData.url,
      };
      if (webData.searchUrl) {
        websiteStructured.potentialAction = {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: webData.searchUrl,
          },
          "query-input": {
            "@type": "PropertyValueSpecification",
            valueRequired: true,
            valueName: "search_term_string",
          },
        };
      }
      return websiteStructured;

    case "LocalBusiness":
      const bizData = data as LocalBusinessData;
      return {
        ...base,
        "@type": "ParkingFacility",
        name: bizData.name,
        description: bizData.description,
        url: bizData.url,
        ...(bizData.image && { image: bizData.image }),
        ...(bizData.telephone && { telephone: bizData.telephone }),
        ...(bizData.priceRange && { priceRange: bizData.priceRange }),
        ...(bizData.address && {
          address: {
            "@type": "PostalAddress",
            ...bizData.address,
          },
        }),
        ...(bizData.geo && {
          geo: {
            "@type": "GeoCoordinates",
            latitude: bizData.geo.latitude,
            longitude: bizData.geo.longitude,
          },
        }),
        ...(bizData.openingHours && { openingHours: bizData.openingHours }),
      };

    case "Place":
      const placeData = data as PlaceData;
      return {
        ...base,
        name: placeData.name,
        ...(placeData.description && { description: placeData.description }),
        address: {
          "@type": "PostalAddress",
          streetAddress: placeData.address,
        },
        ...(placeData.geo && {
          geo: {
            "@type": "GeoCoordinates",
            latitude: placeData.geo.latitude,
            longitude: placeData.geo.longitude,
          },
        }),
      };

    default:
      return base;
  }
}

// Sitemap URL entry interface
export interface SitemapUrl {
  url: string;
  lastModified?: Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

/**
 * Generate XML sitemap content
 */
export function generateSitemap(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map(
      ({ url, lastModified, changeFrequency, priority }) => {
        const lastMod = lastModified
          ? `<lastmod>${lastModified.toISOString()}</lastmod>`
          : "";
        const changeFreq = changeFrequency
          ? `<changefreq>${changeFrequency}</changefreq>`
          : "";
        const prio = priority !== undefined ? `<priority>${priority.toFixed(1)}</priority>` : "";

        return `  <url>
    <loc>${url}</loc>
    ${lastMod}
    ${changeFreq}
    ${prio}
  </url>`;
      }
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string, baseUrl: string = BASE_URL): string {
  // Remove trailing slash from path except for root
  const cleanPath = path === "/" ? "/" : path.replace(/\/$/, "");
  // Remove trailing slash from baseUrl
  const cleanBase = baseUrl.replace(/\/$/, "");
  return `${cleanBase}${cleanPath}`;
}

/**
 * Generate area page SEO data
 */
export function generateAreaSEO(
  areaName: string,
  areaSlug: string,
  spotCount: number,
  priceRange: { min: number; max: number }
): { title: string; description: string; keywords: string[]; canonicalUrl: string } {
  return {
    title: `${areaName}车位租赁 - ${spotCount}个车位可租`,
    description: `${areaName}附近${spotCount}个闲置车位可租，价格${priceRange.min}元-${priceRange.max}元/小时。社区车位租赁平台，让车位业主轻松出租，租户灵活停车。`,
    keywords: [
      `${areaName}车位`,
      `${areaName}停车`,
      `${areaName}车位出租`,
      `${areaName}车位租赁`,
      `${areaName}共享车位`,
      `${areaName}附近车位`,
      "车位租赁",
      "社区停车",
      "共享车位",
    ],
    canonicalUrl: generateCanonicalUrl(`/areas/${areaSlug}`),
  };
}

/**
 * Generate Open Graph image URL
 */
export function generateOGImageUrl(params: {
  title: string;
  subtitle?: string;
  spotCount?: number;
}): string {
  const { title, subtitle, spotCount } = params;
  const searchParams = new URLSearchParams();
  searchParams.set("title", title);
  if (subtitle) searchParams.set("subtitle", subtitle);
  if (spotCount !== undefined) searchParams.set("spots", spotCount.toString());

  return `${BASE_URL}/api/og?${searchParams.toString()}`;
}
