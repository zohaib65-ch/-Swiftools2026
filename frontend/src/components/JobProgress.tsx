"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface JobProgressProps {
  jobId: string;
  token?: string;
  onComplete?: (data: any) => void;
  onError?: (error: any) => void;
}

export default function JobProgress({ jobId, token, onComplete, onError }: JobProgressProps) {
  const [status, setStatus] = useState<"processing" | "completed" | "failed">("processing");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!jobId) return;

    // Handle legacy job IDs (already processed by frontend API)
    if (jobId.startsWith("legacy-")) {
      setStatus("completed");
      setProgress(100);
      return;
    }

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    let intervalId: NodeJS.Timeout;

    const poll = async () => {
      try {
        // Simulated progress for UX since backend might not send % yet
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));

        const res = await fetch(`${BACKEND_URL}/tools/status/${jobId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          // If 404, maybe job not ready yet, ignore or fail?
          // For now assume fail
          return;
        }

        const data = await res.json();

        if (data.status === "completed") {
          setStatus("completed");
          setProgress(100);
          clearInterval(intervalId);
          if (onComplete) onComplete(data);
        } else if (data.status === "failed") {
          setStatus("failed");
          clearInterval(intervalId);
          if (onError) onError(data.error);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    };

    intervalId = setInterval(poll, 1500);

    return () => clearInterval(intervalId);
  }, [jobId, token, onComplete, onError]);

  return (
    <div className="w-full p-4 border rounded-xl bg-white shadow-sm mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {status === "processing" && <Loader2 className="animate-spin text-blue-500" size={20} />}
          {status === "completed" && <CheckCircle className="text-green-500" size={20} />}
          {status === "failed" && <XCircle className="text-red-500" size={20} />}

          <span className="font-medium text-sm text-gray-700 capitalize">
            {status === "processing" ? "Processing your file..." : status}
          </span>
        </div>
        <span className="text-xs font-bold text-gray-500">{progress}%</span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <motion.div
          className={`h-2.5 rounded-full ${status === "failed" ? "bg-red-500" : status === "completed" ? "bg-green-500" : "bg-blue-500"
            }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
