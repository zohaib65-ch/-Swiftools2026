"use client";

import { useState, useCallback } from "react";
import { Upload, X, File as FileIcon, Image as ImageIcon } from "lucide-react";

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
      <label
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-40 sm:h-52 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
          ${isDragging
            ? "border-blue-500 bg-blue-50 scale-[1.02]"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
          }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          <div className={`p-3 rounded-full mb-3 ${isDragging ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"}`}>
            <Upload size={28} />
          </div>
          <p className="mb-2 text-sm sm:text-base font-semibold text-gray-700">
            <span className="font-bold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            {accept === "image/*" ? "SVG, PNG, JPG or WebP" : "Supported files"} (Max {maxSizeMB}MB)
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

      {/* File List */}
      {files.length > 0 && showPreview && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-full h-full object-cover rounded-lg"
                      onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                    />
                  ) : (
                    <FileIcon size={20} />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-700 truncate block max-w-[200px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
