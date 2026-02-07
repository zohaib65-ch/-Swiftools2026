import sharp from "sharp";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const width = parseInt(formData.get("width")) || null;
    const height = parseInt(formData.get("height")) || null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
    }

    // If no width/height provided, output original size (or error?)
    // If one is missing, sharp maintains aspect ratio by default.
    // If user wants to force resize without dimensions, it's a no-op?
    // Let's assume at least one is needed, or we just process it.

    const buffer = Buffer.from(await file.arrayBuffer());

    // Resize
    // sharp resize options: 
    // width, height: pixels
    // fit: 'cover' (default) - crops to aspect ratio
    // fit: 'fill' - ignores aspect ratio, stretches
    // fit: 'inside' - resizes to fit within w/h, preserving aspect ratio (no crop)
    // fit: 'outside' - resizes to fill w/h, preserving aspect ratio (crop possible?)

    // For a generic "Resizer", usually 'fill' (stretch) or 'inside' (max width/height) is expected.
    // Given the UI allows independent W/H input, 'fill' might be what user expects if they break aspect ratio.
    // But 'fill' distorts. 
    // Let's use 'fill' if both provided to honor exact dimensions.

    const resizeOptions: any = {};
    if (width) resizeOptions.width = width;
    if (height) resizeOptions.height = height;
    if (width && height) resizeOptions.fit = 'fill';

    const resizedBuffer = await sharp(buffer)
      .resize(resizeOptions)
      .toBuffer();

    const metadata = await sharp(buffer).metadata();
    const format = metadata.format || "png";

    return new Response(resizedBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": `image/${format}`,
        "Content-Disposition": `attachment; filename="resized.${format}"`,
      },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Resizing failed", details: error.message }),
      { status: 500 }
    );
  }
}
