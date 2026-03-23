"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Sparkles,
  Loader2,
  Trash2,
  Check,
  Upload,
  Copy,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import { useArtifaxStore, SavedPalette, PaletteColor } from "@/store/artifaxStore";
import { copyToClipboard } from "@/lib/utils";

const MOODS = ["Sophisticated", "Playful", "Earthy", "Minimal", "Bold", "Romantic", "Edgy", "Serene"];
const SEASONS = ["SS25", "AW25", "Resort 25", "Pre-Fall 25", "SS26", "Perennial"];

function SwatchCard({ color, size = "md" }: { color: PaletteColor; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(color.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const dim = size === "sm" ? "w-10 h-10" : "w-14 h-14";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-all group"
    >
      <div
        className={`${dim} rounded-xl border border-white/10 flex-shrink-0 shadow-lg cursor-pointer`}
        style={{ backgroundColor: color.hex }}
        onClick={handleCopy}
        title="Click to copy hex"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-white">{color.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500 capitalize">
            {color.usage}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs text-gray-500 font-mono">{color.hex}</span>
          <button onClick={handleCopy} className="text-gray-600 hover:text-gray-300 transition-colors">
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        {color.description && (
          <p className="text-[11px] text-gray-600 mt-0.5 truncate">{color.description}</p>
        )}
      </div>
    </motion.div>
  );
}

function PaletteCard({
  palette,
  isActive,
  onActivate,
  onDelete,
}: {
  palette: SavedPalette;
  isActive: boolean;
  onActivate: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-2xl p-4 border cursor-pointer transition-all ${
        isActive
          ? "border-pink-500/30 bg-pink-500/5"
          : "border-white/5 bg-white/2 hover:border-white/10"
      }`}
      onClick={onActivate}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-white">{palette.palette_name}</h4>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{palette.mood_description}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-gray-600 hover:text-red-400 transition-colors ml-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-1.5">
        {palette.palette.map((c, i) => (
          <div
            key={i}
            className="flex-1 h-6 rounded-lg border border-white/10"
            style={{ backgroundColor: c.hex }}
            title={c.name}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function ColorStudio() {
  const { project, addPalette, removePalette, setActivePalette } = useArtifaxStore();
  const { palettes, activePaletteId } = project.colorData;
  const activePalette = palettes.find((p) => p.id === activePaletteId) || null;

  const [mode, setMode] = useState<"generate" | "extract">("generate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate form
  const [genForm, setGenForm] = useState({ concept: "", mood: "Sophisticated", season: "SS25", count: "5" });

  const handleGenerate = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/artifax/concept/color", {
        concept: genForm.concept,
        mood: genForm.mood,
        season: genForm.season,
        count: parseInt(genForm.count),
      });
      const newPalette: SavedPalette = {
        id: `palette-${Date.now()}`,
        palette_name: res.data.palette_name,
        mood_description: res.data.mood_description,
        palette: res.data.palette,
      };
      addPalette(newPalette);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async (file: File) => {
    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await api.post("/api/artifax/concept/extract-colors", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newPalette: SavedPalette = {
        id: `palette-${Date.now()}`,
        palette_name: res.data.palette_name,
        mood_description: res.data.mood_description,
        palette: res.data.palette,
      };
      addPalette(newPalette);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Extraction failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-120px)]">
      {/* Left: Controls */}
      <div className="w-80 flex-shrink-0 border-r border-white/5 flex flex-col">
        {/* Mode toggle */}
        <div className="p-4 border-b border-white/5">
          <div className="flex rounded-xl bg-white/3 p-1 gap-1">
            {[
              { id: "generate", label: "Generate AI", icon: Sparkles },
              { id: "extract", label: "Extract from Image", icon: Upload },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as "generate" | "extract")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  mode === m.id
                    ? "bg-pink-600/20 border border-pink-500/30 text-pink-300"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <m.icon className="w-3.5 h-3.5" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          <AnimatePresence mode="wait">
            {mode === "generate" ? (
              <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Collection Concept</label>
                  <textarea
                    value={genForm.concept}
                    onChange={(e) => setGenForm({ ...genForm, concept: e.target.value })}
                    rows={3}
                    className="input-base text-sm resize-none"
                    placeholder="e.g. Minimalist summer collection inspired by coastal living..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Mood</label>
                  <select value={genForm.mood} onChange={(e) => setGenForm({ ...genForm, mood: e.target.value })} className="input-base text-sm">
                    {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Season</label>
                  <select value={genForm.season} onChange={(e) => setGenForm({ ...genForm, season: e.target.value })} className="input-base text-sm">
                    {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Number of Colors</label>
                  <div className="flex gap-2">
                    {["4", "5", "6", "7"].map((n) => (
                      <button
                        key={n}
                        onClick={() => setGenForm({ ...genForm, count: n })}
                        className={`flex-1 py-2 rounded-lg text-sm border transition-all ${
                          genForm.count === n
                            ? "bg-pink-600/20 border-pink-500/30 text-pink-300"
                            : "border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={loading || !genForm.concept.trim()}
                  className="btn-gradient w-full flex items-center justify-center gap-2 py-2.5 text-sm"
                  style={{ background: "linear-gradient(135deg, #db2777, #9d174d)" }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Palette
                </button>
              </motion.div>
            ) : (
              <motion.div key="extract" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <p className="text-xs text-gray-600">
                  Upload any fashion image — a photo, illustration, or moodboard — and AI will extract a color palette from it.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full border-2 border-dashed border-pink-500/20 hover:border-pink-500/40 rounded-xl p-8 text-center transition-all"
                >
                  <Upload className="w-8 h-8 mx-auto text-pink-400/60 mb-2" />
                  <p className="text-sm text-gray-400 font-medium">Click to upload image</p>
                  <p className="text-xs text-gray-600 mt-1">JPEG, PNG, WebP</p>
                  {loading && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-pink-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Extracting colors…
                    </div>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleExtract(file);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Saved palettes list */}
        {palettes.length > 0 && (
          <div className="border-t border-white/5 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Saved Palettes ({palettes.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {palettes.map((p) => (
                <PaletteCard
                  key={p.id}
                  palette={p}
                  isActive={activePaletteId === p.id}
                  onActivate={() => setActivePalette(p.id)}
                  onDelete={() => removePalette(p.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Active palette display */}
      <div className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-pink-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center">
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-medium text-sm">Creating your color palette</p>
                <p className="text-gray-500 text-xs mt-0.5">AI is crafting a cohesive collection palette…</p>
              </div>
              <div className="w-56 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-pink-600 to-rose-600" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
              </div>
            </motion.div>
          )}

          {!loading && activePalette && (
            <motion.div key={activePalette.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
              {/* Palette header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-1">{activePalette.palette_name}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">{activePalette.mood_description}</p>
              </div>

              {/* Full-width color bars */}
              <div className="flex rounded-2xl overflow-hidden h-20 mb-6 shadow-2xl">
                {activePalette.palette.map((c, i) => (
                  <div
                    key={i}
                    className="flex-1 transition-transform hover:scale-y-110 cursor-pointer"
                    style={{ backgroundColor: c.hex }}
                    title={`${c.name} — ${c.hex}`}
                  />
                ))}
              </div>

              {/* Individual swatches */}
              <div className="space-y-2">
                {activePalette.palette.map((color, i) => (
                  <SwatchCard key={i} color={color} />
                ))}
              </div>
            </motion.div>
          )}

          {!loading && !activePalette && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-pink-500/8 border border-pink-500/15 flex items-center justify-center mx-auto mb-4 animate-float">
                <Palette className="w-7 h-7 text-pink-400/60" />
              </div>
              <h3 className="text-gray-400 font-medium mb-1">No palette selected</h3>
              <p className="text-gray-600 text-sm max-w-xs">
                Generate a new palette from a concept description, or extract colors from any image
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
