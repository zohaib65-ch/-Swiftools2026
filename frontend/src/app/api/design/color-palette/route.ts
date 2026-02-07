// app/api/design/color-palette/route.js
import { NextResponse } from "next/server";
import { createCanvas, loadImage, Canvas } from "canvas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// RGB -> Hex
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("").toUpperCase();
}

// RGB to HSL conversion
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Calculate color difference using Delta E
function colorDifference(rgb1, rgb2) {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;

  const [lab1, lab2] = [rgb1, rgb2].map(rgb => {
    const [r, g, b] = rgb.map(c => c / 255);

    const rLin = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    const gLin = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    const bLin = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    const x = rLin * 0.4124564 + gLin * 0.3575761 + bLin * 0.1804375;
    const y = rLin * 0.2126729 + gLin * 0.7151522 + bLin * 0.0721750;
    const z = rLin * 0.0193339 + gLin * 0.1191920 + bLin * 0.9503041;

    const fx = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
    const fy = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
    const fz = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

    const L = (116 * fy) - 16;
    const a = 500 * (fx - fy);
    const bLab = 200 * (fy - fz);

    return [L, a, bLab];
  });

  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];

  return Math.sqrt(dL * dL + da * da + db * db);
}

// Median Cut Algorithm
function medianCutQuantization(pixels, colorCount) {
  if (pixels.length === 0) return [];

  let colorBuckets = [pixels.map(pixel => ({
    r: pixel.r,
    g: pixel.g,
    b: pixel.b,
    count: pixel.count || 1
  }))];

  while (colorBuckets.length < colorCount && colorBuckets.some(b => b.length > 1)) {
    const newBuckets = [];

    for (const bucket of colorBuckets) {
      if (bucket.length <= 1) {
        newBuckets.push(bucket);
        continue;
      }

      let rMin = 255, rMax = 0;
      let gMin = 255, gMax = 0;
      let bMin = 255, bMax = 0;

      for (const color of bucket) {
        rMin = Math.min(rMin, color.r);
        rMax = Math.max(rMax, color.r);
        gMin = Math.min(gMin, color.g);
        gMax = Math.max(gMax, color.g);
        bMin = Math.min(bMin, color.b);
        bMax = Math.max(bMax, color.b);
      }

      const rRange = rMax - rMin;
      const gRange = gMax - gMin;
      const bRange = bMax - bMin;

      let sortChannel;
      if (rRange >= gRange && rRange >= bRange) {
        sortChannel = 'r';
      } else if (gRange >= rRange && gRange >= bRange) {
        sortChannel = 'g';
      } else {
        sortChannel = 'b';
      }

      bucket.sort((a, b) => a[sortChannel] - b[sortChannel]);

      const median = Math.floor(bucket.length / 2);
      newBuckets.push(bucket.slice(0, median));
      newBuckets.push(bucket.slice(median));
    }

    colorBuckets = newBuckets;
  }

  const colors = colorBuckets.map(bucket => {
    if (bucket.length === 0) return null;

    let totalR = 0, totalG = 0, totalB = 0, totalCount = 0;

    for (const color of bucket) {
      totalR += color.r * color.count;
      totalG += color.g * color.count;
      totalB += color.b * color.count;
      totalCount += color.count;
    }

    return {
      r: Math.round(totalR / totalCount),
      g: Math.round(totalG / totalCount),
      b: Math.round(totalB / totalCount),
      weight: bucket.length / pixels.length
    };
  }).filter(color => color !== null);

  return colors;
}

// Extract dominant colors
function getDominantColors(image, colorCount = 6) {
  const width = image.width;
  const height = image.height;

  const sampleWidth = Math.min(width, 200);
  const sampleHeight = Math.min(height, 200);

  const canvas = createCanvas(sampleWidth, sampleHeight);
  const ctx = canvas.getContext("2d") as any;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height, 0, 0, sampleWidth, sampleHeight);

  const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
  const pixels = imageData.data;

  // Extract colors with quantization
  const colorMap = new Map();
  const quantizationLevel = 16;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const alpha = pixels[i + 3];

    if (alpha < 128) continue;

    const brightness = (r + g + b) / 3;
    if (brightness < 5 || brightness > 250) continue;

    const qr = Math.round(r / quantizationLevel) * quantizationLevel;
    const qg = Math.round(g / quantizationLevel) * quantizationLevel;
    const qb = Math.round(b / quantizationLevel) * quantizationLevel;

    const key = `${qr},${qg},${qb}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  const pixelArray = Array.from(colorMap.entries()).map(([key, count]) => {
    const [r, g, b] = key.split(',').map(Number);
    return { r, g, b, count };
  });

  const quantizedColors = medianCutQuantization(pixelArray, colorCount * 2);

  // Deduplicate similar colors
  const uniqueColors = [];
  const colorThreshold = 15;

  for (const color of quantizedColors) {
    const { r, g, b, weight } = color;
    let isUnique = true;

    for (const selected of uniqueColors) {
      const diff = colorDifference([r, g, b], [selected.r, selected.g, selected.b]);
      if (diff < colorThreshold) {
        isUnique = false;
        break;
      }
    }

    if (isUnique) {
      uniqueColors.push({ ...color });
    }
  }

  // Sort by brightness for better visual presentation
  uniqueColors.sort((a, b) => {
    const brightnessA = (a.r + a.g + a.b) / 3;
    const brightnessB = (b.r + b.g + b.b) / 3;
    return brightnessA - brightnessB;
  });

  return uniqueColors.slice(0, colorCount);
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const colorCount = parseInt(formData.get("colorCount") || "6");

    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 20MB" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const img = await loadImage(imageBuffer);

    const colors = getDominantColors(img, Math.min(Math.max(colorCount, 3), 12));
    const palette = colors.map(c => rgbToHex(c.r, c.g, c.b));

    return NextResponse.json({
      success: true,
      palette,
      originalName: file.name
    });
  } catch (err) {
    console.error("Color Palette Error:", err);
    return NextResponse.json(
      {
        error: "Failed to generate color palette",
        details: err.message
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Color Palette Generator",
    description: "Extracts dominant colors from images and creates a visual palette",
    endpoint: "POST /api/design/color-palette",
    parameters: {
      file: "Image file (multipart/form-data, JPG/PNG/WebP, max 20MB)",
      colorCount: "Number of colors to extract (3-12, optional, default: 6)"
    },
    returns: "PNG image with color blocks only (no text)",
    features: [
      "Dominant color extraction using median cut quantization",
      "Pure visual output - no text or labels",
      "Color similarity filtering",
      "Brightness-based sorting"
    ]
  });
}