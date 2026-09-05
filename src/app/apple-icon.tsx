import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#c4785a",
          color: "#fff8f0",
          fontSize: 58,
          fontWeight: 700,
        }}
      >
        nós
      </div>
    ),
    { ...size }
  )
}
