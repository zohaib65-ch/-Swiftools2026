import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import FileUploader from "@/components/FileUploader";
import { ToolsService } from "@/services/tools.service";
import JobProgress from "@/components/JobProgress";

interface FileToolProps {
  toolId: string;
  category?: string;
  title: string;
  description: string;
  acceptedTypes: any; // Using any for react-dropzone accept types for now
  icon?: React.ElementType;
}

const FileTool: React.FC<FileToolProps> = ({ toolId, category, title, description, acceptedTypes, icon: Icon }) => {
  const { data: session } = useSession();
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
    setJobId(null);
  };

  const processFile = async () => {
    if (files.length === 0) return;
    if (!session) {
      toast.error("Please login to use this tool");
      return;
    }

    try {
      setProcessing(true);
      // Currently handling single file for standard tool, can expand if needed
      const fileToUpload = files[0];

      const { jobId } = await ToolsService.uploadFile(fileToUpload, toolId, session.accessToken || "");
      setJobId(jobId);
    } catch (error: any) {
      console.error(error);
      setProcessing(false);
      toast.error(error.message || "Upload failed");
    }
  };

  const handleComplete = (data: any) => {
    setProcessing(false);
    setResult(data);
    toast.success("File processed successfully!");
  };

  const handleError = (msg: string) => {
    setProcessing(false);
    toast.error(msg);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-8">
        {category && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">
            {Icon && <Icon className="w-3.5 h-3.5" />} {category} &gt;
          </div>
        )}
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-3 tracking-tighter">{title}</h1>
        <p className="text-sm md:text-base text-gray-500 max-w-lg mx-auto font-medium">{description}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[32px] shadow-2xl shadow-gray-200/50 p-6 md:p-10 border border-gray-100 relative overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {!processing && !result && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FileUploader
                files={files}
                onFilesChange={handleFilesChange}
                accept={acceptedTypes}
                multiple={false}
              />
              
              {files.length > 0 && (
                <div className="mt-8 space-y-4">
                  {/* Options placeholder like in image */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-900 uppercase">Convert:</label>
                       <div className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                         <input type="radio" checked readOnly className="w-4 h-4" />
                         <span className="text-sm font-bold text-gray-700">All pages</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-900 uppercase">Output:</label>
                       <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 text-sm font-bold text-gray-700">
                          JPG quality
                       </div>
                    </div>
                  </div>

                  <button
                    onClick={processFile}
                    className="w-full py-4 bg-linear-to-r from-blue-400 to-indigo-500 text-white rounded-2xl font-black text-lg hover:scale-[1.02] transition-all shadow-xl shadow-blue-200"
                  >
                    Convert to JPG
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {processing && (
            <motion.div
              key="processing"
              className="py-6"
            >
              {jobId && (
                <JobProgress
                  jobId={jobId}
                  token={session?.accessToken}
                  onComplete={handleComplete}
                  onError={handleError}
                />
              )}
            </motion.div>
          )}

          {result && (
            <motion.div
              key="completed"
              className="text-center py-6"
            >
              <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-green-100">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-8">Conversion Complete!</h3>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => window.open(result?.resultUrl || '#', '_blank')}
                  className="px-10 py-4 bg-linear-to-r from-green-400 to-emerald-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-green-200 hover:scale-105 transition-all"
                >
                  Download Files
                </button>
                <button
                  onClick={() => { setFiles([]); setProcessing(false); setResult(null); setJobId(null); }}
                  className="px-10 py-4 bg-gray-50 text-gray-900 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all"
                >
                  Reset
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default FileTool;
