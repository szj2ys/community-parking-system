import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get("title") || "社区车位租赁";
    const subtitle = searchParams.get("subtitle") || "连接车位业主与租户的智能平台";
    const spotCount = searchParams.get("spots");

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "60px",
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Main content container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: "24px",
              padding: "60px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              maxWidth: "1000px",
              width: "100%",
            }}
          >
            {/* Logo / Icon */}
            <div
              style={{
                fontSize: "80px",
                marginBottom: "30px",
              }}
            >
              🚗
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: "64px",
                fontWeight: "bold",
                color: "#1a202c",
                marginBottom: "20px",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "32px",
                color: "#4a5568",
                marginBottom: "30px",
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </p>

            {/* Spot count badge */}
            {spotCount && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  padding: "16px 32px",
                  borderRadius: "50px",
                  color: "white",
                  fontSize: "28px",
                  fontWeight: "600",
                }}
              >
                <span>📍</span>
                <span>{spotCount} 个车位可租</span>
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                marginTop: "40px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                fontSize: "24px",
                color: "#718096",
              }}
            >
              <span>社区车位租赁平台</span>
              <span style={{ color: "#cbd5e0" }}>|</span>
              <span>让闲置车位创造价值</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("OG Image generation error:", e);
    return new Response("Failed to generate image", { status: 500 });
  }
}
