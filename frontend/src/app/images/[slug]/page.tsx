"use client";

import { useState, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { tools } from "@/lib/tools";
import { LegacyToolsService } from "@/services/legacy-tools.service";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import CustomFooter from "@/components/CustomFooter";
import FileUploader from "@/components/FileUploader";
import JobProgress from "@/components/JobProgress";
import { Download } from "lucide-react";

export default function ToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const detail = tools[slug];
  const { data: session } = useSession();

  const [selectedFiles, setSelectedFiles] = useState([]);
  // We keep previewUrls for internal logic like Cropper
  const [previewUrls, setPreviewUrls] = useState([]);

  const [jobIds, setJobIds] = useState([]); // Array of { fileIndex, jobId, status }
  const [processing, setProcessing] = useState(false);
  const [completedJobs, setCompletedJobs] = useState<{ [key: string]: string }>({});

  // Tools State
  const [cropData, setCropData] = useState([]);
  const [cropWidth, setCropWidth] = useState(0);
  const [cropHeight, setCropHeight] = useState(0);

  const [watermarkType, setWatermarkType] = useState("text");
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkLogo, setWatermarkLogo] = useState(null);
  const [watermarkPosition, setWatermarkPosition] = useState("bottom-right");

  const [fromFormat, setFromFormat] = useState("jpg");
  const [toFormat, setToFormat] = useState("png");

  const [exifData, setExifData] = useState(null);

  if (!detail || detail.type !== "image") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm bg-white">
        Image tool not found
      </div>
    );
  }

  // --- Handle File Upload & Auto-Detect Format ---
  const handleFilesChange = (files) => {
    setSelectedFiles(files);

    // Generate previews and init state
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    setCropData(files.map(() => ({ crop: { x: 0, y: 0 }, zoom: 1 })));

    // Auto-detect "from" format from first file
    if (files.length > 0) {
      const ext = files[0].name.split(".").pop()?.toLowerCase();
      if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
        setFromFormat(ext === "jpeg" ? "jpg" : ext);
      }

      const img = new Image();
      img.src = urls[0];
      img.onload = () => {
        setCropWidth(img.width);
        setCropHeight(img.height);
      };

      if (slug === "exif-metadata-remover") {
        import("exifr").then(async (exifr) => {
          const data = await exifr.parse(files[0]);
          setExifData(data);
        });
      }
    }
  };

  // --- Cropper ---
  const onCropComplete = useCallback(
    (index) => (_, croppedAreaPixels) => {
      setCropData((prev) => {
        const newData = [...prev];
        if (newData[index]) newData[index].croppedAreaPixels = croppedAreaPixels;
        return newData;
      });
      if (index === 0 && croppedAreaPixels) {
        setCropWidth(Math.round(croppedAreaPixels.width));
        setCropHeight(Math.round(croppedAreaPixels.height));
      }
    },
    []
  );

  // --- Start Processing ---
  const handleStartProcess = async () => {
    if (!session) return alert("Please login to process files");
    if (!selectedFiles.length) return alert("Please select images");

    setProcessing(true);
    setJobIds([]); // Reset jobs

    const newJobs = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        let finalFile = selectedFiles[i];

        // Pre-processing (Cropping)
        if (
          ["image-cropper", "image-resizer", "bulk-image-resizer", "social-media-image-cropper"].includes(
            slug
          )
        ) {
          try {
             // For cropper tools, we use the client-side cropped blob
             const croppedBlob = await getCroppedImg(
              previewUrls[i],
              cropData[i].croppedAreaPixels,
              cropWidth,
              cropHeight,
              slug
            );
            // Convert Blob to File
            finalFile = new File([(croppedBlob as Blob)], selectedFiles[i].name, { type: selectedFiles[i].type });
          } catch(e) {
             console.error("Cropping failed on client side", e);
             // fallback to original file if fail? or throw?
          }
        }

        // Prepare Options
        const options: any = {
          width: cropWidth,
          height: cropHeight,
          fromFormat,
          toFormat,
        };

        if (slug === "watermark-adder") {
          options.watermarkType = watermarkType;
          options.position = watermarkPosition;
          if (watermarkType === "text") {
            options.watermarkText = watermarkText;
          } else {
             // For logo, we need to upload it too? 
             // ToolsService only supports single file upload currently in signature... 
             // We need to handle secondary files (like logo) or send as base64 in options (bad for large files)?
             // Or upload logo first?
             // Since we are migrating, let's look at `watermarkLogo`.
             // If it's a file object, we can't send it in JSON "options".
             // We can use FormData in ToolsService if we update it.
             // OR: Client side watermark?
             // Legacy route used FormData. 
             // NestJS `ToolsController` expects `file` and `body.tool`. options are in body?
             // If we need multiple files, we need to update Backend Controller to accept multiple files or specific field.
             
             // For now, let's ALERT user that Logo watermark is pending backend support if selected.
             if (watermarkType === 'logo') {
                alert("Logo watermark requires update. Please use Text watermark for now.");
                setProcessing(false);
                return;
             }
          }
        }

        if (slug === "image-blur-pixelate") {
          options.blur = 5;
        }

        if (slug === "image-compressor") {
           options.quality = 70;
        }

        // Upload to Legacy API (direct processing, no Redis)
        try {
          const { resultUrl, blob } = await LegacyToolsService.processFile(finalFile, slug, options);
          // Immediately mark as complete
          const fakeJobId = `legacy-${i}-${Date.now()}`;
          newJobs.push({ fileIndex: i, jobId: fakeJobId, fileName: selectedFiles[i].name });
          setCompletedJobs((prev) => ({ ...prev, [fakeJobId]: resultUrl }));
        } catch (err) {
          console.error("Upload Error", err);
          alert(`Failed to upload ${selectedFiles[i].name}: ${err.message}`);
        }
      }

      setJobIds(newJobs);
    } catch (e) {
      console.error(e);
      setProcessing(false); // Stop if critical error
    }
  };

  const handleJobComplete = (jobId, data) => {
    setCompletedJobs((prev) => ({ ...prev, [jobId]: data.resultUrl }));
  };

  const showGridTools = ["image-resizer", "bulk-image-resizer", "image-cropper", "social-media-image-cropper"];

  return (
    <>
      <div className="text-black bg-linear-to-r from-[#f8f7ff] via-[#faf5f5] to-[#fffdf5]">
        <div className="mx-auto max-w-4xl px-3 py-4 min-h-screen">
          <Navbar />

          {/* Header */}
          <div className="text-center mb-8 mt-24">
            <h1 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-600 mb-2">{detail.title}</h1>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">{detail.description}</p>
          </div>

          {/* Main Card */}
          <div className="rounded-2xl p-6 shadow-xl shadow-gray-100 bg-white border border-gray-100">

            {/* Step 1: Upload */}
            <div className="mb-6">
              <FileUploader
                files={selectedFiles}
                onFilesChange={handleFilesChange}
                showPreview={!processing} // Hide preview list when processing starts to show progress instead? Or keep it.
              />
            </div>

            {/* Step 2: Configure (Only if files selected and not yet processing) */}
            {selectedFiles.length > 0 && !processing && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

                {/* Configuration Controls */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>⚙️</span> Configure Output
                  </h3>

                  {/* EXIF Data */}
                  {slug === "exif-metadata-remover" && exifData && (
                    <div className="rounded border border-gray-300 bg-white p-2 text-xs overflow-x-auto max-h-40">
                      <table className="w-full text-left">
                        <tbody>
                          {Object.entries(exifData).map(([key, value]) => (
                            <tr key={key}>
                              <td className="pr-2 font-medium text-gray-600">{key}</td>
                              <td className="text-gray-900">{String(value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Width/Height Inputs */}
                  {showGridTools.includes(slug) && (
                    <div className="flex gap-4 mb-4">
                      <div className="flex flex-col">
                        <label className="text-xs font-semibold uppercase text-gray-500 mb-1">Width</label>
                        <input
                          type="number"
                          value={cropWidth}
                          onChange={(e) => setCropWidth(+e.target.value)}
                          className="w-24 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                          placeholder="Width"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-semibold uppercase text-gray-500 mb-1">Height</label>
                        <input
                          type="number"
                          value={cropHeight}
                          onChange={(e) => setCropHeight(+e.target.value)}
                          className="w-24 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                          placeholder="Height"
                        />
                      </div>
                    </div>
                  )}

                  {/* Converter Format Selectors */}
                  {slug === "image-converter" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">From Format</label>
                        <select
                          value={fromFormat}
                          onChange={(e) => setFromFormat(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="jpg">JPG</option>
                          <option value="png">PNG</option>
                          <option value="webp">WebP</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">To Format</label>
                        <select
                          value={toFormat}
                          onChange={(e) => setToFormat(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="jpg">JPG</option>
                          <option value="png">PNG</option>
                          <option value="webp">WebP</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Watermark Controls */}
                  {slug === "watermark-adder" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">Type</label>
                          <select
                            value={watermarkType}
                            onChange={(e) => setWatermarkType(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="text">Text</option>
                            <option value="logo">Logo Image</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">Position</label>
                          <select
                            value={watermarkPosition}
                            onChange={(e) => setWatermarkPosition(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="bottom-right">Bottom Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="top-right">Top Right</option>
                            <option value="top-left">Top Left</option>
                            <option value="center">Center</option>
                          </select>
                        </div>
                      </div>

                      {watermarkType === "text" ? (
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder="Enter watermark text..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      ) : (
                        <div className="border border-gray-300 rounded-lg p-2 bg-white">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setWatermarkLogo(e.target.files[0])}
                            className="text-sm w-full"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Visual Tools (Cropper) */}
                {["image-cropper", "image-resizer", "bulk-image-resizer", "social-media-image-cropper"].includes(slug) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative h-60 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-900">
                        <Cropper
                          image={url}
                          crop={cropData[idx]?.crop || { x: 0, y: 0 }}
                          zoom={cropData[idx]?.zoom || 1}
                          aspect={slug === "social-media-image-cropper" ? 1 : cropWidth && cropHeight ? cropWidth / cropHeight : undefined}
                          onCropChange={(c) => setCropData((prev) => { const d = [...prev]; if (d[idx]) d[idx].crop = c; return d; })}
                          onZoomChange={(z) => setCropData((prev) => { const d = [...prev]; if (d[idx]) d[idx].zoom = z; return d; })}
                          onCropComplete={onCropComplete(idx)}
                          cropShape={slug === "social-media-image-cropper" ? "round" : "rect"}
                          showGrid={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Action Button */}
            {selectedFiles.length > 0 && !processing && (
              <button
                onClick={handleStartProcess}
                className="mt-6 w-full rounded-xl bg-black text-white py-4 text-base font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.99]"
              >
                Start Processing ({selectedFiles.length} Files)
              </button>
            )}

            {/* Step 4: Progress & Results */}
            {processing && (
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-gray-800">Processing Jobs</h3>
                {jobIds.map((job, idx) => (
                  <div key={job.jobId} className="border-b border-gray-100 last:border-0 pb-2 mb-2">
                    <div className="text-xs text-gray-500 mb-1 flex justify-between">
                       <span>{job.fileName}</span>
                       {completedJobs[job.jobId] && (
                           <a 
                             href={completedJobs[job.jobId]} 
                             download 
                             className="text-blue-600 font-bold hover:underline"
                             target="_blank"
                             rel="noopener noreferrer"
                           >
                             Download
                           </a>
                       )}
                    </div>
                    <JobProgress
                      jobId={job.jobId}
                      token={session?.accessToken}
                      onComplete={(data) => handleJobComplete(job.jobId, data)}
                    />
                  </div>
                ))}

                {/* Reset Button */}
                <button
                  onClick={() => { setProcessing(false); setSelectedFiles([]); setJobIds([]); }}
                  className="mt-4 text-sm text-gray-500 hover:text-black underline"
                >
                  Process New Files
                </button>
              </div>
            )}

          </div>
        </div>
        <Footer />
        <CustomFooter />
      </div>
    </>
  );
}
