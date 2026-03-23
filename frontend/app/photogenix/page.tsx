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
  User,
  Clapperboard,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { PhotogenixOutput } from "@/types";

// ─── Product Photo constants ──────────────────────────────────────────────────
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

// ─── On-Model constants ───────────────────────────────────────────────────────
const MODEL_GENDERS = ["Female", "Male", "Non-binary"];
const MODEL_AGE_RANGES = ["18-24", "25-30", "31-40", "40+"];
const MODEL_ETHNICITIES = [
  "South Asian", "East Asian", "Black", "White", "Hispanic",
  "Middle Eastern", "Mixed",
];
const MODEL_BODY_TYPES = ["Slim", "Athletic", "Curvy", "Plus-size"];
const MODEL_POSES = ["Standing", "Walking", "Seated", "Editorial", "Dynamic"];
const MODEL_EXPRESSIONS = ["Natural", "Smiling", "Serious", "Confident", "Candid"];
const MODEL_MOODS = ["Editorial", "E-commerce", "Lifestyle", "Street", "Luxury"];

const SCENE_PRESETS = [
  { value: "studio", label: "Studio" },
  { value: "outdoor", label: "Outdoor" },
  { value: "urban_street", label: "Urban Street" },
  { value: "luxury_interior", label: "Luxury Interior" },
  { value: "runway", label: "Runway" },
  { value: "beach", label: "Beach" },
  { value: "cafe", label: "Café" },
  { value: "rooftop", label: "Rooftop" },
  { value: "boutique", label: "Boutique" },
  { value: "desert", label: "Desert" },
  { value: "editorial", label: "Editorial" },
];

const LIGHTING_OPTIONS = [
  "Softbox", "Natural Daylight", "Warm Golden", "Dramatic", "High-Fashion", "Moody",
];

const CAMERA_OPTIONS = [
  "Full Body", "Close-up", "Editorial Crop", "E-commerce", "3/4 Angle",
];

// ─── Shared upload zone ───────────────────────────────────────────────────────
function UploadZone({
  previewUrl,
  selectedFile,
  onFile,
  onClear,
  accentColor = "pink",
}: {
  previewUrl: string | null;
  selectedFile: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
  accentColor?: "pink" | "purple";
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const accent = accentColor === "purple" ? "purple" : "pink";

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${
        isDragging
          ? `border-${accent}-500/60 bg-${accent}-600/10`
          : previewUrl
          ? "border-white/10"
          : "border-white/10 hover:border-white/20 hover:bg-white/3"
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
      }}
      onClick={() => !previewUrl && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      {previewUrl ? (
        <div className="relative">
          <img src={previewUrl} alt="Uploaded product" className="max-h-48 mx-auto rounded-lg object-contain" />
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute top-0 right-0 w-7 h-7 bg-red-500/80 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-400">
            <Check className="w-4 h-4 text-green-400" />
            {selectedFile?.name}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors underline"
          >
            Change image
          </button>
        </div>
      ) : (
        <>
          <div className={`w-12 h-12 rounded-xl bg-${accent}-600/10 border border-${accent}-500/20 flex items-center justify-center mx-auto mb-3`}>
            <ImageIcon className={`w-5 h-5 text-${accent}-400`} />
          </div>
          <p className="text-gray-300 text-sm font-medium mb-1">Drop your product image here</p>
          <p className="text-gray-600 text-xs">or click to browse · JPEG, PNG, WebP</p>
        </>
      )}
    </div>
  );
}

