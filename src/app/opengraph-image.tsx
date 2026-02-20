import { ImageResponse } from "next/og";
import { SITE_URL } from "@/lib/constants";

export const runtime = "edge";
export const alt = "광전타임즈";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const logoUrl = `${SITE_URL}/brand/KJ_Logo.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
        }}
      >
        <img src={logoUrl} width={480} height={270} alt="광전타임즈" />

        <div
          style={{
            display: "flex",
            width: 100,
            height: 2,
            marginTop: 28,
            background: "linear-gradient(to right, #1B3764, #8B2332)",
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 20,
            fontWeight: 400,
            color: "#666",
            marginTop: 20,
            letterSpacing: "0.08em",
          }}
        >
          KWANGJEON TIMES
        </div>
      </div>
    ),
    { ...size },
  );
}
