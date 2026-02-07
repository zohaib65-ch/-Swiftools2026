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
  title: string;
  description: string;
  acceptedTypes: any; // Using any for react-dropzone accept types for now
  icon?: React.ElementType;
}

const FileTool: React.FC<FileToolProps> = ({ toolId, title, description, acceptedTypes, icon: Icon }) => {
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

      const { jobId } = await ToolsService.uploadFile(fileToUpload, toolId, session.accessToken);
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
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700 transition-all duration-300"
      >
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            {Icon ? <Icon className="w-10 h-10 text-blue-600 dark:text-blue-300" /> : <FileText className="w-10 h-10 text-blue-600" />}
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">{title}</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">{description}</p>
        </div>

        <AnimatePresence mode="wait">
          {!processing && !result && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <FileUploader
                files={files}
                onFilesChange={handleFilesChange}
                accept={acceptedTypes}
                multiple={false} // Standard tool usually single file for now? Or depends.
              />
            </motion.div>
          )}

          {processing && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-10"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Processing...</h3>
              {jobId && (
                <div className="max-w-md mx-auto">
                  <JobProgress
                    jobId={jobId}
                    token={session?.accessToken}
                    onComplete={handleComplete}
                    onError={handleError}
                  />
                </div>
              )}
            </motion.div>
          )}

          {result && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10"
            >
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Ready to Download!</h3>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => window.open(result?.resultUrl || '#', '_blank')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all transform hover:-translate-y-1"
                >
                  Download File
                </button>
                <button
                  onClick={() => { setFiles([]); setProcessing(false); setResult(null); setJobId(null); }}
                  className="px-8 py-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                >
                  Convert Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {files.length > 0 && !processing && !result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex justify-center"
          >
            <button
              onClick={processFile}
              className="px-10 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-lg shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
            >
              Start Processing <FileText className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default FileTool;
