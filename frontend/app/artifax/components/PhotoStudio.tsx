"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Sparkles,
  Loader2,
  Download,
  RotateCcw,
  ChevronRight,
  Check,
} from "lucide-react";
import api from "@/lib/api";
import { useArtifaxStore, VisualizationImage } from "@/store/artifaxStore";

const GARMENT_TYPES = ["Shirt", "Blouse", "T-Shirt", "Kurta", "Dress", "Saree", "Jacket", "Coat", "Blazer", "Pants", "Trousers", "Skirt", "Jeans", "Shorts", "Jumpsuit", "Lehenga", "Palazzo", "Co-ord Set"];
const SLEEVE_LENGTHS = ["Sleeveless", "Short (Cap)", "Half (Elbow)", "3/4 Length", "Full Length", "Bishop", "Puff"];
const NECK_TYPES = ["Round", "V-Neck", "U-Neck", "Square", "Boat/Bateau", "Collared", "Mandarin", "Sweetheart", "Off-Shoulder", "Halter", "Cowl"];
const FITS = ["Slim Fit", "Regular Fit", "Relaxed Fit", "Oversized", "Tailored", "A-Line", "Bodycon", "Straight"];
const FABRIC_TEXTURES = ["Cotton Poplin", "Linen", "Silk", "Georgette", "Chiffon", "Crepe", "Jersey Knit", "Denim", "Velvet", "Leather", "Brocade", "Organza", "Satin"];
const PRINT_PATTERNS = ["Solid", "Stripes", "Checks/Plaid", "Floral Print", "Abstract Print", "Animal Print", "Geometric", "Polka Dot", "Paisley", "Block Print", "Embroidered", "Lace"];
const LENGTHS = ["Mini (Above Knee)", "Knee Length", "Midi (Below Knee)", "Maxi (Ankle)", "Full Length", "Cropped", "Regular (Hip)"];
const ANGLES = ["Front", "Back", "Side", "Detail", "Flat"];

const ANGLE_ICONS: Record<string, string> = {
  Front: "🔵",
  Back: "🔴",
  Side: "🟡",
  Detail: "🟣",
  Flat: "⬛",
};

function AttrSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-base text-sm py-2">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function PhotoStudio() {
  const { project, addVisualizationImage, setAttributes } = useArtifaxStore();
  const images = project.visualization.images;
  const savedAttrs = project.visualization.attributes;

  const [attrs, setAttrs] = useState({
    garment_type: savedAttrs.garment_type || "Shirt",
    sleeve_length: savedAttrs.sleeve_length || "Full Length",
    neck_type: savedAttrs.neck_type || "Collared",
    fit: savedAttrs.fit || "Regular Fit",
    fabric_texture: savedAttrs.fabric_texture || "Cotton Poplin",
    print_pattern: savedAttrs.print_pattern || "Solid",
    color: savedAttrs.color || "Navy Blue",
    length: savedAttrs.length || "Regular (Hip)",
    additional_details: savedAttrs.additional_details || "",
  });

  const [selectedAngle, setSelectedAngle] = useState("Front");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    setAttributes(attrs);
    try {
      const res = await api.post("/api/artifax/visualization/generate", {
        attributes: attrs,
        angle: selectedAngle,
      });
      const newImg: VisualizationImage = {
        url: res.data.image_url,
        angle: selectedAngle,
        timestamp: Date.now(),
      };
      addVisualizationImage(newImg);
      setActiveImageIndex(0);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Visualization generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `photo-studio-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  const activeImage = images[activeImageIndex] || null;

  return (
    <div className="flex h-full min-h-[calc(100vh-120px)]">
      {/* Left: Attribute panel */}
      <div className="w-72 flex-shrink-0 border-r border-white/5 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-4">
            Product Attributes
          </h3>

          <div className="space-y-3">
            <AttrSelect label="Garment Type" value={attrs.garment_type} onChange={(v) => setAttrs({ ...attrs, garment_type: v })} options={GARMENT_TYPES} />
            <AttrSelect label="Sleeve Length" value={attrs.sleeve_length} onChange={(v) => setAttrs({ ...attrs, sleeve_length: v })} options={SLEEVE_LENGTHS} />
            <AttrSelect label="Neckline" value={attrs.neck_type} onChange={(v) => setAttrs({ ...attrs, neck_type: v })} options={NECK_TYPES} />
            <AttrSelect label="Fit" value={attrs.fit} onChange={(v) => setAttrs({ ...attrs, fit: v })} options={FITS} />
            <AttrSelect label="Fabric / Texture" value={attrs.fabric_texture} onChange={(v) => setAttrs({ ...attrs, fabric_texture: v })} options={FABRIC_TEXTURES} />
            <AttrSelect label="Print / Pattern" value={attrs.print_pattern} onChange={(v) => setAttrs({ ...attrs, print_pattern: v })} options={PRINT_PATTERNS} />

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
              <input
                type="text"
                value={attrs.color}
                onChange={(e) => setAttrs({ ...attrs, color: e.target.value })}
                placeholder="e.g. Navy Blue, Dusty Rose..."
                className="input-base text-sm py-2"
              />
            </div>

            <AttrSelect label="Length" value={attrs.length} onChange={(v) => setAttrs({ ...attrs, length: v })} options={LENGTHS} />

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Additional Details</label>
              <textarea
                value={attrs.additional_details}
                onChange={(e) => setAttrs({ ...attrs, additional_details: e.target.value })}
                rows={3}
                className="input-base text-sm resize-none"
                placeholder="e.g. pleated front, side slit, button placket..."
              />
            </div>
          </div>

          {/* Angle selector */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">View Angle</label>
            <div className="grid grid-cols-5 gap-1">
              {ANGLES.map((angle) => (
                <button
                  key={angle}
                  onClick={() => setSelectedAngle(angle)}
                  className={`py-2 rounded-lg text-[10px] font-medium border transition-all ${
                    selectedAngle === angle
                      ? "bg-orange-500/15 border-orange-500/30 text-orange-300"
                      : "border-white/5 text-gray-600 hover:border-white/10 hover:text-gray-400"
                  }`}
                >
                  {angle}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-xs">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-gradient w-full flex items-center justify-center gap-2 py-3 text-sm mt-4"
            style={{ background: "linear-gradient(135deg, #ea580c, #c2410c)" }}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Visualization
              </>
            )}
          </button>
          {generating && (
            <p className="text-[10px] text-gray-600 text-center mt-2">
              DALL-E 3 is rendering your product… ~30s
            </p>
          )}
        </div>
      </div>

      {/* Center: Main image view */}
      <div className="flex-1 flex flex-col">
        {generating ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Camera className="w-9 h-9 text-orange-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Visualizing your garment</p>
              <p className="text-gray-500 text-sm mt-1">
                AI is rendering a professional {selectedAngle.toLowerCase()} view…
              </p>
            </div>
            <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-orange-600 to-red-600"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            {/* Attr summary */}
            <div className="flex flex-wrap gap-2 max-w-sm justify-center">
              {[attrs.garment_type, attrs.color, attrs.fabric_texture, attrs.print_pattern, selectedAngle + " view"].map((a, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/15 text-orange-300">
                  {a}
                </span>
              ))}
            </div>
          </div>
        ) : activeImage ? (
          <motion.div
            key={activeImage.url}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-6"
          >
            <div className="relative max-w-lg w-full">
              <img
                src={activeImage.url}
                alt="AI visualization"
                className="w-full rounded-2xl border border-white/8 shadow-2xl"
              />
              <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                <Check className="w-3 h-3 text-green-400" />
                <span className="text-xs text-gray-300">{activeImage.angle} View</span>
              </div>
              <button
                onClick={() => handleDownload(activeImage.url)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <button
              onClick={handleGenerate}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Regenerate
            </button>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/8 border border-orange-500/15 flex items-center justify-center mx-auto mb-4 animate-float">
              <Camera className="w-7 h-7 text-orange-400/60" />
            </div>
            <h3 className="text-gray-400 font-medium mb-2">No visualization yet</h3>
            <p className="text-gray-600 text-sm max-w-sm">
              Configure your garment attributes in the left panel, select a view angle, and generate an AI product visualization
            </p>
          </div>
        )}
      </div>

      {/* Right: History panel */}
      {images.length > 0 && (
        <div className="w-52 flex-shrink-0 border-l border-white/5 overflow-y-auto p-3">
          <h4 className="text-[11px] text-gray-600 uppercase tracking-wider mb-3">History</h4>
          <div className="space-y-2">
            {images.map((img, i) => (
              <motion.button
                key={i}
                onClick={() => setActiveImageIndex(i)}
                whileHover={{ scale: 1.02 }}
                className={`w-full rounded-xl overflow-hidden border-2 transition-all ${
                  activeImageIndex === i
                    ? "border-orange-500/50"
                    : "border-transparent hover:border-white/10"
                }`}
              >
                <div className="relative">
                  <img src={img.url} alt="" className="w-full aspect-square object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-1 text-[10px] text-center text-gray-300">
                    {img.angle}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
