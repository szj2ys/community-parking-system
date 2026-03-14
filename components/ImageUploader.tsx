"use client";

import { useState, useRef, useCallback } from "react";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/heic";

export default function ImageUploader({
  images,
  onChange,
  maxImages = 5,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        alert(`最多只能上传 ${maxImages} 张图片`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      setUploading(true);

      try {
        const uploadedUrls: string[] = [];

        for (const file of filesToUpload) {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (data.success && data.data?.url) {
            uploadedUrls.push(data.data.url);
          } else {
            console.error("上传失败:", data.message);
            alert(`${file.name} 上传失败: ${data.message || "未知错误"}`);
          }
        }

        if (uploadedUrls.length > 0) {
          onChange([...images, ...uploadedUrls]);
        }
      } catch (error) {
        console.error("上传错误:", error);
        alert("上传失败，请重试");
      } finally {
        setUploading(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [images, onChange, maxImages]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUpload(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      {/* 图片预览网格 */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
            >
              <img
                src={url}
                alt={`车位图片 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* 删除按钮 */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label="删除图片"
              >
                ×
              </button>
              {/* 序号标签 */}
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-xs rounded">
                {index === 0 ? "封面" : index + 1}
              </span>
              {/* 移动按钮（仅当有多个图片时显示） */}
              {images.length > 1 && index > 0 && (
                <button
                  type="button"
                  onClick={() => handleReorder(index, index - 1)}
                  className="absolute bottom-1 right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
                  aria-label="前移"
                >
                  ←
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 上传区域 */}
      {images.length < maxImages && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6
            flex flex-col items-center justify-center
            cursor-pointer transition-colors
            ${dragOver
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }
            ${uploading ? "pointer-events-none" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600">上传中...</span>
            </div>
          ) : (
            <>
              <svg
                className="w-10 h-10 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4m16-4l-4-4m-8 4l4-4m8 12l-4 4m-8-4l4 4"
                />
              </svg>
              <span className="text-sm text-gray-600 text-center">
                点击或拖拽上传图片
              </span>
              <span className="text-xs text-gray-400 mt-1">
                支持 JPG、PNG、WebP，单张不超过 5MB
              </span>
              <span className="text-xs text-gray-400">
                还可上传 {maxImages - images.length} 张（最多 {maxImages} 张）
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
