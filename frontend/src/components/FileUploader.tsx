"use client";

import { useState, useCallback } from "react";
import { Upload, X, File as FileIcon, Image as ImageIcon, RotateCw } from "lucide-react";

export default function FileUploader({
  files = [],
  onFilesChange,
  accept = "image/*",
  multiple = true,
  maxSizeMB = 10,
  showPreview = true,
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        validateAndSetFiles(Array.from(e.dataTransfer.files));
      }
    },
    [files]
  );

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFiles(Array.from(e.target.files));
    }
  };

  const validateAndSetFiles = (newFiles) => {
    const validFiles = newFiles.filter((file) => {
      const isSizeValid = file.size / 1024 / 1024 <= maxSizeMB;
      if (!isSizeValid) {
        alert(`File ${file.name} is too large (Max ${maxSizeMB}MB)`);
      }
      return isSizeValid;
    });

    if (multiple) {
      onFilesChange([...files, ...validFiles]);
    } else {
      onFilesChange([validFiles[0]]);
    }
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  return (
    <div className="w-full">
      {/* Dropzone */}
      {!files.length ? (
        <label
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300
            ${isDragging
              ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
              : "border-gray-200 bg-gray-50/30 hover:bg-gray-50 hover:border-gray-300"
            }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            <div className={`p-4 rounded-3xl mb-4 shadow-sm ${isDragging ? "bg-blue-100/50 text-blue-600" : "bg-white text-blue-500"}`}>
              <Upload size={32} />
            </div>
            <p className="mb-2 text-lg font-bold text-gray-900">
              Drag & drop your files here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or <span className="text-blue-600 underline">Browse files</span>
            </p>
            <p className="text-xs text-gray-400 font-medium">
              Supported formats: {accept === "image/*" ? "PNG, JPG, WebP" : accept.split("/")[1]?.toUpperCase() || "PDF"} • Max size: {maxSizeMB}MB
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
          />
        </label>
      ) : (
        /* File List / Active File */
        <div className="space-y-3">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-red-500 shrink-0 border border-gray-100">
                  {file.type.includes("pdf") ? (
                    <FileIcon size={24} />
                  ) : file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-full h-full object-cover rounded-xl"
                      onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                    />
                  ) : (
                    <FileIcon size={24} />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-gray-900 truncate block">
                    {file.name}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                    <span>•</span>
                    <span className="text-blue-500">Ready</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = accept;
                    input.onchange = (e: any) => {
                      if (e.target.files?.length) {
                         const newFiles = [...files];
                         newFiles[index] = e.target.files[0];
                         onFilesChange(newFiles);
                      }
                    };
                    input.click();
                  }}
                  className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-all"
                >
                  <RotateCw size={14} /> Replace
                </button>
                <button
                  onClick={() => removeFile(index)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
