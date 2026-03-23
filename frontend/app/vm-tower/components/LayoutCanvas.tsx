"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Loader2,
  Check,
  X,
  Image as ImageIcon,
  Sparkles,
  Grid3X3,
  Shirt,
  SquareStack,
  Focus,
  Plus,
  Package,
  Trash2,
  Upload,
  ImagePlus,
  GalleryHorizontalEnd,
  Box,
  Wand2,
  PenLine,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "@/lib/api";
import { useVMTowerStore, Product } from "@/store/vmTowerStore";

const LAYOUT_TYPE_ICONS: Record<string, typeof Layers> = {
  wall_story: Grid3X3,
  fixture: SquareStack,
  mannequin: Shirt,
  focal_display: Focus,
};

const LAYOUT_TYPE_COLORS: Record<string, string> = {
  wall_story: "from-blue-600 to-blue-800",
  fixture: "from-emerald-600 to-emerald-800",
  mannequin: "from-purple-600 to-purple-800",
  focal_display: "from-amber-600 to-amber-800",
};

type ImageUploadMode = "single" | "range";

interface RangeImage {
  image_url: string;
  label: string;
}

export default function LayoutCanvas() {
  const {
    activeIntentId,
    layouts,
    setLayouts,
    updateLayout,
    products,
    setProducts,
    addProducts,
    setActivePanel,
    intents,
    updateIntent,
  } = useVMTowerStore();

  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [genMockupId, setGenMockupId] = useState<number | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    category: "",
    color: "",
    fabric: "",
  });

  // Image upload state
  const [imageUploadMode, setImageUploadMode] = useState<ImageUploadMode>("single");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedProductForImage, setSelectedProductForImage] = useState<number | null>(null);
  const [rangeImages, setRangeImages] = useState<RangeImage[]>([]);
  const [rangeLabel, setRangeLabel] = useState("full_range");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rangeFileInputRef = useRef<HTMLInputElement>(null);
  const fixtureFileInputRef = useRef<HTMLInputElement>(null);

  // Fixture state
  const [showFixtures, setShowFixtures] = useState(false);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [creatingFixture, setCreatingFixture] = useState(false);
  const [fixtureForm, setFixtureForm] = useState({
    name: "",
    fixture_type: "wall_unit",
    num_positions: 3,
    position_labels: "",
    hidden_prompt: "",
    dimensions: "",
  });
  const [fixtureImageFile, setFixtureImageFile] = useState<File | null>(null);

  // Prompt Studio state (per layout)
  const [promptLayoutId, setPromptLayoutId] = useState<number | null>(null);
  const [promptText, setPromptText] = useState("");
  const [promptFixtureId, setPromptFixtureId] = useState<number | null>(null);
  const [promptDesignerInstructions, setPromptDesignerInstructions] = useState("");
  const [promptSelectedProducts, setPromptSelectedProducts] = useState<number[]>([]);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refiningPrompt, setRefiningPrompt] = useState(false);

  const activeIntent = intents.find((i) => i.id === activeIntentId);

  const fetchLayouts = async () => {
    if (!activeIntentId) return;
    try {
      const res = await api.get(`/api/vm-tower/intents/${activeIntentId}/layouts`);
      setLayouts(res.data);
    } catch {}
  };

  const fetchProducts = async () => {
    if (!activeIntentId) return;
    try {
      const res = await api.get(`/api/vm-tower/intents/${activeIntentId}/products`);
      setProducts(res.data);
    } catch {}
  };

  const fetchRangeImages = async () => {
    if (!activeIntentId) return;
    try {
      const res = await api.get(`/api/vm-tower/intents/${activeIntentId}/range-images`);
      setRangeImages(res.data);
    } catch {}
  };

  const handleGenerateLayouts = async () => {
    if (!activeIntentId) return;
    setGenerating(true);
    try {
      const res = await api.post("/api/vm-tower/layouts/generate", {
        intent_id: activeIntentId,
      });
      setLayouts(res.data);
      if (activeIntent) {
        updateIntent({ ...activeIntent, status: "ai_layout_suggested" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveAll = async () => {
    if (!activeIntentId || layouts.length === 0) return;
    setApproving(true);
    try {
      const res = await api.post(
        `/api/vm-tower/intents/${activeIntentId}/layouts/approve`,
        { layout_ids: layouts.map((l) => l.id) }
      );
      setLayouts(res.data);
      if (activeIntent) {
        updateIntent({ ...activeIntent, status: "designer_approved" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApproving(false);
    }
  };

  const handleGenerateMockup = async (layoutId: number) => {
    setGenMockupId(layoutId);
    try {
      const res = await api.post("/api/vm-tower/mockup/generate", {
        layout_id: layoutId,
      });
      updateLayout(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setGenMockupId(null);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIntentId || !productForm.sku || !productForm.name) return;
    try {
      const res = await api.post(
        `/api/vm-tower/intents/${activeIntentId}/products`,
        productForm
      );
      addProducts([res.data]);
      setProductForm({ sku: "", name: "", category: "", color: "", fabric: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!activeIntentId) return;
    try {
      await api.delete(
        `/api/vm-tower/intents/${activeIntentId}/products/${productId}`
      );
      setProducts(products.filter((p) => p.id !== productId));
    } catch (err) {
      console.error(err);
    }
  };

  // Upload single product image
  const handleSingleImageUpload = async (file: File, productId: number) => {
    if (!activeIntentId) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post(
        `/api/vm-tower/intents/${activeIntentId}/products/${productId}/upload-image`,
        formData
      );
      // Update product in local state
      setProducts(products.map((p) => (p.id === productId ? res.data : p)));
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
      setSelectedProductForImage(null);
    }
  };

  // Upload range/combo image
  const handleRangeImageUpload = async (file: File) => {
    if (!activeIntentId) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("label", rangeLabel);
      const res = await api.post(
        `/api/vm-tower/intents/${activeIntentId}/range-image`,
        formData
      );
      setRangeImages([...rangeImages, res.data]);
      setRangeLabel("full_range");
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  // Fixture handlers
  const fetchFixtures = async () => {
    try {
      const res = await api.get("/api/vm-tower/fixtures");
      setFixtures(res.data);
    } catch {}
  };

  const handleCreateFixture = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingFixture(true);
    try {
      const formData = new FormData();
      formData.append("name", fixtureForm.name);
      formData.append("fixture_type", fixtureForm.fixture_type);
      formData.append("num_positions", String(fixtureForm.num_positions));
      formData.append("position_labels", fixtureForm.position_labels);
      formData.append("hidden_prompt", fixtureForm.hidden_prompt);
      formData.append("dimensions", fixtureForm.dimensions);
      if (fixtureImageFile) formData.append("image", fixtureImageFile);

      const res = await api.post("/api/vm-tower/fixtures", formData);
      setFixtures([res.data, ...fixtures]);
      setFixtureForm({ name: "", fixture_type: "wall_unit", num_positions: 3, position_labels: "", hidden_prompt: "", dimensions: "" });
      setFixtureImageFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingFixture(false);
    }
  };

  const handleDeleteFixture = async (id: number) => {
    try {
      await api.delete(`/api/vm-tower/fixtures/${id}`);
      setFixtures(fixtures.filter((f) => f.id !== id));
    } catch {}
  };

  // Prompt Studio handlers
  const handleGeneratePrompt = async (layoutId: number) => {
    setGeneratingPrompt(true);
    try {
      const res = await api.post("/api/vm-tower/prompt/generate", {
        layout_id: layoutId,
        intent_id: activeIntentId,
        fixture_id: promptFixtureId,
        designer_instructions: promptDesignerInstructions,
        product_ids: promptSelectedProducts.length > 0 ? promptSelectedProducts : undefined,
      });
      setPromptText(res.data.prompt);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingPrompt(false);
    }
  };

  const handleRefinePrompt = async () => {
    if (!refineInstruction.trim() || !promptText.trim()) return;
    setRefiningPrompt(true);
    try {
      const res = await api.post("/api/vm-tower/prompt/refine", {
        current_prompt: promptText,
        refinement_instruction: refineInstruction,
        intent_id: activeIntentId,
      });
      setPromptText(res.data.prompt);
      setRefineInstruction("");
    } catch (err) {
      console.error(err);
    } finally {
      setRefiningPrompt(false);
    }
  };

  const handleGenerateMockupWithOptions = async (layoutId: number) => {
    setGenMockupId(layoutId);
    try {
      const res = await api.post("/api/vm-tower/mockup/generate", {
        layout_id: layoutId,
        custom_prompt: promptText || undefined,
        fixture_id: promptFixtureId || undefined,
        garment_product_ids: promptSelectedProducts.length > 0 ? promptSelectedProducts : undefined,
        designer_instructions: promptDesignerInstructions || undefined,
      });
      updateLayout(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setGenMockupId(null);
    }
  };

  if (!activeIntentId) {
    return (
      <div className="text-center py-16">
        <Layers className="w-12 h-12 t-disabled mx-auto mb-4" />
        <h3 className="text-lg font-semibold t-secondary mb-2">
          No Design Intent Selected
        </h3>
        <p className="text-sm t-muted mb-4">
          Select or create a design intent first
        </p>
        <button
          onClick={() => setActivePanel("design-intent")}
          className="btn-gradient px-6 py-2.5 text-sm"
        >
          Go to Design Intent
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold t-heading flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Layout Canvas
          </h2>
          <p className="text-sm t-muted mt-1">
            {activeIntent?.theme} — AI-generated merchandising layouts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { fetchProducts(); fetchRangeImages(); }}
            className="btn-secondary px-3 py-2 text-xs"
          >
            Refresh
          </button>
          <button
            onClick={() => { setShowFixtures(!showFixtures); if (!showFixtures) fetchFixtures(); }}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors flex items-center gap-2 ${
              showFixtures
                ? "bg-[var(--accent-purple-bg)] border-[var(--accent-purple-border)] text-purple-500"
                : "btn-secondary"
            }`}
          >
            <Box className="w-4 h-4" />
            Fixtures
          </button>
          <button
            onClick={() => { setShowImageUpload(!showImageUpload); if (!showImageUpload) fetchRangeImages(); }}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors flex items-center gap-2 ${
              showImageUpload
                ? "bg-[var(--accent-purple-bg)] border-[var(--accent-purple-border)] text-purple-500"
                : "btn-secondary"
            }`}
          >
            <ImagePlus className="w-4 h-4" />
            Upload Images
          </button>
          <button
            onClick={() => setShowProductForm(!showProductForm)}
            className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Add Products
          </button>
          <button
            onClick={handleGenerateLayouts}
            disabled={generating}
            className="btn-gradient px-4 py-2 text-sm flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Layouts
              </>
            )}
          </button>
        </div>
      </div>

      {/* Image Upload Section */}
      <AnimatePresence>
        {showImageUpload && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold t-heading flex items-center gap-2">
                  <ImagePlus className="w-4 h-4 text-purple-500" />
                  Product Image Upload
                </h3>
                {/* Mode Toggle */}
                <div className="flex rounded-xl overflow-hidden border border-[var(--border-color)]">
                  <button
                    onClick={() => setImageUploadMode("single")}
                    className={`px-4 py-2 text-xs font-medium flex items-center gap-1.5 transition-all ${
                      imageUploadMode === "single"
                        ? "bg-[var(--accent-purple-bg)] text-purple-500"
                        : "bg-[var(--bg-wash)] t-muted hover:t-secondary"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Single Product
                  </button>
                  <button
                    onClick={() => setImageUploadMode("range")}
                    className={`px-4 py-2 text-xs font-medium flex items-center gap-1.5 transition-all ${
                      imageUploadMode === "range"
                        ? "bg-[var(--accent-purple-bg)] text-purple-500"
                        : "bg-[var(--bg-wash)] t-muted hover:t-secondary"
                    }`}
                  >
                    <GalleryHorizontalEnd className="w-3.5 h-3.5" />
                    Range / Combo
                  </button>
                </div>
              </div>

              {/* Single Product Image Upload */}
              {imageUploadMode === "single" && (
                <div>
                  <p className="text-xs t-muted mb-3">
                    Upload individual product images. Select a product below and attach its image.
                  </p>
                  {products.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-[var(--border-color)] rounded-xl">
                      <Package className="w-8 h-8 t-disabled mx-auto mb-2" />
                      <p className="text-xs t-muted">Add products first to upload their images</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {products.map((p) => (
                        <div
                          key={p.id}
                          className={`relative rounded-xl border overflow-hidden transition-all cursor-pointer group ${
                            selectedProductForImage === p.id
                              ? "border-purple-500 ring-2 ring-purple-500/20"
                              : "border-[var(--border-color)] hover:border-[var(--border-hover)]"
                          }`}
                        >
                          {/* Product Image or Placeholder */}
                          <div
                            className="aspect-square bg-[var(--bg-surface-2)] flex items-center justify-center relative"
                            onClick={() => {
                              setSelectedProductForImage(p.id);
                              fileInputRef.current?.click();
                            }}
                          >
                            {p.image_url ? (
                              <img
                                src={
                                  p.image_url.startsWith("http")
                                    ? p.image_url
                                    : `http://localhost:8000${p.image_url}`
                                }
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center p-2">
                                <Upload className="w-6 h-6 t-disabled mx-auto mb-1" />
                                <span className="text-[10px] t-muted">Click to upload</span>
                              </div>
                            )}
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-[10px] font-medium bg-purple-600 px-2 py-1 rounded-lg">
                                {p.image_url ? "Replace" : "Upload"}
                              </span>
                            </div>
                            {uploadingImage && selectedProductForImage === p.id && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                              </div>
                            )}
                          </div>
                          {/* Product Info */}
                          <div className="p-2 bg-[var(--card-bg)]">
                            <p className="text-[11px] font-medium t-primary truncate">{p.name}</p>
                            <p className="text-[10px] t-muted truncate">{p.sku} · {p.color || "—"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && selectedProductForImage) {
                        handleSingleImageUpload(file, selectedProductForImage);
                      }
                      e.target.value = "";
                    }}
                  />
                </div>
              )}

              {/* Range / Combo Image Upload */}
              {imageUploadMode === "range" && (
                <div>
                  <p className="text-xs t-muted mb-3">
                    Upload full range images showing multiple products together as a combination or styled look.
                  </p>

                  {/* Upload Zone */}
                  <div className="flex gap-3 mb-4">
                    <select
                      value={rangeLabel}
                      onChange={(e) => setRangeLabel(e.target.value)}
                      className="input-base w-48"
                    >
                      <option value="full_range">Full Range</option>
                      <option value="combo_look">Combo / Styled Look</option>
                      <option value="wall_story">Wall Story</option>
                      <option value="mannequin_look">Mannequin Look</option>
                      <option value="fixture_layout">Fixture Layout</option>
                      <option value="store_display">Store Display</option>
                      <option value="inspiration">Inspiration</option>
                    </select>
                    <button
                      onClick={() => rangeFileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="btn-gradient px-4 py-2 text-sm flex items-center gap-2"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload Range Image
                    </button>
                  </div>

                  <input
                    ref={rangeFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleRangeImageUpload(file);
                      e.target.value = "";
                    }}
                  />

                  {/* Range Images Grid */}
                  {rangeImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {rangeImages.map((img, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="rounded-xl border border-[var(--border-color)] overflow-hidden group"
                        >
                          <div className="aspect-[4/3] bg-[var(--bg-surface-2)]">
                            <img
                              src={
                                img.image_url.startsWith("http")
                                  ? img.image_url
                                  : `http://localhost:8000${img.image_url}`
                              }
                              alt={img.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-2 bg-[var(--card-bg)]">
                            <span className="text-[10px] font-medium t-secondary capitalize">
                              {img.label.replace("_", " ")}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-[var(--border-color)] rounded-xl">
                      <GalleryHorizontalEnd className="w-8 h-8 t-disabled mx-auto mb-2" />
                      <p className="text-xs t-muted">
                        No range images uploaded yet
                      </p>
                      <p className="text-[10px] t-faint mt-1">
                        Upload full range photos, styled combos, or store display images
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixtures Panel */}
      <AnimatePresence>
        {showFixtures && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-5">
              <h3 className="text-sm font-semibold t-heading mb-4 flex items-center gap-2">
                <Box className="w-4 h-4 text-orange-500" />
                Fixture Library
              </h3>

              {/* Create Fixture Form */}
              <form onSubmit={handleCreateFixture} className="space-y-3 mb-4 p-4 bg-[var(--bg-wash)] rounded-xl border border-[var(--border-color)]">
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={fixtureForm.name}
                    onChange={(e) => setFixtureForm({ ...fixtureForm, name: e.target.value })}
                    className="input-base"
                    placeholder="Fixture name"
                    required
                  />
                  <select
                    value={fixtureForm.fixture_type}
                    onChange={(e) => setFixtureForm({ ...fixtureForm, fixture_type: e.target.value })}
                    className="input-base"
                  >
                    <option value="wall_unit">Wall Unit</option>
                    <option value="table">Table / Nesting</option>
                    <option value="mannequin_platform">Mannequin Platform</option>
                    <option value="gondola">Gondola</option>
                    <option value="window">Window Display</option>
                    <option value="shelf">Shelf Unit</option>
                    <option value="hanging_rack">Hanging Rack</option>
                    <option value="custom">Custom</option>
                  </select>
                  <input
                    type="text"
                    value={fixtureForm.dimensions}
                    onChange={(e) => setFixtureForm({ ...fixtureForm, dimensions: e.target.value })}
                    className="input-base"
                    placeholder="Dimensions (e.g. 120cm × 200cm)"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] t-muted uppercase mb-1 block">Positions</label>
                    <input
                      type="number"
                      value={fixtureForm.num_positions}
                      onChange={(e) => setFixtureForm({ ...fixtureForm, num_positions: Number(e.target.value) })}
                      className="input-base"
                      min={1}
                      max={20}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] t-muted uppercase mb-1 block">Position Labels (comma-separated)</label>
                    <input
                      type="text"
                      value={fixtureForm.position_labels}
                      onChange={(e) => setFixtureForm({ ...fixtureForm, position_labels: e.target.value })}
                      className="input-base"
                      placeholder="e.g. top_shelf, eye_level, mid_shelf, bottom"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] t-muted uppercase mb-1 block">Fixture Display Instructions (hidden prompt)</label>
                  <textarea
                    value={fixtureForm.hidden_prompt}
                    onChange={(e) => setFixtureForm({ ...fixtureForm, hidden_prompt: e.target.value })}
                    className="input-base text-xs resize-none"
                    rows={2}
                    placeholder="e.g. Products should be folded neatly with collar visible. Use wooden hangers for tops. Shoes placed at 45-degree angle..."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fixtureFileInputRef.current?.click()}
                    className="btn-secondary px-3 py-2 text-xs flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {fixtureImageFile ? fixtureImageFile.name : "Upload Fixture Image"}
                  </button>
                  <input
                    ref={fixtureFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { setFixtureImageFile(e.target.files?.[0] || null); }}
                  />
                  <button
                    type="submit"
                    disabled={creatingFixture || !fixtureForm.name}
                    className="btn-gradient px-4 py-2 text-xs flex items-center gap-1.5 ml-auto"
                  >
                    {creatingFixture ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add Fixture
                  </button>
                </div>
              </form>

              {/* Fixture Library Grid */}
              {fixtures.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {fixtures.map((f) => (
                    <div
                      key={f.id}
                      className={`rounded-xl border overflow-hidden group transition-all cursor-pointer ${
                        promptFixtureId === f.id
                          ? "border-orange-500 ring-2 ring-orange-500/20"
                          : "border-[var(--border-color)] hover:border-[var(--border-hover)]"
                      }`}
                      onClick={() => setPromptFixtureId(promptFixtureId === f.id ? null : f.id)}
                    >
                      <div className="aspect-[4/3] bg-[var(--bg-surface-2)] relative">
                        {f.image_url ? (
                          <img
                            src={f.image_url.startsWith("http") ? f.image_url : `http://localhost:8000${f.image_url}`}
                            alt={f.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Box className="w-8 h-8 t-disabled" />
                          </div>
                        )}
                        {promptFixtureId === f.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteFixture(f.id); }}
                          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                      <div className="p-2 bg-[var(--card-bg)]">
                        <p className="text-[11px] font-medium t-primary truncate">{f.name}</p>
                        <p className="text-[10px] t-muted">{f.fixture_type.replace("_", " ")} · {f.num_positions} slots</p>
                        {f.dimensions && <p className="text-[10px] t-faint">{f.dimensions}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-[var(--border-color)] rounded-xl">
                  <Box className="w-8 h-8 t-disabled mx-auto mb-2" />
                  <p className="text-xs t-muted">No fixtures yet. Add your first fixture above.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Range Section */}
      <AnimatePresence>
        {showProductForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-4">
              <h3 className="text-sm font-semibold t-heading mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Product Range ({products.length} products)
              </h3>

              <form onSubmit={handleAddProduct} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={productForm.sku}
                  onChange={(e) =>
                    setProductForm({ ...productForm, sku: e.target.value })
                  }
                  className="input-base w-24"
                  placeholder="SKU"
                  required
                />
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  className="input-base flex-1"
                  placeholder="Product Name"
                  required
                />
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) =>
                    setProductForm({ ...productForm, category: e.target.value })
                  }
                  className="input-base w-28"
                  placeholder="Category"
                />
                <input
                  type="text"
                  value={productForm.color}
                  onChange={(e) =>
                    setProductForm({ ...productForm, color: e.target.value })
                  }
                  className="input-base w-24"
                  placeholder="Color"
                />
                <input
                  type="text"
                  value={productForm.fabric}
                  onChange={(e) =>
                    setProductForm({ ...productForm, fabric: e.target.value })
                  }
                  className="input-base w-24"
                  placeholder="Fabric"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-600/30"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {products.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 text-xs t-secondary py-1.5 px-2 rounded-lg hover:bg-[var(--hover-bg)] group"
                    >
                      {/* Thumbnail */}
                      {p.image_url && (
                        <img
                          src={
                            p.image_url.startsWith("http")
                              ? p.image_url
                              : `http://localhost:8000${p.image_url}`
                          }
                          alt=""
                          className="w-6 h-6 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <span className="t-muted w-16 truncate">{p.sku}</span>
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className="t-muted">{p.category}</span>
                      <span className="t-muted">{p.color}</span>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="opacity-0 group-hover:opacity-100 t-muted hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layouts Grid */}
      {layouts.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm t-secondary">
              {layouts.length} layout suggestions
            </span>
            {layouts.some((l) => l.is_approved === 0) && (
              <button
                onClick={handleApproveAll}
                disabled={approving}
                className="px-4 py-2 text-sm rounded-lg bg-green-600/20 border border-green-500/30 text-green-500 hover:bg-green-600/30 transition-colors flex items-center gap-2"
              >
                {approving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Approve All Layouts
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {layouts.map((layout) => {
              const Icon =
                LAYOUT_TYPE_ICONS[layout.layout_type] || Layers;
              const gradient =
                LAYOUT_TYPE_COLORS[layout.layout_type] || "from-gray-600 to-gray-800";

              return (
                <motion.div
                  key={layout.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`card overflow-hidden ${
                    layout.is_approved
                      ? "ring-1 ring-green-500/30 border-green-500/20"
                      : ""
                  }`}
                >
                  {/* Layout Header */}
                  <div
                    className={`bg-gradient-to-r ${gradient} p-4 flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {layout.name}
                        </h3>
                        <p className="text-xs text-white/60 capitalize">
                          {layout.layout_type.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    {layout.is_approved ? (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[10px] border border-green-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Approved
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px]">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-3">
                    {layout.reasoning && (
                      <div className="p-3 bg-[var(--bg-wash)] border border-[var(--border-color)] rounded-lg">
                        <p className="text-xs t-secondary leading-relaxed">
                          {layout.reasoning}
                        </p>
                      </div>
                    )}

                    {layout.placement_plan && (
                      <div>
                        <label className="text-[10px] font-medium t-muted uppercase tracking-wider">
                          Placement Plan
                        </label>
                        <div className="mt-1 grid grid-cols-2 gap-1.5">
                          {Object.entries(layout.placement_plan).map(
                            ([key, val]) => (
                              <div
                                key={key}
                                className="text-[11px] px-2 py-1 rounded bg-[var(--bg-wash)] border border-[var(--border-color)]"
                              >
                                <span className="t-muted capitalize">
                                  {key.replace("_", " ")}:
                                </span>{" "}
                                <span className="t-secondary">
                                  {typeof val === "string"
                                    ? val
                                    : JSON.stringify(val)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {layout.product_grouping &&
                      layout.product_grouping.length > 0 && (
                        <div>
                          <label className="text-[10px] font-medium t-muted uppercase tracking-wider">
                            Product Groups
                          </label>
                          <div className="mt-1 space-y-1.5">
                            {layout.product_grouping.map(
                              (group: any, i: number) => (
                                <div
                                  key={i}
                                  className="text-[11px] px-2 py-1.5 rounded bg-[var(--bg-wash)] border border-[var(--border-color)]"
                                >
                                  <div className="t-secondary">
                                    {group.zone || group.layer || group.look || group.position
                                      ? `${group.zone || group.layer || `Look ${group.look}` || group.position}`
                                      : `Group ${i + 1}`}
                                  </div>
                                  {group.products && (
                                    <div className="t-muted mt-0.5">
                                      {Array.isArray(group.products)
                                        ? group.products.join(", ")
                                        : group.products}
                                    </div>
                                  )}
                                  {group.reason && (
                                    <div className="t-faint mt-0.5 italic">
                                      {group.reason}
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {layout.mockup_image_url && (
                      <div className="rounded-lg overflow-hidden border border-[var(--border-color)]">
                        <img
                          src={
                            layout.mockup_image_url.startsWith("http")
                              ? layout.mockup_image_url
                              : `http://localhost:8000${layout.mockup_image_url}`
                          }
                          alt={layout.name}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    )}

                    {/* Prompt Studio Toggle */}
                    <div className="border-t border-[var(--border-color)] pt-3 space-y-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (promptLayoutId === layout.id) {
                              setPromptLayoutId(null);
                            } else {
                              setPromptLayoutId(layout.id);
                              setPromptText(layout.mockup_prompt || "");
                            }
                          }}
                          className="flex-1 px-3 py-2 text-xs rounded-lg bg-[var(--bg-wash-2)] border border-[var(--border-color)] t-secondary hover:bg-[var(--hover-bg)] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <PenLine className="w-3 h-3" />
                          Prompt Studio
                          {promptLayoutId === layout.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleGenerateMockupWithOptions(layout.id)}
                          disabled={genMockupId === layout.id}
                          className="flex-1 px-3 py-2 text-xs rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-500 hover:bg-purple-600/30 transition-colors flex items-center justify-center gap-1.5"
                        >
                          {genMockupId === layout.id ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                          ) : (
                            <><ImageIcon className="w-3 h-3" /> Generate Mockup</>
                          )}
                        </button>
                      </div>

                      {/* Expanded Prompt Studio */}
                      <AnimatePresence>
                        {promptLayoutId === layout.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-3"
                          >
                            {/* Designer Instructions */}
                            <div>
                              <label className="text-[10px] font-medium t-muted uppercase tracking-wider flex items-center gap-1 mb-1">
                                <Wand2 className="w-3 h-3" /> Designer Instructions
                              </label>
                              <textarea
                                value={promptDesignerInstructions}
                                onChange={(e) => setPromptDesignerInstructions(e.target.value)}
                                className="input-base text-xs resize-none"
                                rows={2}
                                placeholder="e.g. Place the linen shirts on top shelf with collar facing out. Layer the trousers folded at bottom. Add a straw hat as prop..."
                              />
                            </div>

                            {/* Select Products for Generation */}
                            {products.length > 0 && (
                              <div>
                                <label className="text-[10px] font-medium t-muted uppercase tracking-wider mb-1 block">
                                  Select Products for Mockup
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {products.map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() =>
                                        setPromptSelectedProducts(
                                          promptSelectedProducts.includes(p.id)
                                            ? promptSelectedProducts.filter((id) => id !== p.id)
                                            : [...promptSelectedProducts, p.id]
                                        )
                                      }
                                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] border transition-all ${
                                        promptSelectedProducts.includes(p.id)
                                          ? "bg-purple-600/15 border-purple-500/30 text-purple-500"
                                          : "bg-[var(--bg-wash)] border-[var(--border-color)] t-muted hover:t-secondary"
                                      }`}
                                    >
                                      {p.image_url && (
                                        <img
                                          src={p.image_url.startsWith("http") ? p.image_url : `http://localhost:8000${p.image_url}`}
                                          alt=""
                                          className="w-4 h-4 rounded object-cover"
                                        />
                                      )}
                                      {p.name}
                                      {promptSelectedProducts.includes(p.id) && <Check className="w-3 h-3" />}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Selected Fixture Indicator */}
                            {promptFixtureId && (
                              <div className="flex items-center gap-2 text-[10px] t-secondary">
                                <Box className="w-3 h-3 text-orange-500" />
                                Fixture: {fixtures.find((f: any) => f.id === promptFixtureId)?.name || "Selected"}
                                <button onClick={() => setPromptFixtureId(null)} className="t-muted hover:text-red-500"><X className="w-3 h-3" /></button>
                              </div>
                            )}

                            {/* AI Generate Prompt */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleGeneratePrompt(layout.id)}
                                disabled={generatingPrompt}
                                className="px-3 py-1.5 text-[11px] rounded-lg bg-[var(--accent-purple-bg)] border border-[var(--accent-purple-border)] text-purple-500 hover:bg-purple-600/20 transition-colors flex items-center gap-1.5"
                              >
                                {generatingPrompt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                AI Generate Prompt
                              </button>
                            </div>

                            {/* Prompt Text Editor */}
                            <div>
                              <label className="text-[10px] font-medium t-muted uppercase tracking-wider mb-1 block">
                                Generation Prompt
                              </label>
                              <textarea
                                value={promptText}
                                onChange={(e) => setPromptText(e.target.value)}
                                className="input-base text-xs resize-none"
                                rows={4}
                                placeholder="The prompt used for Nano Banana mockup generation. Click 'AI Generate' above or write your own..."
                              />
                            </div>

                            {/* Refine Prompt */}
                            {promptText && (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={refineInstruction}
                                  onChange={(e) => setRefineInstruction(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && handleRefinePrompt()}
                                  className="input-base text-xs flex-1"
                                  placeholder="Refine: e.g. Make it more minimal, add warm lighting, remove props..."
                                />
                                <button
                                  onClick={handleRefinePrompt}
                                  disabled={refiningPrompt || !refineInstruction.trim()}
                                  className="px-3 py-1.5 text-[11px] rounded-lg bg-[var(--accent-purple-bg)] border border-[var(--accent-purple-border)] text-purple-500 hover:bg-purple-600/20 transition-colors flex items-center gap-1.5"
                                >
                                  {refiningPrompt ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                  Refine
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        !generating && (
          <div className="text-center py-12">
            <Layers className="w-10 h-10 t-disabled mx-auto mb-3" />
            <p className="text-sm t-muted mb-3">
              No layouts generated yet.
              {products.length === 0 && " Add products first, then generate."}
            </p>
            <button
              onClick={handleGenerateLayouts}
              className="btn-gradient px-6 py-2.5 text-sm"
            >
              Generate AI Layouts
            </button>
          </div>
        )
      )}

      {generating && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
          <p className="text-sm t-secondary">
            AI is analyzing your design intent and generating layouts...
          </p>
        </div>
      )}
    </div>
  );
}
