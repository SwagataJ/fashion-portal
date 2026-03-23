"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Upload,
  Sparkles,
  Loader2,
  Download,
  ImageIcon,
  ArrowRight,
  X,
  Check,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { PhotogenixOutput } from "@/types";

const BACKGROUND_OPTIONS = [
  { value: "white_studio", label: "White Studio", desc: "Clean & professional" },
  { value: "lifestyle", label: "Lifestyle Interior", desc: "Warm & modern" },
  { value: "gradient", label: "Gradient", desc: "Lavender to cream" },
  { value: "outdoor", label: "Outdoor", desc: "Natural golden hour" },
  { value: "minimal", label: "Minimal Grey", desc: "Subtle & refined" },
];

const STYLE_OPTIONS = [
  { value: "Studio", label: "Studio", desc: "Clean catalog style" },
  { value: "Lifestyle", label: "Lifestyle", desc: "Natural editorial" },
  { value: "Editorial", label: "Editorial", desc: "High fashion drama" },
  { value: "E-commerce", label: "E-commerce", desc: "Consistent product" },
];

export default function PhotogenixPage() {
  const { isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [background, setBackground] = useState("white_studio");
  const [style, setStyle] = useState("Studio");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<PhotogenixOutput | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;
    setError("");
    setGenerating(true);
    setResult(null);

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("background_type", background);
    formData.append("shooting_style", style);

    try {
      const response = await api.post("/api/photogenix/generate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Image generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.generated_image_url;
    a.download = `photogenix-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="ml-60 flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-600 to-rose-700 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Photogenix</h1>
            <span className="text-xs bg-pink-600/20 text-pink-300 border border-pink-500/20 px-2 py-0.5 rounded-full">
              Photo AI
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Upload a product image and transform it with AI-powered professional photography
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* Upload Zone */}
            <div className="card p-5">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-4 h-4 text-pink-400" />
                Upload Product Image
              </h2>

              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${
                  isDragging
                    ? "border-pink-500/60 bg-pink-600/10"
                    : previewUrl
                    ? "border-white/10"
                    : "border-white/10 hover:border-white/20 hover:bg-white/3"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !previewUrl && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />

                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Uploaded product"
                      className="max-h-48 mx-auto rounded-lg object-contain"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setResult(null);
                      }}
                      className="absolute top-0 right-0 w-7 h-7 bg-red-500/80 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-400">
                      <Check className="w-4 h-4 text-green-400" />
                      {selectedFile?.name}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors underline"
                    >
                      Change image
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-pink-600/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-3">
                      <ImageIcon className="w-5 h-5 text-pink-400" />
                    </div>
                    <p className="text-gray-300 text-sm font-medium mb-1">
                      Drop your product image here
                    </p>
                    <p className="text-gray-600 text-xs">
                      or click to browse · JPEG, PNG, WebP
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Background Selection */}
            <div className="card p-5">
              <h2 className="font-semibold text-white mb-3 text-sm">
                Background Type
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {BACKGROUND_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBackground(opt.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200 ${
                      background === opt.value
                        ? "border-pink-500/40 bg-pink-600/10 text-white"
                        : "border-white/5 bg-white/2 text-gray-400 hover:border-white/10 hover:text-gray-300"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                        background === opt.value
                          ? "border-pink-400 bg-pink-400"
                          : "border-gray-600"
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-xs text-gray-600">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selection */}
            <div className="card p-5">
              <h2 className="font-semibold text-white mb-3 text-sm">
                Photography Style
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStyle(opt.value)}
                    className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                      style === opt.value
                        ? "border-pink-500/40 bg-pink-600/10 text-white"
                        : "border-white/5 text-gray-400 hover:border-white/10 hover:text-gray-300"
                    }`}
                  >
                    <div className="text-sm font-medium mb-0.5">{opt.label}</div>
                    <div className="text-xs text-gray-600">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedFile || generating}
              className="btn-gradient w-full flex items-center justify-center gap-2 py-3"
              style={{
                background: "linear-gradient(135deg, #db2777, #9f1239)",
              }}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating AI Photo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Photo
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>

          {/* Right: Result */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {generating && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="card p-8 text-center h-full min-h-[400px] flex flex-col items-center justify-center"
                >
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-pink-600/20 border border-pink-500/20 flex items-center justify-center mx-auto">
                      <Camera className="w-9 h-9 text-pink-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-white mb-2">
                    AI is styling your photo
                  </h3>
                  <p className="text-gray-500 text-sm mb-6 max-w-xs">
                    Analyzing product details and generating a professional photo. This takes 20-40 seconds...
                  </p>
                  <div className="w-full max-w-xs h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-pink-600 to-rose-500 rounded-full"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                </motion.div>
              )}

              {result && !generating && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      AI Photo Generated
                    </h3>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>

                  {/* Before/After */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="card p-3">
                      <div className="text-xs text-gray-500 mb-2 font-medium">ORIGINAL</div>
                      <img
                        src={result.original_image_url}
                        alt="Original product"
                        className="w-full rounded-lg object-contain max-h-64 bg-white/3"
                      />
                    </div>
                    <div className="card p-3 border-pink-500/20">
                      <div className="text-xs text-pink-400 mb-2 font-medium">AI GENERATED</div>
                      <img
                        src={result.generated_image_url}
                        alt="AI enhanced product"
                        className="w-full rounded-lg object-contain max-h-64 bg-white/3"
                      />
                    </div>
                  </div>

                  <div className="card p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Background</div>
                        <div className="text-gray-300 capitalize">
                          {BACKGROUND_OPTIONS.find((b) => b.value === background)?.label}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Style</div>
                        <div className="text-gray-300">{style}</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setResult(null);
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="w-full py-2.5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-all text-sm"
                  >
                    Generate Another Photo
                  </button>
                </motion.div>
              )}

              {!result && !generating && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card p-12 text-center min-h-[400px] flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-pink-600/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-4 animate-float">
                    <Camera className="w-7 h-7 text-pink-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">
                    Before & After Preview
                  </h3>
                  <p className="text-gray-500 text-sm max-w-xs">
                    Upload your product image, choose your settings, and see the AI-powered transformation
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
