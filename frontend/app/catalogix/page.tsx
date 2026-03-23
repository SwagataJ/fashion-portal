"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Upload,
  X,
  Tag,
  Search,
  FileText,
  Star,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { CatalogixOutput } from "@/types";
import { copyToClipboard } from "@/lib/utils";

const DEPARTMENTS = [
  "Menswear",
  "Womenswear",
  "Ethnicwear",
  "Kidswear",
  "Innerwear",
  "Beauty",
  "Footwear",
];

const CATEGORIES = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Outerwear",
  "Knitwear",
  "Denim",
  "Activewear",
  "Footwear",
  "Bags",
  "Accessories",
  "Swimwear",
  "Lingerie",
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-300"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 90
      ? "text-green-400 border-green-500/30 bg-green-500/10"
      : pct >= 75
      ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
      : "text-red-400 border-red-500/30 bg-red-500/10";

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${color}`}
    >
      <Star className="w-3 h-3" />
      {pct}% Confidence
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card p-5">
          <div className="shimmer h-4 w-32 rounded mb-3" />
          <div className="shimmer h-3 w-full rounded mb-2" />
          <div className="shimmer h-3 w-4/5 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function CatalogixPage() {
  const { isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productName, setProductName] = useState("");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [attributes, setAttributes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<CatalogixOutput | null>(null);
  const [error, setError] = useState("");

  // Editable result fields
  const [editedResult, setEditedResult] = useState<CatalogixOutput | null>(null);

  const activeResult = editedResult || result;

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setGenerating(true);
    setResult(null);
    setEditedResult(null);

    const formData = new FormData();
    formData.append("product_name", productName);
    formData.append("department", department);
    formData.append("category", category);
    formData.append("attributes", attributes);
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    try {
      const response = await api.post("/api/catalogix/generate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
      setEditedResult(response.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Catalog generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Catalogix</h1>
            <span className="text-xs bg-cyan-600/20 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full">
              Catalog AI
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Generate SEO-optimized product titles, descriptions, keywords & tags instantly
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="card p-6">
              <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Product Details
              </h2>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="input-base"
                    placeholder="e.g., Slim Fit Linen Blazer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="input-base"
                    required
                  >
                    <option value="">Select department...</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-base"
                    required
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Product Attributes
                  </label>
                  <textarea
                    value={attributes}
                    onChange={(e) => setAttributes(e.target.value)}
                    className="input-base resize-none"
                    rows={4}
                    placeholder="Describe the product... e.g., Navy blue linen blazer, single button closure, notched lapels, two patch pockets, fully lined, sizes S-XXL, sustainable fabric"
                    required
                  />
                </div>

                {/* Optional Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Product Image{" "}
                    <span className="text-gray-600 font-normal">(optional)</span>
                  </label>

                  {previewUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-white/3 border border-white/5 rounded-lg">
                      <img
                        src={previewUrl}
                        alt="Product"
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1 text-sm text-gray-300 truncate">
                        {selectedFile?.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 border border-dashed border-white/10 hover:border-white/20 rounded-xl text-center text-sm text-gray-500 hover:text-gray-400 transition-all"
                    >
                      <Upload className="w-4 h-4 mx-auto mb-1" />
                      Click to upload product image (enhances AI output)
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={generating}
                  className="btn-gradient w-full flex items-center justify-center gap-2 py-3"
                  style={{
                    background: "linear-gradient(135deg, #0891b2, #1d4ed8)",
                  }}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Catalog...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Catalog Content
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Result */}
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
                >
                  <div className="card p-5 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-600/20 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          Crafting your catalog content
                        </div>
                        <div className="text-xs text-gray-500">
                          AI is writing SEO-optimized copy...
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                  <LoadingSkeleton />
                </motion.div>
              )}

              {activeResult && !generating && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Catalog Generated
                    </h3>
                    {result && <ConfidenceBadge score={result.confidence_score} />}
                  </div>

                  {/* SEO Title */}
                  <div className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                        SEO Title
                      </span>
                      <CopyButton text={activeResult.seo_title} />
                    </div>
                    <textarea
                      value={editedResult?.seo_title ?? ""}
                      onChange={(e) =>
                        setEditedResult((prev) =>
                          prev ? { ...prev, seo_title: e.target.value } : null
                        )
                      }
                      className="w-full bg-transparent text-white text-sm font-semibold resize-none border-none outline-none"
                      rows={2}
                    />
                    <div className="text-[10px] text-gray-600 mt-1">
                      {editedResult?.seo_title.length ?? 0} / 60 chars
                    </div>
                  </div>

                  {/* Description */}
                  <div className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                        Product Description
                      </span>
                      <CopyButton text={activeResult.description} />
                    </div>
                    <textarea
                      value={editedResult?.description ?? ""}
                      onChange={(e) =>
                        setEditedResult((prev) =>
                          prev ? { ...prev, description: e.target.value } : null
                        )
                      }
                      className="w-full bg-transparent text-gray-300 text-sm resize-none border-none outline-none leading-relaxed"
                      rows={6}
                    />
                  </div>

                  {/* Bullet Features */}
                  <div className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                        Key Features
                      </span>
                      <CopyButton
                        text={activeResult.bullet_features.map((f) => `• ${f}`).join("\n")}
                      />
                    </div>
                    <ul className="space-y-2">
                      {activeResult.bullet_features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                          <input
                            type="text"
                            value={editedResult?.bullet_features[i] ?? ""}
                            onChange={(e) => {
                              if (!editedResult) return;
                              const updated = [...editedResult.bullet_features];
                              updated[i] = e.target.value;
                              setEditedResult({ ...editedResult, bullet_features: updated });
                            }}
                            className="flex-1 bg-transparent text-gray-300 text-sm border-none outline-none"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Keywords & Tags */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Search className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                          Keywords
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeResult.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 bg-cyan-600/10 border border-cyan-500/20 text-cyan-300 rounded-full"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                          Tags
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeResult.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 bg-blue-600/10 border border-blue-500/20 text-blue-300 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setResult(null);
                      setEditedResult(null);
                      setProductName("");
                      setDepartment("");
                      setCategory("");
                      setAttributes("");
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="w-full py-2.5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-all text-sm"
                  >
                    Generate Another Catalog
                  </button>
                </motion.div>
              )}

              {!activeResult && !generating && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card p-12 text-center min-h-[400px] flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4 animate-float">
                    <BookOpen className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">
                    Catalog Preview
                  </h3>
                  <p className="text-gray-500 text-sm max-w-xs">
                    Fill in the product details and generate AI-powered SEO content for your fashion catalog
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
