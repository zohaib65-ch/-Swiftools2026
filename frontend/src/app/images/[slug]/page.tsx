"use client";

import { useState, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { tools } from "../../../lib/tools";
import { LegacyToolsService } from "../../../services/legacy-tools.service";
import Cropper from "react-easy-crop";
import getCroppedImg from "../../../lib/cropImage";
import CustomFooter from "../../../components/CustomFooter";
import FileUploader from "../../../components/FileUploader";
import JobProgress from "../../../components/JobProgress";
import { Download, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    
    // Reset processing state when new files are selected
    setJobIds([]);
    setCompletedJobs({});
    setProcessing(false);

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
    <div className="min-h-screen bg-linear-to-r from-[#f8f7ff] via-[#faf5f5] to-[#fffdf5] font-[inherit]">
      <Navbar />

      <div className="mx-auto max-w-4xl px-6 pt-32 pb-20">
        
        {/* Breadcrumb Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
            Image Tools &gt;
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter">
            {detail?.title || "Image Tool"}
          </h1>
          <p className="text-base md:text-lg text-gray-500 max-w-lg mx-auto font-medium">
            {detail?.description || "Enhance, convert, and edit your images in seconds."}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
          
          {/* Step 1: Upload */}
          <div className="mb-0">
            <FileUploader
              files={selectedFiles}
              onFilesChange={handleFilesChange}
              showPreview={!processing}
            />
          </div>

          {/* Step 2: Configure */}
          {selectedFiles.length > 0 && !processing && jobIds.length === 0 && (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="mt-10 space-y-10"
            >
              {/* Configuration Controls */}
              <div className="space-y-8">
                <div className="flex items-center gap-2 text-[11px] font-black text-gray-900 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Configure Output
                </div>

                {/* EXIF Data */}
                {slug === "exif-metadata-remover" && exifData && (
                  <div className="rounded-3xl border border-gray-100 bg-gray-50/50 p-6 text-xs overflow-x-auto max-h-60 scrollbar-hide">
                    <table className="w-full text-left">
                      <tbody className="space-y-2">
                        {Object.entries(exifData).map(([key, value]) => (
                          <tr key={key} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 pr-4 font-bold text-gray-400 uppercase tracking-tighter">{key}</td>
                            <td className="py-2 text-gray-900 font-bold">{String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Width/Height Inputs */}
                {showGridTools.includes(slug) && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-tighter ml-1">Width (px)</label>
                      <input
                        type="number"
                        value={cropWidth}
                        onChange={(e) => setCropWidth(+e.target.value)}
                        className="w-full px-5 py-4 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm font-bold focus:bg-white focus:border-blue-400 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-tighter ml-1">Height (px)</label>
                      <input
                        type="number"
                        value={cropHeight}
                        onChange={(e) => setCropHeight(+e.target.value)}
                        className="w-full px-5 py-4 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm font-bold focus:bg-white focus:border-blue-400 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Converter Format Selectors */}
                {slug === "image-converter" && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-tighter ml-1">From Format</label>
                      <select
                        value={fromFormat}
                        onChange={(e) => setFromFormat(e.target.value)}
                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold appearance-none cursor-pointer hover:bg-white transition-all"
                      >
                        <option value="jpg">JPG</option>
                        <option value="png">PNG</option>
                        <option value="webp">WebP</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-tighter ml-1">To Format</label>
                      <select
                        value={toFormat}
                        onChange={(e) => setToFormat(e.target.value)}
                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold appearance-none cursor-pointer hover:bg-white transition-all"
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
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-tighter ml-1">Type</label>
                        <select
                          value={watermarkType}
                          onChange={(e) => setWatermarkType(e.target.value)}
                          className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold appearance-none cursor-pointer"
                        >
                          <option value="text">Text</option>
                          <option value="logo">Logo Image</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-tighter ml-1">Position</label>
                        <select
                          value={watermarkPosition}
                          onChange={(e) => setWatermarkPosition(e.target.value)}
                          className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold appearance-none cursor-pointer"
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
                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-blue-400 transition-all"
                      />
                    ) : (
                      <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setWatermarkLogo(e.target.files[0])}
                          className="text-xs w-full font-bold"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Visual Tools (Cropper) */}
              {["image-cropper", "image-resizer", "bulk-image-resizer", "social-media-image-cropper"].includes(slug) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative h-72 rounded-[32px] overflow-hidden border border-gray-100 shadow-inner bg-gray-900 group/cropper">
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

              {/* Start Button */}
              <button
                onClick={handleStartProcess}
                className="w-full py-5 bg-linear-to-r from-blue-400 to-indigo-500 text-white rounded-[24px] font-black text-xl hover:scale-[1.01] transition-all shadow-2xl shadow-blue-200 flex items-center justify-center gap-3"
              >
                Start Processing ({selectedFiles.length} {selectedFiles.length === 1 ? 'Image' : 'Images'})
                <Download size={24} />
              </button>
            </motion.div>
          )}

          {/* Progress & Results */}
          {(processing || jobIds.length > 0) && (
            <div className="mt-10 space-y-6">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest">Processing Jobs</h3>
                <span className="text-[10px] font-bold text-gray-400">{selectedFiles.length} file(s)</span>
              </div>
              
              <div className="space-y-4">
                {jobIds.map((job) => (
                  <div key={job.jobId} className="bg-gray-50/30 rounded-[24px] p-6 border border-gray-100">
                    <div className="text-xs font-bold text-gray-600 mb-4 flex justify-between items-center px-1">
                      <span className="truncate max-w-[250px]">{job.fileName}</span>
                      {completedJobs[job.jobId] && (
                          <a 
                            href={completedJobs[job.jobId]} 
                            download 
                            className="bg-green-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-100"
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
              </div>
              
              {Object.keys(completedJobs).length === jobIds.length && jobIds.length > 0 && (
                <button
                  onClick={() => { setProcessing(false); setSelectedFiles([]); setJobIds([]); setCompletedJobs({}); }}
                  className="w-full py-5 bg-black text-white rounded-[24px] font-black text-xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-200 mt-8"
                >
                  Process New Files
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      <Footer />
      <CustomFooter />
    </div>
  );
}
