"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Layers,
  Upload,
  Sparkles,
  Loader2,
  Download,
  X,
  ImageIcon,
  Wand2,
} from "lucide-react";
import api from "@/lib/api";

interface CADResult {
  front_url: string | null;
  back_url: string | null;
}

interface UploadSlot {
  file: File | null;
  preview: string | null;
}

function UploadZone({
  label,
  slot,
  onFile,
  onClear,
  accent,
}: {
  label: string;
  slot: UploadSlot;
  onFile: (file: File) => void;
  onClear: () => void;
  accent: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  return (
    <div className="flex-1">
      <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
        {label}
      </p>

      {slot.preview ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-[3/4]">
          <img
            src={slot.preview}
            alt={label}
            className="w-full h-full object-contain bg-surface-2"
          />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 border border-white/20 flex items-center justify-center hover:bg-red-500/80 transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </button>
          <div
            className="absolute bottom-0 left-0 right-0 py-1.5 text-center text-[10px] font-medium text-white"
            style={{ background: `${accent}99` }}
          >
            {slot.file?.name}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-white/20 hover:bg-white/2 transition-all"
          style={{ borderColor: `${accent}30` }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${accent}18` }}
          >
            <Upload className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div className="text-center px-4">
            <p className="text-xs font-medium text-gray-400">
              Drop image or click
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              JPG, PNG, WEBP
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}

function ResultCard({
  label,
  url,
  imagined,
  accent,
}: {
  label: string;
  url: string | null;
  imagined: boolean;
  accent: string;
}) {
  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `cad-flatlay-${label.toLowerCase()}-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
          {label}
        </p>
        {imagined && (
          <span
            className="text-[9px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1"
            style={{
              background: `${accent}15`,
              borderColor: `${accent}30`,
              color: accent,
            }}
          >
            <Wand2 className="w-2.5 h-2.5" />
            AI imagined
          </span>
        )}
      </div>

      {url ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-xl overflow-hidden border border-white/10 aspect-[3/4] bg-white"
        >
          <img
            src={url}
            alt={`CAD ${label}`}
            className="w-full h-full object-contain"
          />
          <button
            onClick={handleDownload}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-white" />
          </button>
        </motion.div>
      ) : (
        <div className="aspect-[3/4] rounded-xl border border-white/8 bg-surface-2 flex items-center justify-center">
          <div className="text-center">
            <ImageIcon className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-600">Failed to generate</p>
          </div>
        </div>
      )}
    </div>
  );
}

const ACCENT = "#34d399";

export default function CADFlatlay() {
  const [front, setFront] = useState<UploadSlot>({ file: null, preview: null });
  const [back, setBack] = useState<UploadSlot>({ file: null, preview: null });
  const [result, setResult] = useState<CADResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const hasAny = !!(front.file || back.file);

  const handleFile = (
    slot: "front" | "back",
    file: File,
  ) => {
    const preview = URL.createObjectURL(file);
    if (slot === "front") setFront({ file, preview });
    else setBack({ file, preview });
    setResult(null);
    setError("");
  };

  const handleClear = (slot: "front" | "back") => {
    if (slot === "front") setFront({ file: null, preview: null });
    else setBack({ file: null, preview: null });
    setResult(null);
  };

  const handleGenerate = async () => {
    if (!hasAny) return;
    setGenerating(true);
    setError("");
    setResult(null);

    try {
      const form = new FormData();
      if (front.file) form.append("front_image", front.file);
      if (back.file) form.append("back_image", back.file);

      const res = await api.post("/api/artifax/cad-flatlay/generate", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "CAD flatlay generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const frontImagined = !front.file && !!back.file;
  const backImagined = !back.file && !!front.file;

  return (
    <div className="flex h-full min-h-[calc(100vh-120px)]">
      {/* Left panel — upload */}
      <div className="w-72 flex-shrink-0 border-r border-white/5 overflow-y-auto p-5 flex flex-col gap-5">
        <div>
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: ACCENT }}
          >
            Upload Garment Images
          </h3>
          <p className="text-[11px] text-gray-600">
            Provide a front view, back view, or both. AI generates clean black
            line-drawing CAD specs for both. Missing views are imagined from
            the supplied image.
          </p>
        </div>

        <div className="flex gap-3">
          <UploadZone
            label="Front"
            slot={front}
            onFile={(f) => handleFile("front", f)}
            onClear={() => handleClear("front")}
            accent={ACCENT}
          />
          <UploadZone
            label="Back"
            slot={back}
            onFile={(f) => handleFile("back", f)}
            onClear={() => handleClear("back")}
            accent="#a78bfa"
          />
        </div>

        {/* What will be generated */}
        {hasAny && !generating && !result && (
          <div className="rounded-xl border border-white/8 bg-white/2 p-3 space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Will generate
            </p>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: ACCENT }}
              />
              Front CAD{" "}
              {frontImagined && (
                <span className="text-gray-600">(AI imagined from back)</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Back CAD{" "}
              {backImagined && (
                <span className="text-gray-600">(AI imagined from front)</span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-xs">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!hasAny || generating}
          className="btn-gradient w-full flex items-center justify-center gap-2 py-3 text-sm mt-auto disabled:opacity-40"
          style={
            hasAny
              ? { background: "linear-gradient(135deg, #10b981, #059669)" }
              : {}
          }
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate CAD Flatlay
            </>
          )}
        </button>
        {generating && (
          <p className="text-[10px] text-gray-600 text-center -mt-3">
            AI is rendering both views… ~30–60s
          </p>
        )}
      </div>

      {/* Right panel — results */}
      <div className="flex-1 overflow-y-auto p-6">
        {generating ? (
          <div className="h-full flex flex-col items-center justify-center gap-5">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}
              >
                <Layers className="w-9 h-9" style={{ color: ACCENT }} />
              </div>
              <div
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "#10b981" }}
              >
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Generating CAD flatlays</p>
              <p className="text-gray-500 text-sm mt-1">
                AI is rendering clean technical front and back views…
              </p>
            </div>
            <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${ACCENT}, #a78bfa)`,
                }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        ) : result ? (
          <div className="h-full flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" style={{ color: ACCENT }} />
              <h3 className="text-sm font-semibold text-white">
                CAD Flatlay — Front & Back
              </h3>
            </div>
            <div className="flex gap-4 flex-1">
              <ResultCard
                label="Front"
                url={result.front_url}
                imagined={frontImagined}
                accent={ACCENT}
              />
              <ResultCard
                label="Back"
                url={result.back_url}
                imagined={backImagined}
                accent="#a78bfa"
              />
            </div>
            <button
              onClick={handleGenerate}
              className="self-center flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Regenerate
            </button>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}20` }}
            >
              <Layers className="w-7 h-7" style={{ color: `${ACCENT}80` }} />
            </div>
            <div>
              <h3 className="text-gray-400 font-medium mb-1">
                No flatlay generated yet
              </h3>
              <p className="text-gray-600 text-sm max-w-xs">
                Upload a front image, back image, or both on the left. The AI
                will generate clean black line-drawing CAD specs for both views.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
