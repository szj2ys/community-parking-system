import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicSpotById } from "@/lib/data";
import ParkingSpotDetailClient from "@/components/ParkingSpotDetailClient";
import { ProductStructuredData, LocalBusinessStructuredData } from "@/components/StructuredData";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const spot = await getPublicSpotById(id);

  if (!spot) {
    return {
      title: "车位不存在 - 社区车位租赁",
      description: "抱歉，您访问的车位不存在或已被删除。",
    };
  }

  const title = `${spot.title} - ¥${spot.pricePerHour}/小时 - 社区车位租赁`;
  const description = `${spot.address} ${spot.description ? spot.description.slice(0, 100) : "优质车位出租，价格实惠，预订便捷"}`;
  const imageUrl = spot.images && spot.images.length > 0
    ? spot.images[0]
    : "/og-default.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: spot.title,
        },
      ],
      locale: "zh_CN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `/parking-spots/${spot.id}`,
    },
  };
}

export default async function ParkingSpotDetailPage({ params }: PageProps) {
  const { id } = await params;
  const spot = await getPublicSpotById(id);

  if (!spot) {
    notFound();
  }

  const imageUrl = spot.images && spot.images.length > 0 ? spot.images[0] : "/og-default.png";
  const availability = spot.status === "AVAILABLE" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  return (
    <>
      <ProductStructuredData
        name={spot.title}
        description={spot.description || `位于${spot.address}的优质车位`}
        image={imageUrl}
        price={Number(spot.pricePerHour)}
        availability={availability}
        url={`https://parking.example.com/parking-spots/${spot.id}`}
        address={spot.address}
        ownerName={spot.owner?.name}
      />
      <LocalBusinessStructuredData
        name={spot.title}
        description={spot.description || `位于${spot.address}的优质车位`}
        url={`https://parking.example.com/parking-spots/${spot.id}`}
        image={imageUrl}
        address={{
          streetAddress: spot.address,
        }}
        priceRange={`¥${spot.pricePerHour}/小时`}
      />
      <ParkingSpotDetailClient spot={spot} />
    </>
  );
}
