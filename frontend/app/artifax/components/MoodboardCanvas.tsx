"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Layout,
  Type,
  Trash2,
  BringToFront,
  SendToBack,
  Loader2,
  Sparkles,
  Upload,
  ImageIcon,
  Plus,
  Download,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import api from "@/lib/api";
import { useArtifaxStore, CanvasItem } from "@/store/artifaxStore";

// Dynamic import of the Konva stage (no SSR — Konva needs browser)
const MoodboardStage = dynamic(() => import("./MoodboardStage"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function MoodboardCanvas() {
  const {
    project,
    setMoodboardItems,
    addMoodboardGeneratedImage,
    addInspirationImage,
  } = useArtifaxStore();

  const items = project.moodboard.items;
  const generatedImages = project.moodboard.generatedImages;
  const allImages = [...project.research.savedImages, ...generatedImages];

  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [addingText, setAddingText] = useState(false);

  // AI concept generation
  const [conceptInput, setConceptInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  // AI moodboard generation
  const [moodTheme, setMoodTheme] = useState("");
  const [moodMood, setMoodMood] = useState("");
  const [moodColor, setMoodColor] = useState("");
  const [moodGenerating, setMoodGenerating] = useState(false);
  const [moodError, setMoodError] = useState("");

  // Measure canvas container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: width || 800, height: height || 600 });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Keyboard: Delete selected item
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        setMoodboardItems(items.filter((i) => i.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, items, setMoodboardItems]);

  // Drop image file onto the upload zone
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    noClick: false,
    onDrop: async (files) => {
      for (const file of files) {
        const formData = new FormData();
        formData.append("image", file);
        try {
          const res = await api.post("/api/artifax/research/upload-inspiration", formData);
          addInspirationImage(res.data.url);
        } catch {}
      }
    },
  });

  // Add image from library to canvas
  const addImageToCanvas = (url: string) => {
    const newItem: CanvasItem = {
      id: `img-${Date.now()}`,
      type: "image",
      x: 40 + Math.random() * 200,
      y: 40 + Math.random() * 150,
      width: 200,
      height: 200,
      url,
      rotation: 0,
    };
    setMoodboardItems([...items, newItem]);
  };

  // Add text to canvas
  const handleAddText = () => {
    if (!textInput.trim()) return;
    const newItem: CanvasItem = {
      id: `text-${Date.now()}`,
      type: "text",
      x: 100 + Math.random() * 200,
      y: 80 + Math.random() * 100,
      width: 200,
      height: 40,
      text: textInput,
      fontSize: 22,
      fill: "#ffffff",
      rotation: 0,
    };
    setMoodboardItems([...items, newItem]);
    setTextInput("");
    setAddingText(false);
  };

  // Delete selected
  const deleteSelected = () => {
    if (!selectedId) return;
    setMoodboardItems(items.filter((i) => i.id !== selectedId));
    setSelectedId(null);
  };

  // Bring to front / send to back
  const bringToFront = () => {
    if (!selectedId) return;
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;
    setMoodboardItems([...items.filter((i) => i.id !== selectedId), item]);
  };

  const sendToBack = () => {
    if (!selectedId) return;
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;
    setMoodboardItems([item, ...items.filter((i) => i.id !== selectedId)]);
  };

  // AI moodboard image generation
  const handleGenerateMoodboard = async () => {
    const canvasImgCount = items.filter((i) => i.type === "image").length;
    if (canvasImgCount === 0 && !moodTheme.trim()) {
      setMoodError("Add images to the canvas or enter a theme to generate.");
      return;
    }
    setMoodError("");
    setMoodGenerating(true);
    // Collect URLs from image items currently on the canvas
    const canvasImageUrls = items
      .filter((item) => item.type === "image" && item.url)
      .map((item) => item.url as string);
    try {
      const res = await api.post("/api/artifax/moodboard/generate", {
        theme: moodTheme,
        mood: moodMood,
        color_story: moodColor,
        count: 2,
        image_urls: canvasImageUrls,
      });
      for (const url of res.data.images as string[]) {
        addMoodboardGeneratedImage(url);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setMoodError(e.response?.data?.detail || "Generation failed.");
    } finally {
      setMoodGenerating(false);
    }
  };

  // AI concept image generation
  const handleGenerateConcept = async () => {
    if (!conceptInput.trim()) return;
    setGenError("");
    setGenerating(true);
    try {
      const res = await api.post("/api/artifax/concept/generate", {
        concept_description: conceptInput,
        count: 2,
      });
      for (const url of res.data.images as string[]) {
        addMoodboardGeneratedImage(url);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setGenError(e.response?.data?.detail || "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex w-full overflow-hidden" style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* Left: Image library */}
      <div className="w-64 flex-shrink-0 border-r border-white/5 flex flex-col">
        <div className="p-3 border-b border-white/5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Image Library
          </h3>
          {/* Upload drop zone */}
          <div
            {...getRootProps()}
            className="border border-dashed border-white/10 hover:border-purple-500/30 rounded-xl p-3 text-center cursor-pointer transition-all"
          >
            <input {...getInputProps()} />
            <Upload className="w-4 h-4 mx-auto text-gray-600 mb-1" />
            <p className="text-[10px] text-gray-600">Drop or click to upload</p>
          </div>
        </div>

        {/* Library grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {allImages.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-[11px] text-gray-600">
                Upload images or generate AI concepts
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {allImages.map((url, i) => (
                <motion.button
                  key={i}
                  onClick={() => addImageToCanvas(url)}
                  whileHover={{ scale: 1.03 }}
                  className="aspect-square rounded-lg overflow-hidden bg-white/3 border border-white/5 hover:border-purple-500/30 transition-all"
                  title="Click to add to canvas"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Canvas */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Canvas toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/2">
          <button
            onClick={() => setAddingText(!addingText)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
              addingText
                ? "bg-purple-600/20 border border-purple-500/30 text-purple-300"
                : "bg-white/5 border border-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Add Text
          </button>

          {selectedId && (
            <>
              <button
                onClick={bringToFront}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-all"
              >
                <BringToFront className="w-3.5 h-3.5" />
                Front
              </button>
              <button
                onClick={sendToBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-all"
              >
                <SendToBack className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                onClick={deleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}

          {addingText && (
            <div className="flex items-center gap-2 ml-2">
              <input
                autoFocus
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddText()}
                placeholder="Enter text and press Enter..."
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500/50 w-52"
              />
              <button onClick={handleAddText} className="px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-lg text-xs text-purple-300 hover:bg-purple-600/30 transition-all">
                Add
              </button>
            </div>
          )}

          <div className="ml-auto text-xs text-gray-600">
            {items.length} item{items.length !== 1 ? "s" : ""} on canvas
            {selectedId && " · 1 selected · Del to remove"}
          </div>
        </div>

        {/* The Konva canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden bg-surface-2"
        >
          <MoodboardStage
            items={items}
            onItemsChange={setMoodboardItems}
            width={canvasSize.width}
            height={canvasSize.height}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>

      {/* Right: AI Generation panel */}
      <div className="w-72 flex-shrink-0 border-l border-white/5 flex flex-col overflow-y-auto">
        {/* Moodboard AI */}
        <div className="p-4 border-b border-white/5">
          <h3 className="text-xs font-semibold text-pink-400 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5" />
            Moodboard AI
          </h3>
          <p className="text-[11px] text-gray-600 mt-1">
            Generates new images coherent with what&apos;s already on your canvas
          </p>
        </div>

        <div className="p-4 border-b border-white/5 space-y-3">
          {/* Canvas image count indicator */}
          {(() => {
            const canvasImgCount = items.filter((i) => i.type === "image").length;
            return canvasImgCount > 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                <ImageIcon className="w-3 h-3 text-pink-400 flex-shrink-0" />
                <p className="text-[11px] text-pink-300">
                  {canvasImgCount} canvas image{canvasImgCount !== 1 ? "s" : ""} will drive the generation
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/5">
                <ImageIcon className="w-3 h-3 text-gray-600 flex-shrink-0" />
                <p className="text-[11px] text-gray-600">
                  Add images to the canvas first, or describe a theme below
                </p>
              </div>
            );
          })()}

          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">Theme <span className="text-gray-700">(optional)</span></label>
            <input
              value={moodTheme}
              onChange={(e) => setMoodTheme(e.target.value)}
              className="input-base text-sm w-full"
              placeholder="e.g. Coastal minimalism, Desert dusk…"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">Mood <span className="text-gray-700">(optional)</span></label>
            <input
              value={moodMood}
              onChange={(e) => setMoodMood(e.target.value)}
              className="input-base text-sm w-full"
              placeholder="e.g. Serene, Dramatic, Nostalgic…"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">Color Story <span className="text-gray-700">(optional)</span></label>
            <input
              value={moodColor}
              onChange={(e) => setMoodColor(e.target.value)}
              className="input-base text-sm w-full"
              placeholder="e.g. Dusty terracotta &amp; sage green…"
            />
          </div>
          {moodError && (
            <p className="text-xs text-red-400">{moodError}</p>
          )}
          <button
            onClick={handleGenerateMoodboard}
            disabled={moodGenerating}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm rounded-xl font-semibold bg-gradient-to-r from-pink-600 to-purple-600 text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {moodGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                Generate from Canvas
              </>
            )}
          </button>
          {moodGenerating && (
            <p className="text-[10px] text-gray-600 text-center">
              Analysing your board and generating…
            </p>
          )}
        </div>

        {/* Concept Generator */}
        <div className="p-4 border-b border-white/5">
          <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Concept Generator
          </h3>
          <p className="text-[11px] text-gray-600 mt-1">
            Describe your concept and generate product visuals
          </p>
        </div>

        <div className="p-4 border-b border-white/5">
          <textarea
            value={conceptInput}
            onChange={(e) => setConceptInput(e.target.value)}
            rows={4}
            className="input-base text-sm resize-none"
            placeholder="e.g. Luxury pastel kurta with modern silhouette and hand-embroidered detailing..."
          />
          {genError && (
            <p className="text-xs text-red-400 mt-2">{genError}</p>
          )}
          <button
            onClick={handleGenerateConcept}
            disabled={generating || !conceptInput.trim()}
            className="btn-gradient w-full flex items-center justify-center gap-2 py-2.5 text-sm mt-3"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate (×2 variations)
              </>
            )}
          </button>
          {generating && (
            <p className="text-[10px] text-gray-600 text-center mt-2">
              Nano Banana is creating your concept images…
            </p>
          )}
        </div>

        {/* Generated images in right panel */}
        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="text-[11px] text-gray-600 uppercase tracking-wider mb-3">
            Generated Images
          </h4>
          {generatedImages.length === 0 ? (
            <div className="text-center py-8">
              <Layout className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-[11px] text-gray-600">
                Generated images appear here — click to add to canvas
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {generatedImages.map((url, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative group"
                >
                  <img
                    src={url}
                    alt={`Concept ${i + 1}`}
                    className="w-full rounded-xl border border-white/5 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => addImageToCanvas(url)}
                      className="px-3 py-1.5 bg-purple-600/80 rounded-lg text-[11px] text-white font-medium hover:bg-purple-600 transition-colors"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Add to Canvas
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
