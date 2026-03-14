"use client";

import Script from "next/script";

interface LocalBusinessData {
  name: string;
  description: string;
  url: string;
  image?: string;
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
  telephone?: string;
  priceRange?: string;
}

interface ProductData {
  name: string;
  description: string;
  image?: string;
  price: number;
  priceCurrency?: string;
  availability?: string;
  url: string;
  address?: string;
  ownerName?: string | null;
}

interface WebSiteData {
  name: string;
  description: string;
  url: string;
  searchUrl?: string;
}

/**
 * LocalBusiness structured data for parking spots
 * Helps with local SEO and Google Maps visibility
 */
export function LocalBusinessStructuredData({
  name,
  description,
  url,
  image,
  address,
  geo,
  telephone,
  priceRange = "$$",
}: LocalBusinessData) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    description,
    url,
    image,
    priceRange,
    ...(address && {
      address: {
        "@type": "PostalAddress",
        ...address,
      },
    }),
    ...(geo && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: geo.latitude,
        longitude: geo.longitude,
      },
    }),
    ...(telephone && { telephone }),
  };

  return (
    <Script
      id="local-business-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * Product structured data for individual parking spots
 * Enables rich snippets with price and availability
 */
export function ProductStructuredData({
  name,
  description,
  image,
  price,
  priceCurrency = "CNY",
  availability = "https://schema.org/InStock",
  url,
  address,
  ownerName,
}: ProductData) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image,
    url,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency,
      availability,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      url,
    },
    ...(address && {
      locationCreated: {
        "@type": "Place",
        address: address,
      },
    }),
    ...(ownerName && {
      manufacturer: {
        "@type": "Person",
        name: ownerName,
      },
    }),
  };

  return (
    <Script
      id="product-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * WebSite structured data for the homepage
 * Enables site name in search results
 */
export function WebSiteStructuredData({
  name,
  description,
  url,
  searchUrl,
}: WebSiteData) {
  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    description,
    url,
  };

  if (searchUrl) {
    structuredData.potentialAction = {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: searchUrl,
      },
      "query-input": {
        "@type": "PropertyValueSpecification",
        valueRequired: true,
        valueName: "search_term_string",
      },
    };
  }

  return (
    <Script
      id="website-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * Organization structured data
 * Helps establish brand entity in search results
 */
export function OrganizationStructuredData({
  name = "社区车位租赁",
  description = "连接车位业主与租户的智能平台",
  url = "https://parking.example.com",
  logo = "https://parking.example.com/logo.png",
  sameAs = [],
}: {
  name?: string;
  description?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    description,
    url,
    logo,
    sameAs,
  };

  return (
    <Script
      id="organization-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