// ─── Result panel ─────────────────────────────────────────────────────────────
function ResultPanel({
  result,
  generating,
  onReset,
  label,
  accentColor = "pink",
}: {
  result: PhotogenixOutput | null;
  generating: boolean;
  onReset: () => void;
  label: string;
  accentColor?: "pink" | "purple";
}) {
  const accent = accentColor === "purple" ? "purple" : "pink";
  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.generated_image_url;
    a.download = `photogenix-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  if (generating) return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="card p-8 text-center h-full min-h-[400px] flex flex-col items-center justify-center"
    >
      <div className="relative mb-6">
        <div className={`w-20 h-20 rounded-2xl bg-${accent}-600/20 border border-${accent}-500/20 flex items-center justify-center mx-auto`}>
          <Camera className={`w-9 h-9 text-${accent}-400`} />
        </div>
        <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-${accent}-600 flex items-center justify-center`}>
          <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
        </div>
      </div>
      <h3 className="font-semibold text-white mb-2">AI is generating your {label}</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-xs">This takes 30–60 seconds…</p>
      <div className="w-full max-w-xs h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r from-${accent}-600 to-rose-500 rounded-full`}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );

  if (result) return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          {label} Generated
        </h3>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3">
          <div className="text-xs text-gray-500 mb-2 font-medium">ORIGINAL</div>
          <img src={result.original_image_url} alt="Original" className="w-full rounded-lg object-contain max-h-64 bg-white/3" />
        </div>
        <div className={`card p-3 border-${accent}-500/20`}>
          <div className={`text-xs text-${accent}-400 mb-2 font-medium`}>AI GENERATED</div>
          <img src={result.generated_image_url} alt="Generated" className="w-full rounded-lg object-contain max-h-64 bg-white/3" />
        </div>
      </div>
      <button
        onClick={onReset}
        className="w-full py-2.5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-all text-sm"
      >
        Generate Another
      </button>
    </motion.div>
  );

  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="card p-12 text-center min-h-[400px] flex flex-col items-center justify-center"
    >
      <div className={`w-16 h-16 rounded-2xl bg-${accent}-600/10 border border-${accent}-500/20 flex items-center justify-center mx-auto mb-4`}>
        <Camera className={`w-7 h-7 text-${accent}-400`} />
      </div>
      <h3 className="font-semibold text-white mb-2">Before & After Preview</h3>
      <p className="text-gray-500 text-sm max-w-xs">Configure settings and generate to see the result here</p>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PhotogenixPage() {
  const { isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"product" | "on-model">("product");

  // Product Photo state
  const [ppFile, setPpFile] = useState<File | null>(null);
  const [ppPreview, setPpPreview] = useState<string | null>(null);
  const [background, setBackground] = useState("white_studio");
  const [style, setStyle] = useState("Studio");
  const [ppGenerating, setPpGenerating] = useState(false);
  const [ppResult, setPpResult] = useState<PhotogenixOutput | null>(null);
  const [ppError, setPpError] = useState("");

  // On-Model state
  const [omFile, setOmFile] = useState<File | null>(null);
  const [omPreview, setOmPreview] = useState<string | null>(null);
  const [omGender, setOmGender] = useState("Female");
  const [omAge, setOmAge] = useState("25-30");
  const [omEthnicity, setOmEthnicity] = useState("South Asian");
  const [omBodyType, setOmBodyType] = useState("Slim");
  const [omPose, setOmPose] = useState("Standing");
  const [omExpression, setOmExpression] = useState("Natural");
  const [omMood, setOmMood] = useState("Editorial");
  const [omScene, setOmScene] = useState("studio");
  const [omLighting, setOmLighting] = useState("Softbox");
  const [omCamera, setOmCamera] = useState("Full Body");
  const [omWarmth, setOmWarmth] = useState(50);
  const [omCustomScene, setOmCustomScene] = useState("");
  const [omGenerating, setOmGenerating] = useState(false);
  const [omResult, setOmResult] = useState<PhotogenixOutput | null>(null);
  const [omError, setOmError] = useState("");

  const handleFileSelect = (file: File, mode: "product" | "on-model") => {
    if (!file.type.startsWith("image/")) return;
    if (mode === "product") {
      setPpFile(file); setPpPreview(URL.createObjectURL(file)); setPpResult(null); setPpError("");
    } else {
      setOmFile(file); setOmPreview(URL.createObjectURL(file)); setOmResult(null); setOmError("");
    }
  };

  const handleProductGenerate = async () => {
    if (!ppFile) return;
    setPpError(""); setPpGenerating(true); setPpResult(null);
    const formData = new FormData();
    formData.append("image", ppFile);
    formData.append("background_type", background);
    formData.append("shooting_style", style);
    try {
      const res = await api.post("/api/photogenix/generate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPpResult(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setPpError(e.response?.data?.detail || "Generation failed. Please try again.");
    } finally {
      setPpGenerating(false);
    }
  };

  const handleOnModelGenerate = async () => {
    if (!omFile) return;
    setOmError(""); setOmGenerating(true); setOmResult(null);
    const formData = new FormData();
    formData.append("image", omFile);
    formData.append("gender", omGender.toLowerCase());
    formData.append("age_range", omAge);
    formData.append("ethnicity", omEthnicity);
    formData.append("body_type", omBodyType.toLowerCase());
    formData.append("pose", omPose.toLowerCase());
    formData.append("expression", omExpression.toLowerCase());
    formData.append("shoot_mood", omMood.toLowerCase());
    formData.append("background_type", omScene);
    formData.append("lighting", omLighting);
    formData.append("camera_angle", omCamera);
    formData.append("warmth", String(omWarmth / 100));
    formData.append("custom_scene_prompt", omCustomScene);
    try {
      const res = await api.post("/api/photogenix/on-model", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setOmResult(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setOmError(e.response?.data?.detail || "Generation failed. Please try again.");
    } finally {
      setOmGenerating(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
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
            AI-powered product photography and on-model visualisation
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-2 rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab("product")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "product"
                ? "bg-gradient-to-r from-pink-600 to-rose-700 text-white shadow-lg shadow-pink-500/25"
                : "t-secondary hover:t-heading hover:bg-wash"
            }`}
          >
            <Camera className="w-4 h-4" />
            Product Photo
          </button>
          <button
            onClick={() => setActiveTab("on-model")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "on-model"
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                : "t-secondary hover:t-heading hover:bg-wash"
            }`}
          >
            <User className="w-4 h-4" />
            On-Model Visualisation
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Product Photo Tab ── */}
          {activeTab === "product" && (
            <motion.div
              key="product"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Settings */}
                <div className="space-y-4">
                  <div className="card p-5">
                    <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-pink-400" />
                      Upload Product Image
                    </h2>
                    <UploadZone
                      previewUrl={ppPreview}
                      selectedFile={ppFile}
                      onFile={(f) => handleFileSelect(f, "product")}
                      onClear={() => { setPpFile(null); setPpPreview(null); setPpResult(null); }}
                      accentColor="pink"
                    />
                  </div>

                  <div className="card p-5">
                    <h2 className="font-semibold text-white mb-3 text-sm">Background Type</h2>
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
                          <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${background === opt.value ? "border-pink-400 bg-pink-400" : "border-gray-600"}`} />
                          <div>
                            <div className="text-sm font-medium">{opt.label}</div>
                            <div className="text-xs text-gray-600">{opt.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="card p-5">
                    <h2 className="font-semibold text-white mb-3 text-sm">Photography Style</h2>
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

                  {ppError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{ppError}</div>
                  )}

                  <button
                    onClick={handleProductGenerate}
                    disabled={!ppFile || ppGenerating}
                    className="btn-gradient w-full flex items-center justify-center gap-2 py-3"
                    style={{ background: "linear-gradient(135deg, #db2777, #9f1239)" }}
                  >
                    {ppGenerating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Generating AI Photo...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" />Generate AI Photo<ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>

                {/* Right: Result */}
                <AnimatePresence mode="wait">
                  <ResultPanel
                    result={ppResult}
                    generating={ppGenerating}
                    onReset={() => { setPpResult(null); setPpFile(null); setPpPreview(null); }}
                    label="AI Photo"
                    accentColor="pink"
                  />
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ── On-Model Tab ── */}
          {activeTab === "on-model" && (
            <motion.div
              key="on-model"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Settings */}
                <div className="space-y-4">
                  {/* Upload */}
                  <div className="card p-5">
                    <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-purple-400" />
                      Upload Product Image
                    </h2>
                    <UploadZone
                      previewUrl={omPreview}
                      selectedFile={omFile}
                      onFile={(f) => handleFileSelect(f, "on-model")}
                      onClear={() => { setOmFile(null); setOmPreview(null); setOmResult(null); }}
                      accentColor="purple"
                    />
                  </div>

                  {/* Model Studio */}
                  <div className="card p-5">
                    <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-400" />
                      Model Studio
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Gender", value: omGender, set: setOmGender, opts: MODEL_GENDERS },
                        { label: "Age Range", value: omAge, set: setOmAge, opts: MODEL_AGE_RANGES },
                        { label: "Ethnicity", value: omEthnicity, set: setOmEthnicity, opts: MODEL_ETHNICITIES },
                        { label: "Body Type", value: omBodyType, set: setOmBodyType, opts: MODEL_BODY_TYPES },
                        { label: "Pose", value: omPose, set: setOmPose, opts: MODEL_POSES },
                        { label: "Expression", value: omExpression, set: setOmExpression, opts: MODEL_EXPRESSIONS },
                        { label: "Shoot Mood", value: omMood, set: setOmMood, opts: MODEL_MOODS },
                      ].map(({ label, value, set, opts }) => (
                        <div key={label}>
                          <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                          <select
                            value={value}
                            onChange={(e) => set(e.target.value)}
                            className="input-base w-full rounded-lg text-sm py-2 px-3"
                          >
                            {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scene Builder */}
                  <div className="card p-5">
                    <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <Clapperboard className="w-4 h-4 text-purple-400" />
                      Scene Builder
                    </h2>

                    {/* Scene preset pills */}
                    <div className="mb-3">
                      <label className="text-xs text-gray-500 mb-2 block">Scene</label>
                      <div className="flex flex-wrap gap-1.5">
                        {SCENE_PRESETS.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => setOmScene(s.value)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              omScene === s.value
                                ? "bg-purple-600/30 border border-purple-500/50 text-purple-300"
                                : "bg-white/5 border border-white/10 text-gray-400 hover:text-gray-200"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Lighting</label>
                        <select
                          value={omLighting}
                          onChange={(e) => setOmLighting(e.target.value)}
                          className="input-base w-full rounded-lg text-sm py-2 px-3"
                        >
                          {LIGHTING_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Camera Angle</label>
                        <select
                          value={omCamera}
                          onChange={(e) => setOmCamera(e.target.value)}
                          className="input-base w-full rounded-lg text-sm py-2 px-3"
                        >
                          {CAMERA_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="text-xs text-gray-500 mb-1 block">
                        Warmth — {omWarmth < 40 ? "Cool" : omWarmth > 60 ? "Warm" : "Neutral"}
                      </label>
                      <input
                        type="range" min={0} max={100} value={omWarmth}
                        onChange={(e) => setOmWarmth(Number(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Custom Scene Instructions (optional)</label>
                      <textarea
                        value={omCustomScene}
                        onChange={(e) => setOmCustomScene(e.target.value)}
                        rows={2}
                        placeholder="e.g. Misty morning forest, dappled light through canopy…"
                        className="input-base w-full rounded-lg text-sm py-2 px-3 resize-none"
                      />
                    </div>
                  </div>

                  {omError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{omError}</div>
                  )}

                  <button
                    onClick={handleOnModelGenerate}
                    disabled={!omFile || omGenerating}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
                  >
                    {omGenerating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Generating Visualisation...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" />Visualise on Model<ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>

                {/* Right: Result */}
                <AnimatePresence mode="wait">
                  <ResultPanel
                    result={omResult}
                    generating={omGenerating}
                    onReset={() => { setOmResult(null); setOmFile(null); setOmPreview(null); }}
                    label="On-Model Visualisation"
                    accentColor="purple"
                  />
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
