// Legacy API wrapper for direct file processing (no Redis/BullMQ required)
const FRONTEND_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

// Map kebab-case slugs to API route details
const toolMap = {
  'image-compressor': { path: '/api/upload/imageCompressor', field: 'file' },
  'image-resizer': { path: '/api/upload/imageResizer', field: 'file' },
  'image-converter': { path: '/api/upload/imageConversion', field: 'file' },
  'image-watermark': { path: '/api/upload/image-watermark', field: 'file' },
  'image-blur': { path: '/api/upload/imageBlur', field: 'file' },
  'image-round': { path: '/api/upload/imageRound', field: 'file' },
  'remove-exif': { path: '/api/upload/remove-exif', field: 'file' },
  'favicon-generator': { path: '/api/upload/favicon', field: 'file' },

  // PDF Tools
  'pdf-compressor': { path: '/api/pdf/compress', field: 'files' },
  'pdf-splitter': { path: '/api/pdf/split', field: 'files' },
  'pdf-rotator': { path: '/api/pdf/rotate', field: 'files' },
  'pdf-metadata-remover': { path: '/api/pdf/remove-metadata', field: 'files' },
  'pdf-merger': { path: '/api/pdf/merge', field: 'files' },
  'image-to-pdf': { path: '/api/pdf/image-to-pdf', field: 'files' }
};

export const LegacyToolsService = {
  async processFile(file, slug, options = {}) {
    if (!file) throw new Error("No file provided");

    // Get API details
    const tool = toolMap[slug];
    const apiPath = tool ? tool.path : `/api/upload/${slug}`;
    const fieldName = tool ? tool.field : 'file';

    const formData = new FormData();

    // Handle single file or array of files
    if (Array.isArray(file)) {
      file.forEach(f => formData.append(fieldName, f));
    } else {
      formData.append(fieldName, file);
    }

    // Append options
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Special case for image-converter legacy API
    if (slug === 'image-converter' && options.fromFormat && options.toFormat) {
      formData.append('conversionType', `${options.fromFormat}-to-${options.toFormat}`);
    }

    const response = await fetch(`${FRONTEND_URL}${apiPath}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Processing failed";
      try {
        const errJson = JSON.parse(errorText);
        errorMessage = errJson.error || errJson.message || errorMessage;
      } catch (e) {
        errorMessage = `${response.status} - ${errorText.substring(0, 100)}`;
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return { resultUrl: url, blob };
  }
};
