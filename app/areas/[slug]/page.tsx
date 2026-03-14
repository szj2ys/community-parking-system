import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAreaBySlug, type AreaData } from "@/data/seo-areas";
import { generateAreaSEO, generateStructuredData, generateCanonicalUrl, BASE_URL } from "@/lib/seo";
import { ProductStructuredData } from "@/components/StructuredData";

interface AreaPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// ISR revalidation period - daily
export const revalidate = 86400;

// Generate static params for all areas at build time
export async function generateStaticParams() {
  const { getAllAreaSlugs } = await import("@/data/seo-areas");
  const slugs = getAllAreaSlugs();

  return slugs.map((slug) => ({
    slug,
  }));
}

// Generate metadata for each area page
export async function generateMetadata({ params }: AreaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const area = getAreaBySlug(slug);

  if (!area) {
    return {
      title: "区域未找到 - 社区车位租赁",
      robots: "noindex",
    };
  }

  // Get spot count for this area
  const spotCount = await getAreaSpotCount(area);

  const seo = generateAreaSEO(area.name, area.slug, spotCount, area.priceRange);

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords.join(", "),
    alternates: {
      canonical: seo.canonicalUrl,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.canonicalUrl,
      type: "website",
      locale: "zh_CN",
      siteName: "社区车位租赁",
      images: [
        {
          url: `${BASE_URL}/api/og?title=${encodeURIComponent(area.name)}&spots=${spotCount}`,
          width: 1200,
          height: 630,
          alt: `${area.name}车位租赁`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [`${BASE_URL}/api/og?title=${encodeURIComponent(area.name)}&spots=${spotCount}`],
    },
  };
}

// Get spot count for an area
async function getAreaSpotCount(area: AreaData): Promise<number> {
  try {
    const { calculateDistance } = await import("@/data/seo-areas");

    // Get all available spots
    const spots = await prisma.parkingSpot.findMany({
      where: {
        status: "AVAILABLE",
      },
      select: {
        latitude: true,
        longitude: true,
      },
    });

    // Count spots within area radius
    return spots.filter((spot) => {
      const distance = calculateDistance(
        area.centerLatitude,
        area.centerLongitude,
        spot.latitude,
        spot.longitude
      );
      return distance <= area.radius;
    }).length;
  } catch {
    // Return 0 if database is not available (e.g., during build)
    return 0;
  }
}

// Get spots for an area
async function getAreaSpots(area: AreaData) {
  try {
    const { calculateDistance } = await import("@/data/seo-areas");

    const spots = await prisma.parkingSpot.findMany({
      where: {
        status: "AVAILABLE",
      },
      include: {
        owner: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter and sort by distance
    return spots
      .map((spot) => ({
        ...spot,
        distance: calculateDistance(
          area.centerLatitude,
          area.centerLongitude,
          spot.latitude,
          spot.longitude
        ),
      }))
      .filter((spot) => spot.distance <= area.radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);
  } catch {
    // Return empty array if database is not available (e.g., during build)
    return [];
  }
}

export default async function AreaPage({ params }: AreaPageProps) {
  const { slug } = await params;
  const area = getAreaBySlug(slug);

  if (!area) {
    notFound();
  }

  const [spots, spotCount] = await Promise.all([
    getAreaSpots(area),
    getAreaSpotCount(area),
  ]);

  const canonicalUrl = generateCanonicalUrl(`/areas/${area.slug}`);

  // Generate structured data
  const localBusinessStructuredData = generateStructuredData("LocalBusiness", {
    name: `${area.name}车位租赁`,
    description: area.description,
    url: canonicalUrl,
    priceRange: `¥${area.priceRange.min}-${area.priceRange.max}`,
    address: {
      addressLocality: area.city,
      addressRegion: area.province,
      addressCountry: "CN",
    },
    geo: {
      latitude: area.centerLatitude,
      longitude: area.centerLongitude,
    },
  });

  const placeStructuredData = generateStructuredData("Place", {
    name: area.name,
    description: area.description,
    address: `${area.city}${area.name}`,
    geo: {
      latitude: area.centerLatitude,
      longitude: area.centerLongitude,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data - Using safe JSON serialization */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(placeStructuredData),
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-blue-600">
              首页
            </Link>
            <span>&gt;</span>
            <span>{area.city}</span>
            <span>&gt;</span>
            <span className="text-gray-900">{area.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {area.name}车位租赁
          </h1>
          <p className="text-gray-600 mt-1">
            {area.description.slice(0, 100)}...
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Area Info */}
        <section className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">区域信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{spotCount}</div>
              <div className="text-gray-600 text-sm">可租车位</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ¥{area.priceRange.min}-{area.priceRange.max}
              </div>
              <div className="text-gray-600 text-sm">价格区间（元/小时）</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{area.radius}</div>
              <div className="text-gray-600 text-sm">覆盖半径（公里）</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{area.city}</div>
              <div className="text-gray-600 text-sm">所属城市</div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">交通便利度</h3>
            <p className="text-gray-600">{area.transportInfo}</p>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">周边地标</h3>
            <div className="flex flex-wrap gap-2">
              {area.landmarks.map((landmark) => (
                <span
                  key={landmark}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {landmark}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Spots List */}
        <section>
          <h2 className="text-xl font-semibold mb-4">
            {area.name}附近可租车位
            <span className="text-gray-500 text-base font-normal ml-2">
              （共 {spots.length} 个）
            </span>
          </h2>

          {spots.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                暂无可用车位
              </h3>
              <p className="text-gray-600">
                {area.name}附近暂时没有找到可租车位，您可以查看其他区域或稍后再来
              </p>
              <Link
                href="/tenant/map"
                className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                查看地图找车位
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spots.map((spot) => (
                <article
                  key={spot.id}
                  className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow"
                >
                  <Link href={`/parking-spots/${spot.id}`}>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                          {spot.title}
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          可租
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {spot.address}
                      </p>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold text-blue-600">
                          ¥{spot.pricePerHour.toString()}
                          <span className="text-sm text-gray-500 font-normal">/小时</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          距中心 {(spot as unknown as { distance: number }).distance.toFixed(1)} km
                        </span>
                      </div>

                      {spot.description && (
                        <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                          {spot.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm text-gray-500">
                          业主: {spot.owner.name || spot.owner.phone.slice(-4)}
                        </span>
                        <span className="text-blue-600 text-sm font-medium">
                          立即预订 →
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Product Structured Data for each spot */}
                  <ProductStructuredData
                    name={spot.title}
                    description={spot.description || `${area.name}附近车位出租`}
                    url={`${BASE_URL}/parking-spots/${spot.id}`}
                    price={Number(spot.pricePerHour)}
                    priceCurrency="CNY"
                    availability="https://schema.org/InStock"
                    address={spot.address}
                    ownerName={spot.owner.name}
                  />
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Area Description */}
        <section className="mt-12 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">关于{area.name}</h2>
          <p className="text-gray-700 leading-relaxed">{area.description}</p>

          <div className="mt-6">
            <h3 className="font-semibold mb-3">热门关键词</h3>
            <div className="flex flex-wrap gap-2">
              {area.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">有闲置车位？</h2>
          <p className="text-blue-100 mb-6">
            加入社区车位租赁平台，让您的闲置车位创造收益
          </p>
          <Link
            href="/owner/publish"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100"
          >
            发布车位
          </Link>
        </section>
      </main>
    </div>
  );
}
