"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Plus,
  X,
  Loader2,
  ChevronRight,
  Palette,
  Tag,
  Layers,
  Store,
  Eye,
  FileText,
  Trash2,
  Check,
  Upload,
  ImageIcon,
  Info,
} from "lucide-react";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import api from "@/lib/api";
import { useVMTowerStore, DesignIntent } from "@/store/vmTowerStore";

const SEASONS = ["SS'25", "AW'25", "SS'26", "AW'26", "SS'27"];
const STORE_TYPES = ["small", "medium", "flagship"];
const MOODS = ["minimal", "premium", "vibrant", "relaxed"];

export default function DesignIntentPanel() {
  const {
    intents,
    setIntents,
    addIntent,
    activeIntentId,
    setActiveIntentId,
    setActivePanel,
    updateIntent,
    removeIntent,
  } = useVMTowerStore();

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingIntents, setLoadingIntents] = useState(false);
  const [deletingIntentId, setDeletingIntentId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [rangePreview, setRangePreview] = useState<string | null>(null);
  const rangeUploadRef = useRef<HTMLInputElement>(null);

  // Form state
  const [theme, setTheme] = useState("");
  const [season, setSeason] = useState("SS'26");
  const [colorFlowInput, setColorFlowInput] = useState("");
  const [colorFlow, setColorFlow] = useState<string[]>([]);
  const [keyPieces, setKeyPieces] = useState<{ name: string; image_preview?: string; priority: number }[]>([]);
  const [newPieceName, setNewPieceName] = useState("");
  const keyPieceFileRef = useRef<HTMLInputElement>(null);
  const [pendingPieceImage, setPendingPieceImage] = useState<{ file: File; preview: string } | null>(null);
  const [stylingRules, setStylingRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");
  const [categoryMix, setCategoryMix] = useState<Record<string, number>>({});
  const [newCatName, setNewCatName] = useState("");
  const [newCatPct, setNewCatPct] = useState("");
  const [storeType, setStoreType] = useState("medium");
  const [visualMood, setVisualMood] = useState("minimal");

  const fetchIntents = async () => {
    setLoadingIntents(true);
    try {
      const res = await api.get("/api/vm-tower/intents");
      setIntents(res.data);
    } catch {
      // silent
    } finally {
      setLoadingIntents(false);
    }
  };

  const handleDeleteIntent = async (intentId: number) => {
    setDeletingIntentId(intentId);
    try {
      await api.delete(`/api/vm-tower/intents/${intentId}`);
      removeIntent(intentId);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingIntentId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/api/vm-tower/intents", {
        theme,
        season,
        color_flow: colorFlow,
        key_piece_priority: keyPieces,
        styling_rules: stylingRules,
        category_mix: categoryMix,
        target_store_type: storeType,
        visual_mood: visualMood,
      });
      addIntent(res.data);
      setActiveIntentId(res.data.id);
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTheme("");
    setSeason("SS'26");
    setColorFlow([]);
    setColorFlowInput("");
    setKeyPieces([]);
    setPendingPieceImage(null);
    setStylingRules([]);
    setCategoryMix({});
    setStoreType("medium");
    setVisualMood("minimal");
    setRangePreview(null);
  };

  const handleRangeUploadAndAnalyze = async (file: File) => {
    setRangePreview(URL.createObjectURL(file));
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("theme", theme);

      const res = await api.post("/api/vm-tower/analyze-range-image", formData);
      const data = res.data;

      // Auto-fill all fields from AI detection
      if (data.theme) setTheme(data.theme);
      if (data.season) setSeason(data.season);
      if (data.color_flow && data.color_flow.length > 0) setColorFlow(data.color_flow);
      if (data.styling_rules && data.styling_rules.length > 0) setStylingRules(data.styling_rules);
      if (data.category_mix && Object.keys(data.category_mix).length > 0) setCategoryMix(data.category_mix);
      if (data.target_store_type) setStoreType(data.target_store_type);
      if (data.visual_mood) setVisualMood(data.visual_mood);
      if (data.key_pieces && data.key_pieces.length > 0) {
        setKeyPieces(data.key_pieces.map((p: { name: string; priority: number }) => ({
          name: p.name,
          priority: p.priority,
        })));
      }
    } catch (err) {
      console.error("Image analysis failed:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const addColor = () => {
    if (colorFlowInput.trim()) {
      setColorFlow([...colorFlow, colorFlowInput.trim()]);
      setColorFlowInput("");
    }
  };

  const addKeyPiece = () => {
    if (newPieceName.trim()) {
      setKeyPieces([
        ...keyPieces,
        {
          name: newPieceName.trim(),
          image_preview: pendingPieceImage?.preview,
          priority: keyPieces.length + 1,
        },
      ]);
      setNewPieceName("");
      setPendingPieceImage(null);
    }
  };

  const addStylingRule = () => {
    if (newRule.trim()) {
      setStylingRules([...stylingRules, newRule.trim()]);
      setNewRule("");
    }
  };

  const addCategory = () => {
    if (newCatName.trim() && newCatPct) {
      setCategoryMix({ ...categoryMix, [newCatName.trim()]: Number(newCatPct) });
      setNewCatName("");
      setNewCatPct("");
    }
  };

  const activeIntent = intents.find((i) => i.id === activeIntentId);

  const statusColors: Record<string, string> = {
    intent_defined: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    ai_layout_suggested: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    designer_approved: "bg-green-500/20 text-green-400 border-green-500/30",
    concept_locked: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    buyer_editing: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    finalized: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    vm_ready: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  };

  const statusLabels: Record<string, string> = {
    intent_defined: "Intent Defined",
    ai_layout_suggested: "AI Layout Suggested",
    designer_approved: "Designer Approved",
    concept_locked: "Concept Locked",
    buyer_editing: "Buyer Editing",
    finalized: "Finalized",
    vm_ready: "VM Ready",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Design Intent Layer
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Define your visual merchandising intent before layout creation
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchIntents}
            className="px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
          >
            {loadingIntents ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-gradient px-4 py-2 text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Intent
          </button>
        </div>
      </div>

      {/* Intent Cards */}
      {intents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {intents.map((intent) => (
            <motion.div
              key={intent.id}
              layout
              whileHover={{ y: -2 }}
              onClick={() => setActiveIntentId(intent.id)}
              className={`card p-4 cursor-pointer transition-all ${
                activeIntentId === intent.id
                  ? "ring-2 ring-purple-500/50 border-purple-500/30"
                  : "hover:border-white/10"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{intent.theme}</h3>
                  <p className="text-xs text-gray-500">{intent.season}</p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    statusColors[intent.status] || "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {statusLabels[intent.status] || intent.status}
                </span>
              </div>

              {/* Color Flow */}
              {intent.color_flow && intent.color_flow.length > 0 && (
                <div className="flex items-center gap-1 mb-3">
                  {intent.color_flow.map((color, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                        {color}
                      </span>
                      {i < intent.color_flow.length - 1 && (
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Mood & Store */}
              <div className="flex gap-2 mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
                  {intent.visual_mood}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                  {intent.target_store_type}
                </span>
              </div>

              {/* AI Summary */}
              {intent.ai_context_summary && (
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {intent.ai_context_summary}
                </p>
              )}

              <div
                className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {activeIntentId === intent.id && (
                  <>
                    <button
                      onClick={() => setActivePanel("layout-canvas")}
                      className="text-[11px] px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 transition-colors flex items-center gap-1"
                    >
                      <Layers className="w-3 h-3" />
                      Generate Layouts
                    </button>
                    <button
                      onClick={() => setActivePanel("vm-output")}
                      className="text-[11px] px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      VM Output
                    </button>
                  </>
                )}
                <div className="ml-auto">
                  {confirmDeleteId === intent.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-red-400">Delete all data?</span>
                      <button
                        onClick={() => handleDeleteIntent(intent.id)}
                        disabled={deletingIntentId === intent.id}
                        className="text-[10px] px-2 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1"
                      >
                        {deletingIntentId === intent.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[10px] px-2 py-1 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(intent.id)}
                      className="text-[10px] px-2 py-1 rounded-lg text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Active Intent Detail */}
      {activeIntent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-400" />
            {activeIntent.theme} — Detail
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color Flow
                </label>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {activeIntent.color_flow?.map((c, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-sm px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white">
                        {c}
                      </span>
                      {i < activeIntent.color_flow.length - 1 && (
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {activeIntent.key_piece_priority && activeIntent.key_piece_priority.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key Pieces
                  </label>
                  <div className="mt-1 space-y-1">
                    {activeIntent.key_piece_priority.map((piece, i) => (
                      <div
                        key={i}
                        className="text-sm text-gray-300 flex items-center gap-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-purple-600/20 text-purple-400 text-[10px] flex items-center justify-center">
                          {piece.priority}
                        </span>
                        {piece.image_preview && (
                          <img src={piece.image_preview} alt="" className="w-6 h-6 rounded object-cover" />
                        )}
                        <span>{piece.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeIntent.styling_rules && activeIntent.styling_rules.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Styling Rules
                  </label>
                  <div className="mt-1 space-y-1">
                    {activeIntent.styling_rules.map((rule, i) => (
                      <div key={i} className="text-sm text-gray-300 flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-400" />
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {activeIntent.category_mix &&
                Object.keys(activeIntent.category_mix).length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category Mix
                    </label>
                    <div className="mt-2 space-y-2">
                      {Object.entries(activeIntent.category_mix).map(([cat, pct]) => (
                        <div key={cat}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-300 capitalize">{cat}</span>
                            <span className="text-gray-500">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: 0.1 }}
                              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {activeIntent.ai_context_summary && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Context Summary
                  </label>
                  <div className="mt-1 p-3 bg-gradient-to-br from-purple-900/10 to-pink-900/10 border border-purple-500/10 rounded-lg">
                    <div className="text-sm leading-snug [&>*]:mb-1 [&>*:last-child]:mb-0 [&_h1]:text-sm [&_h1]:font-semibold [&_h1]:text-gray-100 [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:text-gray-200 [&_h3]:text-xs [&_h3]:font-medium [&_h3]:text-gray-200 [&_p]:text-xs [&_p]:text-gray-300 [&_ul]:list-disc [&_ul]:ml-3 [&_ol]:list-decimal [&_ol]:ml-3 [&_li]:text-xs [&_li]:text-gray-300 [&_strong]:font-semibold [&_strong]:text-gray-200">
                      <ReactMarkdown>{activeIntent.ai_context_summary}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Create Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#151520] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Define Design Intent
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Range Image Upload — AI Auto-Detect */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <ImageIcon className="w-3.5 h-3.5 inline mr-1" />
                    Upload Range Image (AI Auto-Detect)
                  </label>
                  <p className="text-[11px] t-muted mb-2">
                    Upload your range/collection image — AI will analyze it and auto-fill theme, colors, categories, styling rules, and mood
                  </p>
                  <div className="flex gap-3 items-start">
                    <div
                      onClick={() => rangeUploadRef.current?.click()}
                      className={`relative w-32 h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all flex-shrink-0 overflow-hidden flex items-center justify-center ${
                        rangePreview ? "border-purple-500/40" : "border-[var(--border-color)] hover:border-purple-500/30"
                      }`}
                    >
                      {rangePreview ? (
                        <img src={rangePreview} alt="Range" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <Upload className="w-6 h-6 t-disabled mx-auto mb-1" />
                          <span className="text-[10px] t-muted">Click to upload</span>
                        </div>
                      )}
                      {analyzing && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                          <div className="text-center">
                            <Loader2 className="w-5 h-5 text-purple-400 animate-spin mx-auto mb-1" />
                            <span className="text-[9px] text-purple-300">Analyzing...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      ref={rangeUploadRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleRangeUploadAndAnalyze(file);
                        e.target.value = "";
                      }}
                    />
                    {analyzing && (
                      <div className="flex-1 p-3 rounded-xl bg-[var(--accent-purple-bg)] border border-[var(--accent-purple-border)]">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium text-purple-400">AI Analyzing Image...</span>
                        </div>
                        <p className="text-[11px] t-muted">
                          Detecting garments, colors, categories, fabrics, and styling rules from your range image
                        </p>
                      </div>
                    )}
                    {!analyzing && rangePreview && (
                      <div className="flex-1 p-3 rounded-xl bg-[var(--status-valid-bg)] border border-green-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Check className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-medium text-green-400">Auto-Detected</span>
                        </div>
                        <p className="text-[11px] t-muted">
                          Fields below have been auto-filled from your image. Review and adjust as needed.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Theme *
                  </label>
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="input-base"
                    placeholder='e.g., "Summer Linen Story"'
                    required
                  />
                </div>

                {/* Season */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Season
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {SEASONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSeason(s)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                          season === s
                            ? "bg-purple-600/20 border-purple-500/30 text-purple-300"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Flow */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <Palette className="w-3.5 h-3.5 inline mr-1" />
                    Color Flow
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={colorFlowInput}
                      onChange={(e) => setColorFlowInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColor())}
                      className="input-base flex-1"
                      placeholder="e.g., white, sand, sky blue..."
                    />
                    <button
                      type="button"
                      onClick={addColor}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {colorFlow.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {colorFlow.map((c, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-white flex items-center gap-1">
                            {c}
                            <button
                              type="button"
                              onClick={() =>
                                setColorFlow(colorFlow.filter((_, j) => j !== i))
                              }
                              className="ml-1 text-gray-500 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                          {i < colorFlow.length - 1 && (
                            <ChevronRight className="w-3 h-3 text-gray-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Key Pieces — Image Based */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <Tag className="w-3.5 h-3.5 inline mr-1" />
                    Key Pieces (Hero Products)
                  </label>
                  <p className="text-[11px] t-muted mb-2">Upload product photos — AI will read the image to understand the garment</p>
                  <div className="flex gap-2 mb-3 items-end">
                    {/* Image upload */}
                    <div
                      onClick={() => keyPieceFileRef.current?.click()}
                      className="w-16 h-16 rounded-lg border border-dashed border-[var(--border-color)] hover:border-purple-500/40 flex items-center justify-center cursor-pointer transition-all flex-shrink-0 overflow-hidden"
                    >
                      {pendingPieceImage ? (
                        <img src={pendingPieceImage.preview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-5 h-5 t-disabled" />
                      )}
                    </div>
                    <input
                      ref={keyPieceFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPendingPieceImage({ file, preview: URL.createObjectURL(file) });
                        }
                        e.target.value = "";
                      }}
                    />
                    <input
                      type="text"
                      value={newPieceName}
                      onChange={(e) => setNewPieceName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyPiece())}
                      className="input-base flex-1"
                      placeholder="Product name (e.g. Linen Mandarin Shirt)"
                    />
                    <button
                      type="button"
                      onClick={addKeyPiece}
                      disabled={!newPieceName.trim()}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {keyPieces.length > 0 && (
                    <div className="space-y-1.5">
                      {keyPieces.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-gray-300 py-1 px-2 rounded-lg bg-white/3"
                        >
                          <span className="w-5 h-5 rounded-full bg-purple-600/20 text-purple-400 text-[10px] flex items-center justify-center flex-shrink-0">
                            {p.priority}
                          </span>
                          {p.image_preview && (
                            <img src={p.image_preview} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                          )}
                          <span className="flex-1">{p.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setKeyPieces(keyPieces.filter((_, j) => j !== i))
                            }
                            className="text-gray-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Styling Rules */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Styling Rules
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newRule}
                      onChange={(e) => setNewRule(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addStylingRule())
                      }
                      className="input-base flex-1"
                      placeholder="e.g., breathable fabrics first"
                    />
                    <button
                      type="button"
                      onClick={addStylingRule}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {stylingRules.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-300 mb-1">
                      <Check className="w-3 h-3 text-green-400" />
                      {r}
                      <button
                        type="button"
                        onClick={() =>
                          setStylingRules(stylingRules.filter((_, j) => j !== i))
                        }
                        className="ml-auto text-gray-500 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Category Mix */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    <Layers className="w-3.5 h-3.5 inline mr-1" />
                    Category Mix
                  </label>
                  <p className="text-[11px] t-muted mb-2">
                    Define what percentage of each product category the display should feature. Total should equal 100%.
                  </p>

                  {/* Quick Presets */}
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {[
                      { label: "Tops Heavy", mix: { tops: 50, bottoms: 30, accessories: 20 } },
                      { label: "Balanced", mix: { tops: 35, bottoms: 35, accessories: 15, outerwear: 15 } },
                      { label: "Full Look", mix: { shirts: 30, trousers: 30, tees: 20, accessories: 20 } },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setCategoryMix(preset.mix)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Add Category */}
                  <div className="flex gap-2 mb-3 items-center">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                      className="input-base !w-auto flex-1 min-w-0"
                      placeholder="Category (e.g. shirts, trousers)"
                    />
                    <input
                      type="number"
                      value={newCatPct}
                      onChange={(e) => setNewCatPct(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                      className="input-base !w-20 flex-shrink-0"
                      placeholder="%"
                      min={0}
                      max={100}
                    />
                    <button
                      type="button"
                      onClick={addCategory}
                      disabled={!newCatName.trim() || !newCatPct}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 disabled:opacity-30 flex-shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Visual Bar + List */}
                  {Object.keys(categoryMix).length > 0 && (
                    <div className="space-y-2">
                      {/* Stacked bar */}
                      <div className="flex h-3 rounded-full overflow-hidden bg-white/5">
                        {Object.entries(categoryMix).map(([cat, pct], i) => {
                          const colors = ["bg-purple-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500"];
                          return (
                            <div
                              key={cat}
                              className={`${colors[i % colors.length]} transition-all`}
                              style={{ width: `${pct}%` }}
                              title={`${cat}: ${pct}%`}
                            />
                          );
                        })}
                      </div>
                      {/* Legend */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {Object.entries(categoryMix).map(([cat, pct], i) => {
                          const colors = ["bg-purple-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500"];
                          return (
                            <div key={cat} className="flex items-center gap-1.5 text-xs text-gray-300">
                              <div className={`w-2 h-2 rounded-full ${colors[i % colors.length]}`} />
                              <span className="capitalize">{cat}</span>
                              <span className="text-gray-500">{pct}%</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = { ...categoryMix };
                                  delete next[cat];
                                  setCategoryMix(next);
                                }}
                                className="text-gray-600 hover:text-red-400 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {/* Total indicator */}
                      {(() => {
                        const total = Object.values(categoryMix).reduce((a, b) => a + b, 0);
                        return (
                          <div className={`text-[10px] ${total === 100 ? "text-green-400" : "text-amber-400"}`}>
                            Total: {total}% {total === 100 ? "✓" : total > 100 ? "(over 100%)" : `(${100 - total}% remaining)`}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Store Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <Store className="w-3.5 h-3.5 inline mr-1" />
                    Store Size Target
                  </label>
                  <div className="flex gap-2">
                    {STORE_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setStoreType(t)}
                        className={`px-4 py-2 text-xs rounded-lg border capitalize transition-colors ${
                          storeType === t
                            ? "bg-purple-600/20 border-purple-500/30 text-purple-300"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Mood */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Visual Mood
                  </label>
                  <div className="flex gap-2">
                    {MOODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setVisualMood(m)}
                        className={`px-4 py-2 text-xs rounded-lg border capitalize transition-colors ${
                          visualMood === m
                            ? "bg-purple-600/20 border-purple-500/30 text-purple-300"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !theme.trim()}
                  className="btn-gradient w-full py-3 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI is analyzing intent...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create Design Intent
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {intents.length === 0 && !showForm && (
        <div className="text-center py-16">
          <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">
            No Design Intents Yet
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Start by defining your visual merchandising intent
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-gradient px-6 py-2.5 text-sm"
          >
            Create Your First Intent
          </button>
        </div>
      )}
    </div>
  );
}
