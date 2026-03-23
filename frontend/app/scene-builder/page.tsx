"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clapperboard,
  Sun,
  Camera,
  Thermometer,
  Zap,
  Loader2,
  ImageIcon,
  Building2,
  TreePine,
  Building,
  Crown,
  Footprints,
  Waves,
  Coffee,
  CloudSun,
  Store,
  Mountain,
  BookOpen,
  PenTool,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

const SCENE_PRESETS = [
  { value: "studio", label: "Studio", icon: Camera },
  { value: "outdoor", label: "Outdoor", icon: TreePine },
  { value: "urban_street", label: "Urban Street", icon: Building },
  { value: "luxury_interior", label: "Luxury Interior", icon: Crown },
  { value: "runway", label: "Runway", icon: Footprints },
  { value: "beach", label: "Beach", icon: Waves },
  { value: "cafe", label: "Cafe", icon: Coffee },
  { value: "rooftop", label: "Rooftop", icon: CloudSun },
  { value: "boutique", label: "Boutique", icon: Store },
  { value: "desert", label: "Desert", icon: Mountain },
  { value: "editorial", label: "Editorial", icon: BookOpen },
  { value: "custom", label: "Custom", icon: PenTool },
];

const LIGHTING_OPTIONS = [
  "Softbox",
  "Natural Daylight",
  "Warm Golden",
  "Dramatic",
  "High-Fashion",
  "Moody",
];

const CAMERA_OPTIONS = [
  "Full Body",
  "Close-up",
  "Editorial Crop",
  "E-commerce",
  "3/4 Angle",
];

export default function SceneBuilderPage() {
  const { isLoading } = useAuth();
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [lighting, setLighting] = useState("Softbox");
  const [camera, setCamera] = useState("Full Body");
  const [warmth, setWarmth] = useState(50);
  const [intensity, setIntensity] = useState(50);
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedScene) return;
    setGenerating(true);
    try {
      const response = await api.post("/api/scene-builder/generate", {
        background_type: selectedScene,
        lighting,
        camera_angle: camera,
        warmth: warmth / 100,
        intensity: intensity / 100,
        custom_prompt: customPrompt,
      });
      setResultImage(`http://localhost:8000${response.data.scene_image_url}`);
    } catch {
      // Error handled silently
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-primary">
      <Sidebar />
      <div className="ml-60 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold t-heading">Scene Builder</h1>
              <p className="text-sm t-muted">
                Create stunning backgrounds and scenes for fashion photography
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-6">
          {/* Left - Scene Presets */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="w-[280px] flex-shrink-0"
          >
            <div className="card p-5 sticky top-6">
              <h3 className="text-sm font-semibold t-heading uppercase tracking-wider mb-4">
                Scene Presets
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {SCENE_PRESETS.map((scene, idx) => {
                  const Icon = scene.icon;
                  const isActive = selectedScene === scene.value;
                  return (
                    <motion.button
                      key={scene.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * idx }}
                      onClick={() => setSelectedScene(scene.value)}
                      className={`flex flex-col items-center gap-2 p-3.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-br from-purple-600/20 to-pink-500/20 border-2 border-purple-500 t-heading shadow-lg shadow-purple-500/10"
                          : "bg-surface-2 border b-subtle t-secondary hover:bg-wash hover:border-theme"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-purple-400" : ""}`} />
                      <span>{scene.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Center - Preview Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1"
          >
            <div className="card p-1 min-h-[600px] flex items-center justify-center overflow-hidden">
              {generating ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-500/20 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium t-heading">Generating your scene...</p>
                    <p className="text-xs t-muted mt-1">This may take a few moments</p>
                  </div>
                </div>
              ) : resultImage ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={resultImage}
                  alt="Generated scene"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 p-12">
                  <div className="w-full max-w-md aspect-video rounded-2xl border-2 border-dashed b-subtle flex flex-col items-center justify-center gap-4 bg-surface-2/50">
                    <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 t-faint" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium t-heading">
                        Your scene will appear here
                      </p>
                      <p className="text-xs t-muted mt-1">
                        Select a scene preset and configure settings to generate
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right - Controls */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-[280px] flex-shrink-0"
          >
            <div className="card p-5 space-y-5 sticky top-6">
              <h3 className="text-sm font-semibold t-heading uppercase tracking-wider">
                Scene Controls
              </h3>

              {/* Lighting */}
              <div>
                <label className="text-xs font-medium t-secondary mb-2 block">
                  <Sun className="w-3.5 h-3.5 inline mr-1.5" />
                  Lighting
                </label>
                <select
                  value={lighting}
                  onChange={(e) => setLighting(e.target.value)}
                  className="input-base w-full rounded-lg text-sm py-2 px-3"
                >
                  {LIGHTING_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Camera Angle */}
              <div>
                <label className="text-xs font-medium t-secondary mb-2 block">
                  <Camera className="w-3.5 h-3.5 inline mr-1.5" />
                  Camera Angle
                </label>
                <select
                  value={camera}
                  onChange={(e) => setCamera(e.target.value)}
                  className="input-base w-full rounded-lg text-sm py-2 px-3"
                >
                  {CAMERA_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warmth Slider */}
              <div>
                <label className="text-xs font-medium t-secondary mb-2 block">
                  <Thermometer className="w-3.5 h-3.5 inline mr-1.5" />
                  Warmth
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] t-faint">Cool</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={warmth}
                    onChange={(e) => setWarmth(Number(e.target.value))}
                    className="flex-1 accent-purple-500"
                  />
                  <span className="text-[10px] t-faint">Warm</span>
                </div>
              </div>

              {/* Intensity Slider */}
              <div>
                <label className="text-xs font-medium t-secondary mb-2 block">
                  <Zap className="w-3.5 h-3.5 inline mr-1.5" />
                  Intensity
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] t-faint">Subtle</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="flex-1 accent-purple-500"
                  />
                  <span className="text-[10px] t-faint">Dramatic</span>
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="text-xs font-medium t-secondary mb-2 block">
                  Custom Instructions
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add specific details for your scene..."
                  rows={3}
                  className="input-base w-full rounded-lg text-sm py-2 px-3 resize-none"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedScene}
                className="btn-gradient w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Clapperboard className="w-4 h-4" />
                    Generate Scene
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
