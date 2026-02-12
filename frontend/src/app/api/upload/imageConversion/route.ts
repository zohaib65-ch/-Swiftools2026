import sharp from "sharp";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";

const allowedConversions: Record<string, { from: string[], to: string }> = {
  "jpg-to-png": { from: ["jpg", "jpeg", "jfif"], to: "png" },
  "png-to-jpg": { from: ["png"], to: "jpeg" },
  "jpg-to-webp": { from: ["jpg", "jpeg", "jfif"], to: "webp" },
  "webp-to-jpg": { from: ["webp"], to: "jpeg" },
  "png-to-webp": { from: ["png"], to: "webp" },
  "webp-to-png": { from: ["webp"], to: "png" },
  "jpg-to-jpg": { from: ["jpg", "jpeg", "jfif"], to: "jpeg" },
  "png-to-png": { from: ["png"], to: "png" },
  "webp-to-webp": { from: ["webp"], to: "webp" },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const conversionType = formData.get("conversionType")?.toString();
    const fileEntry = formData.get("file");

    if (!fileEntry || typeof fileEntry === 'string') {
      return NextResponse.json(
        { error: "No file uploaded or invalid file format" },
        { status: 400 }
      );
    }

    const file = fileEntry as any as { name: string; arrayBuffer: () => Promise<ArrayBuffer> };

    if (!conversionType || !allowedConversions[conversionType]) {
      return NextResponse.json(
        { error: `Invalid conversion type: ${conversionType || 'missing'}` },
        { status: 400 }
      );
    }

    const { from, to } = allowedConversions[conversionType];

    const originalName = file.name;
    const ext = path.extname(originalName).slice(1).toLowerCase();

    if (!from.includes(ext)) {
      return new Response(
        JSON.stringify({ error: `File must be: ${from.join(", ")}` }),
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let output;
    if (to === "jpeg") output = await sharp(buffer).jpeg().toBuffer();
    if (to === "png") output = await sharp(buffer).png().toBuffer();
    if (to === "webp") output = await sharp(buffer).webp().toBuffer();

    return new NextResponse(output, {
      status: 200,
      headers: {
        "Content-Type": `image/${to}`,
        "Content-Disposition": `attachment; filename="converted.${to === "jpeg" ? "jpg" : to}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Conversion failed", details: error.message },
      { status: 500 }
    );
  }
}
