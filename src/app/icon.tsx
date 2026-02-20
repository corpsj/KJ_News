import { ImageResponse } from "next/og";
import { SITE_URL } from "@/lib/constants";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const logoUrl = `${SITE_URL}/brand/KJ_Logo.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
        }}
      >
        <img
          src={logoUrl}
          alt="광전타임즈"
          width={30}
          height={30}
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { ...size },
  );
}
