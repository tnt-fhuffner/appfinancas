import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

const BACKGROUND = "#c4785a"
const FOREGROUND = "#fff8f0"

export async function brandIconImage(size: number) {
  const fontData = await readFile(
    join(process.cwd(), "src/app/fonts/NunitoSans-Bold.ttf")
  )
  const fontSize = Math.round(size * (size <= 48 ? 0.4 : 0.33))

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BACKGROUND,
          color: FOREGROUND,
          fontSize,
          fontFamily: "Nunito Sans",
          fontWeight: 700,
          letterSpacing: size <= 48 ? "-0.04em" : "-0.06em",
        }}
      >
        nós
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [
        {
          name: "Nunito Sans",
          data: fontData,
          weight: 700,
          style: "normal",
        },
      ],
    }
  )
}
