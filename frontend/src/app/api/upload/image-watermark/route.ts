import sharp from "sharp";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File; // main image
    const watermarkType = formData.get("watermarkType") as string; // text | logo
    const watermarkText = formData.get("watermarkText") as string;
    const watermarkLogo = formData.get("watermarkLogo") as File; // FILE
    const position = (formData.get("position") as string) || "bottom-right";

    if (!file) {
      return new Response(JSON.stringify({ error: "No image uploaded" }), {
        status: 400,
      });
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    let watermarkBuffer;

    /* -------- TEXT WATERMARK -------- */
    /* -------- TEXT WATERMARK -------- */
    if (watermarkType === "text") {
      // Calculate dynamic font size (e.g., 5% of the smaller dimension)
      const fontSize = Math.floor(Math.min(metadata.width, metadata.height) * 0.05);

      let x = "50%";
      let y = "50%";
      let textAnchor = "middle";
      let dominantBaseline = "middle";

      // Map position to SVG coordinates
      switch (position) {
        case "top-left":
          x = "5%";
          y = "5%";
          textAnchor = "start";
          dominantBaseline = "hanging";
          break;
        case "top-right":
          x = "95%";
          y = "5%";
          textAnchor = "end";
          dominantBaseline = "hanging";
          break;
        case "bottom-left":
          x = "5%";
          y = "95%";
          textAnchor = "start";
          dominantBaseline = "auto"; // distinct from 'text-after-edge'
          break;
        case "bottom-right":
          x = "95%";
          y = "95%";
          textAnchor = "end";
          dominantBaseline = "auto";
          break;
        case "center":
        default:
          // already set
          break;
      }

      const svg = `
        <svg width="${metadata.width}" height="${metadata.height}">
          <style>
            .watermark-text {
              fill: rgba(255, 255, 255, 0.8);
              stroke: black;
              stroke-width: ${Math.max(1, fontSize * 0.05)};
              paint-order: stroke;
              font-family: Arial, sans-serif;
              font-weight: bold;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            }
          </style>
          <text
            x="${x}"
            y="${y}"
            font-size="${fontSize}"
            class="watermark-text"
            dominant-baseline="${dominantBaseline}"
            text-anchor="${textAnchor}"
          >
            ${watermarkText || ""}
          </text>
        </svg>
      `;
      watermarkBuffer = Buffer.from(svg);

      /* -------- LOGO WATERMARK -------- */
    } else if (watermarkType === "logo" && watermarkLogo) {
      const logoBuffer = Buffer.from(await watermarkLogo.arrayBuffer());

      // Scale logo to ~15% of the main image's smaller dimension
      const logoSize = Math.floor(Math.min(metadata.width, metadata.height) * 0.15);

      watermarkBuffer = await sharp(logoBuffer)
        .resize(logoSize, logoSize, { fit: "inside" })
        .png()
        .toBuffer();
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid watermark input" }),
        { status: 400 }
      );
    }

    const gravityMap: Record<string, string> = {
      "top": "north",
      "bottom": "south",
      "left": "west",
      "right": "east",
      "center": "center",
      "top-left": "northwest",
      "top-right": "northeast",
      "bottom-left": "southwest",
      "bottom-right": "southeast",
    };

    const gravity = gravityMap[position] || "southeast";

    // For text, the SVG is full size, so gravity doesn't matter (defaults to center/over), 
    // but the text inside is positioned. 
    // For logo, the buffer is small, so gravity positions it.
    const output = await image
      .composite([{ input: watermarkBuffer, gravity: watermarkType === 'logo' ? gravity : 'center' }])
      .toBuffer();

    return new Response(output as any, {
      status: 200,
      headers: {
        "Content-Type": `image/${metadata.format}`,
        "Content-Disposition": `attachment; filename="watermarked.${metadata.format}"`,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Watermark failed", details: error.message }),
      { status: 500 }
    );
  }
}
