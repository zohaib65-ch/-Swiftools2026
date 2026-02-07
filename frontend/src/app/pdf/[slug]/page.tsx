"use client";

import { useState, use } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Lock, RotateCw } from "lucide-react";
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
    <div className="text-black bg-linear-to-r from-[#f8f7ff] via-[#faf5f5] to-[#fffdf5]">
      <div className="mx-auto max-w-md px-3 py-4 min-h-screen">
        <Navbar />

        {/* Header */}
        <div className="text-center mb-2 mt-24">
          <h1 className="text-lg md:text-2xl font-bold">
            {detail?.title || "PDF Converter"}
          </h1>
          <p className="text-[11px] md:text-sm text-gray-600">
            {detail?.description || "Convert files easily"}
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-xl p-3 shadow-sm bg-white space-y-2">

          {!processing && jobIds.length === 0 && (
            <FileUploader
              files={files}
              onFilesChange={handleFilesChange}
              accept={isImageToPdf ? "image/*" : "application/pdf"}
              multiple={true}
            />
          )}

          {/* ROTATION INPUT (ONLY pdf-rotator) */}
          {files.length > 0 && isPdfRotator && !processing && (
            <div className="mt-3 mb-2">
              <label className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                <RotateCw className="w-4 h-4" />
                Rotate pages
              </label>
              <select
                value={rotation}
                onChange={(e) => setRotation(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
              >
                <option value="90">90° clockwise</option>
                <option value="180">180°</option>
                <option value="270">270° clockwise</option>
              </select>
            </div>
          )}

          {/* Password (ONLY pdf-protector) */}
          {files.length > 0 && requiresPassword && !processing && (
            <>
              <div className="relative mt-4 mb-2">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 4 characters)"
                  className="w-full rounded-full border border-gray-300 pl-11 pr-4 py-2 text-sm focus:outline-none focus:border-gray-900"
                />
              </div>

              <div className="relative mb-2">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full rounded-full border border-gray-300 pl-11 pr-4 py-2 text-sm focus:outline-none focus:border-gray-900"
                />
              </div>
            </>
          )}

          {/* Error */}
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          {/* Convert button */}
          {files.length > 0 && !processing && jobIds.length === 0 && (
            <button
              onClick={handleStartProcess}
              className="mt-4 w-full rounded-lg bg-black text-white py-2.5 text-sm font-semibold hover:bg-gray-800 transition-all"
            >
              {isPdfRotator ? "Rotate PDF" : requiresPassword ? "Protect PDF" : "Convert"}
            </button>
          )}

          {/* Processing / Result */}
          {(processing || jobIds.length > 0) && (
            <div className="mt-4 space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm">Processing Jobs</h3>
              {jobIds.map((job) => (
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
                    onComplete={(data) => {
                       setCompletedJobs((prev) => ({ ...prev, [job.jobId]: data.resultUrl }));
                    }}
                  />
                </div>
              ))}
              
              <button
                onClick={clearAll}
                className="mt-4 text-sm text-gray-500 hover:text-black underline w-full text-center"
              >
                Process New Files
              </button>
            </div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}
