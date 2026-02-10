"use client";

import { useState, use } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Lock, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { pdfTool } from "@/lib/tools";
import StandardFileTool from "@/components/FileTool";
import FileUploader from "@/components/FileUploader";
import JobProgress from "@/components/JobProgress";
import { LegacyToolsService } from "@/services/legacy-tools.service";
import { useSession } from "next-auth/react";

export default function PDFToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const detail = pdfTool[slug];
  const { data: session } = useSession();

  // For now, use FileTool only for basic tools -> DISABLED to use legacy fallback
  // const useStandardTool = ["pdf-compressor", "pdf-merger", "pdf-splitter"].includes(slug);
  const useStandardTool = false;

  if (useStandardTool) {
    return (
      <div className="min-h-screen bg-linear-to-r from-[#f8f7ff] via-[#faf5f5] to-[#fffdf5]">
        <Navbar />
        <div className="pt-24 pb-12">
          <StandardFileTool
            toolId={slug}
            title={detail.title}
            description={detail.description}
            acceptedTypes="application/pdf"
            icon={null}
          />
        </div>
        <Footer />
      </div>
    );
  }

  const isImageToPdf = slug === "image-to-pdf";
  const isPdfRotator = slug === "pdf-rotator";
  const MAX_FILES = 5;

  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [jobIds, setJobIds] = useState([]); 
  const [completedJobs, setCompletedJobs] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rotation, setRotation] = useState("90");

  const requiresPassword = slug === "pdf-protector";
  const requiresConfirmPassword = slug === "pdf-protector";

  // Handle file selection
  const handleFilesChange = (selected) => {
    setError("");
    if (selected.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`);
      // Take only first 5
      setFiles(selected.slice(0, MAX_FILES));
    } else {
      setFiles(selected);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setPassword("");
    setConfirmPassword("");
    setRotation("90");
    setError("");
    setJobIds([]);
    setProcessing(false);
  };

  const handleStartProcess = async () => {
    if (!files.length) {
      setError("Please select files");
      return;
    }

    if (!session) {
      alert("Please login to process files");
      return;
    }

    if (requiresPassword) {
      if (!password) return setError("Please enter a password");
      if (password.length < 4) return setError("Password must be at least 4 characters");
      if (requiresConfirmPassword && password !== confirmPassword) return setError("Passwords do not match");
    }

    setProcessing(true);
    setError("");
    setJobIds([]);

    // Logic for specific tools (Legacy vs New)
    // Legacy: pdf-merger, image-to-pdf, pdf-protector
    const legacyTools = ["pdf-merger", "image-to-pdf", "pdf-protector"];

    if (legacyTools.includes(slug)) {
        try {
            const formData = new FormData();
            
            // All PDF Legacy APIs seem to expect "files" array 
            files.forEach(f => formData.append("files", f));

            if (slug === "pdf-rotator") { // Rotator moved to new backend, but checking just in case
                formData.append("rotation", rotation);
            }
            if (slug === 'pdf-protector') {
                formData.append("password", password);
            }

            // We need to map slug to legacy route
             const legacyMap = {
                "pdf-merger": "/api/pdf/merge",
                "image-to-pdf": "/api/pdf/image-to-pdf",
                "pdf-protector": "/api/pdf/protect" // Assuming this exists or handled
            };

            const endpoint = legacyMap[slug];
            if (!endpoint) throw new Error("Tool endpoint not found");

            const res = await fetch(endpoint, { method: "POST", body: formData });
            
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Processing failed");
            }
            
            const blob = await res.blob();
             // Get filename
             const contentDisposition = res.headers.get("Content-Disposition");
             let filename = `processed.pdf`;
             if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) filename = match[1];
             }

            // Download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setProcessing(false);
            // We don't use jobIds for legacy, just download and reset/done?
            // Maybe clearAll or let user clear
        } catch (err) {
            console.error(err);
            setError(err.message || "Something went wrong");
            setProcessing(false);
        }
        return;
    }

    // New Backend Logic (pdf-compressor, pdf-splitter, pdf-rotator, pdf-metadata-remover)
    // Loop through files and create jobs
    const newJobs = [];
    try {
      
      const options: any = {};
      if (slug === 'pdf-rotator') options.rotation = rotation;
      // if (slug === 'pdf-protector') options.password = password; // Not migrated yet

      const isMultiFileTool = ["pdf-merger", "image-to-pdf"].includes(slug);

      if (isMultiFileTool) {
        try {
          const { resultUrl } = await LegacyToolsService.processFile(files, slug, options);
          const fakeJobId = `legacy-merge-${Date.now()}`;
          newJobs.push({ fileIndex: 0, jobId: fakeJobId, fileName: slug === "pdf-merger" ? "merged.pdf" : "converted.pdf" });
          setCompletedJobs((prev) => ({ ...prev, [fakeJobId]: resultUrl }));
        } catch (err) {
          console.error("Multi-file processing failed", err);
          setError(err.message);
        }
      } else {
        for (let i = 0; i < files.length; i++) {
          try {
            const { resultUrl } = await LegacyToolsService.processFile(files[i], slug, options);
            const fakeJobId = `legacy-${i}-${Date.now()}`;
            newJobs.push({ fileIndex: i, jobId: fakeJobId, fileName: files[i].name });
            setCompletedJobs((prev) => ({ ...prev, [fakeJobId]: resultUrl }));
          } catch (err) {
            console.error("Upload failed", err);
          }
        }
      }
      setJobIds(newJobs);

    } catch (err) {
      setError(err.message || "Conversion failed");
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-r from-[#f8f7ff] via-[#faf5f5] to-[#fffdf5] font-[inherit]">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 pt-32 pb-20">
        
        {/* Breadcrumb Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
            PDF Tools &gt;
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter">
            {detail?.title || "PDF Converter"}
          </h1>
          <p className="text-base md:text-lg text-gray-500 max-w-lg mx-auto font-medium">
            {detail?.description || "Convert files into high-quality images in seconds."}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
          
          {!processing && jobIds.length === 0 && (
            <div className="space-y-8">
              <FileUploader
                files={files}
                onFilesChange={handleFilesChange}
                accept={isImageToPdf ? "image/*" : "application/pdf"}
                multiple={true}
              />

              {files.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* ROTATION / OPTIONS placeholder like in image */}
                    <div className="space-y-3">
                       <label className="text-[11px] font-black text-gray-900 uppercase tracking-wider">Convert:</label>
                       <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 cursor-pointer hover:bg-white transition-all">
                         <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                         </div>
                         <span className="text-sm font-bold text-gray-700">All pages</span>
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                       <label className="text-[11px] font-black text-gray-900 uppercase tracking-wider">Output:</label>
                       <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 text-sm font-bold text-gray-700 flex justify-between items-center cursor-pointer hover:bg-white transition-all">
                          JPG quality
                          <RotateCw size={14} className="text-gray-400" />
                       </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStartProcess}
                    className="w-full py-5 bg-linear-to-r from-blue-400 to-indigo-500 text-white rounded-[20px] font-black text-xl hover:scale-[1.01] transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3"
                  >
                    {isPdfRotator ? "Rotate PDF" : requiresPassword ? "Protect PDF" : `Convert to ${slug.includes('jpg') ? 'JPG' : 'PDF'}`}
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* Processing / Result */}
          {(processing || jobIds.length > 0) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest">Processing Files</h3>
                <span className="text-[10px] font-bold text-gray-400">{files.length} file(s)</span>
              </div>
              
              <div className="space-y-4">
                {jobIds.map((job) => (
                  <div key={job.jobId} className="bg-gray-50/30 rounded-2xl p-4 border border-gray-100">
                    <div className="text-xs font-bold text-gray-600 mb-2 flex justify-between items-center">
                      <span className="truncate max-w-[200px]">{job.fileName}</span>
                      {completedJobs[job.jobId] && (
                          <a 
                            href={completedJobs[job.jobId]} 
                            download 
                            className="bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight hover:bg-green-600 transition-all"
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
                      onComplete={(data) => {
                         setCompletedJobs((prev) => ({ ...prev, [job.jobId]: data.resultUrl }));
                      }}
                    />
                  </div>
                ))}
              </div>
              
              {Object.keys(completedJobs).length === jobIds.length && jobIds.length > 0 && (
                <button
                  onClick={clearAll}
                  className="w-full py-5 bg-black text-white rounded-[20px] font-black text-xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
                >
                  Process New Files
                </button>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold text-center border border-red-100"
            >
              {error}
            </motion.div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}
