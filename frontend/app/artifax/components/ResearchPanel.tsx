"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  TrendingUp,
  Building2,
  Star,
  Loader2,
  Upload,
  X,
  ChevronRight,
  Lightbulb,
  BarChart3,
  Sparkles,
  ImagePlus,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import api from "@/lib/api";
import { useArtifaxStore } from "@/store/artifaxStore";

type ResearchTab = "trends" | "competitor" | "runway" | "saved";

const CATEGORIES = [
  "Womenswear", "Menswear", "Kidswear", "Activewear",
  "Luxury RTW", "Denim", "Outerwear", "Ethnic/Fusion", "Accessories"
];
const SEASONS = ["SS25", "AW25", "SS26", "AW26", "Resort 25", "Pre-Fall 25"];
const REGIONS_TREND = ["Global", "India", "Europe", "USA", "Asia-Pacific", "Middle East"];
const REGIONS_RUNWAY = ["Paris", "Milan", "London", "New York", "Mumbai", "Tokyo"];

// Safely coerce any API value to a renderable string (guards against GPT returning objects instead of strings)
function toStr(val: unknown): string {
  if (typeof val === "string") return val;
  if (val === null || val === undefined) return "";
  if (typeof val === "object")
    return Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
      .join("\n\n");
  return String(val);
}

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(10px)",
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">
        {title}
      </h4>
      {children}
    </div>
  );
}

function TagList({ items, color = "#06b6d4" }: { items: string[]; color?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className="text-xs px-2.5 py-1 rounded-full border"
          style={{
            background: `${color}15`,
            borderColor: `${color}30`,
            color: `${color}`,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function LoadingOverlay({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <FlaskConical className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-600 rounded-full flex items-center justify-center">
          <Loader2 className="w-3 h-3 text-white animate-spin" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-white font-medium text-sm">{label}</p>
        <p className="text-gray-500 text-xs mt-0.5">AI is researching…</p>
      </div>
      <div className="w-56 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-blue-600"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

export default function ResearchPanel() {
  const { project, setTrends, setCompetitor, setRunway, addInspirationImage, removeInspirationImage } =
    useArtifaxStore();
  const [activeTab, setActiveTab] = useState<ResearchTab>("trends");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Trends form
  const [trendForm, setTrendForm] = useState({
    category: "Womenswear",
    season: "SS25",
    region: "Global",
    style_keywords: "",
  });

  // Competitor form
  const [competitorForm, setCompetitorForm] = useState({
    brand_name: "",
    category: "Womenswear",
  });

  // Runway form
  const [runwayForm, setRunwayForm] = useState({ season: "SS25", region: "Paris" });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    onDrop: async (acceptedFiles) => {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("image", file);
        try {
          const res = await api.post("/api/artifax/research/upload-inspiration", formData);
          addInspirationImage(res.data.url);
        } catch {}
      }
    },
  });

  const callAPI = async (endpoint: string, body: Record<string, string>, setter: (d: Record<string, unknown>) => void, label: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post(endpoint, body);
      setter(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || `${label} failed.`);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "trends" as ResearchTab, label: "Trends", icon: TrendingUp },
    { id: "competitor" as ResearchTab, label: "Competitor", icon: Building2 },
    { id: "runway" as ResearchTab, label: "Runway", icon: Star },
    { id: "saved" as ResearchTab, label: "Saved Images", icon: ImagePlus, count: project.research.savedImages.length },
  ];

  return (
    <div className="flex h-full min-h-[calc(100vh-120px)]">
      {/* Left panel */}
      <div className="w-80 flex-shrink-0 border-r border-white/5 flex flex-col">
        {/* Sub-tabs */}
        <div className="p-4 border-b border-white/5">
          <div className="space-y-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    isActive
                      ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-300"
                      : "text-gray-500 hover:bg-white/4 hover:text-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-300 text-[10px] flex items-center justify-center">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 p-4 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === "trends" && (
              <motion.div key="trends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <p className="text-xs text-gray-600 mb-3">
                  AI-powered trend intelligence for your category and season.
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
                  <select value={trendForm.category} onChange={(e) => setTrendForm({ ...trendForm, category: e.target.value })} className="input-base text-sm">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Season</label>
                  <select value={trendForm.season} onChange={(e) => setTrendForm({ ...trendForm, season: e.target.value })} className="input-base text-sm">
                    {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Region</label>
                  <select value={trendForm.region} onChange={(e) => setTrendForm({ ...trendForm, region: e.target.value })} className="input-base text-sm">
                    {REGIONS_TREND.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Style Keywords <span className="text-gray-600">(optional)</span></label>
                  <input value={trendForm.style_keywords} onChange={(e) => setTrendForm({ ...trendForm, style_keywords: e.target.value })} className="input-base text-sm" placeholder="minimalist, sustainable, Y2K..." />
                </div>
                <button
                  onClick={() => callAPI("/api/artifax/research/trends", trendForm, setTrends, "Trend analysis")}
                  disabled={loading}
                  className="btn-gradient w-full flex items-center justify-center gap-2 py-2.5 text-sm"
                  style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)" }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                  Analyze Trends
                </button>
              </motion.div>
            )}

            {activeTab === "competitor" && (
              <motion.div key="competitor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <p className="text-xs text-gray-600 mb-3">
                  Competitive intelligence on any fashion brand.
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Brand Name</label>
                  <input value={competitorForm.brand_name} onChange={(e) => setCompetitorForm({ ...competitorForm, brand_name: e.target.value })} className="input-base text-sm" placeholder="e.g. Zara, H&M, Fabindia..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
                  <select value={competitorForm.category} onChange={(e) => setCompetitorForm({ ...competitorForm, category: e.target.value })} className="input-base text-sm">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => callAPI("/api/artifax/research/competitor", competitorForm, setCompetitor, "Competitor analysis")}
                  disabled={loading || !competitorForm.brand_name}
                  className="btn-gradient w-full flex items-center justify-center gap-2 py-2.5 text-sm"
                  style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)" }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                  Analyze Competitor
                </button>
              </motion.div>
            )}

            {activeTab === "runway" && (
              <motion.div key="runway" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <p className="text-xs text-gray-600 mb-3">
                  Runway analysis from major fashion weeks.
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Season</label>
                  <select value={runwayForm.season} onChange={(e) => setRunwayForm({ ...runwayForm, season: e.target.value })} className="input-base text-sm">
                    {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Fashion Week</label>
                  <select value={runwayForm.region} onChange={(e) => setRunwayForm({ ...runwayForm, region: e.target.value })} className="input-base text-sm">
                    {REGIONS_RUNWAY.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => callAPI("/api/artifax/research/runway", runwayForm, setRunway, "Runway analysis")}
                  disabled={loading}
                  className="btn-gradient w-full flex items-center justify-center gap-2 py-2.5 text-sm"
                  style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)" }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                  Analyze Runway
                </button>
              </motion.div>
            )}

            {activeTab === "saved" && (
              <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <p className="text-xs text-gray-600 mb-3">
                  Save inspiration images to your research library.
                </p>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragActive ? "border-cyan-500/60 bg-cyan-500/5" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-5 h-5 mx-auto mb-2 text-gray-500" />
                  <p className="text-xs text-gray-500">Drop images here or click to upload</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-xs">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Right: Results */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoadingOverlay label={activeTab === "trends" ? "Analyzing fashion trends..." : activeTab === "competitor" ? "Running competitor analysis..." : activeTab === "runway" ? "Analyzing runway shows..." : "Processing..."} />
            </motion.div>
          )}

          {/* Trends results */}
          {!loading && activeTab === "trends" && project.research.trends && (
            <motion.div key="trends-result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Trend Analysis</h3>
              </div>
              <ResultCard title="Trend Overview">
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{toStr((project.research.trends as Record<string, unknown>).trend_summary)}</p>
              </ResultCard>
              <div className="grid grid-cols-2 gap-4">
                <ResultCard title="Key Silhouettes">
                  <div className="space-y-2">
                    {((project.research.trends as Record<string, string[]>).key_silhouettes || []).map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <ChevronRight className="w-3 h-3 text-cyan-500 mt-0.5 flex-shrink-0" />
                        {s}
                      </div>
                    ))}
                  </div>
                </ResultCard>
                <ResultCard title="Key Fabrics">
                  <div className="space-y-2">
                    {((project.research.trends as Record<string, string[]>).key_fabrics || []).map((f: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <ChevronRight className="w-3 h-3 text-cyan-500 mt-0.5 flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </ResultCard>
              </div>
              <ResultCard title="Color Direction">
                <div className="flex flex-wrap gap-3">
                  {((project.research.trends as Record<string, Array<{name: string; hex: string; season_relevance: string}>>).key_colors || []).map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg border border-white/10 shadow-sm" style={{ backgroundColor: c.hex }} title={c.season_relevance} />
                      <div>
                        <div className="text-xs text-white font-medium">{c.name}</div>
                        <div className="text-[10px] text-gray-600 font-mono">{c.hex}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ResultCard>
              <ResultCard title="Market Insight">
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{toStr((project.research.trends as Record<string, unknown>).market_insight)}</p>
              </ResultCard>
            </motion.div>
          )}

          {/* Competitor results */}
          {!loading && activeTab === "competitor" && project.research.competitor && (
            <motion.div key="competitor-result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Competitor Analysis</h3>
              </div>
              <ResultCard title="Market Position">
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{toStr((project.research.competitor as Record<string, unknown>).market_position)}</p>
              </ResultCard>
              <ResultCard title="Pricing Range">
                <p className="text-gray-300 text-sm whitespace-pre-line">{toStr((project.research.competitor as Record<string, unknown>).pricing_range)}</p>
              </ResultCard>
              <div className="grid grid-cols-2 gap-4">
                <ResultCard title="Common Attributes">
                  <div className="space-y-1.5">
                    {((project.research.competitor as Record<string, string[]>).common_attributes || []).map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <ChevronRight className="w-3 h-3 text-cyan-500 mt-0.5 flex-shrink-0" />{a}
                      </div>
                    ))}
                  </div>
                </ResultCard>
                <ResultCard title="Design Gaps">
                  <div className="space-y-1.5">
                    {((project.research.competitor as Record<string, string[]>).design_gaps || []).map((g, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <ChevronRight className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" />{g}
                      </div>
                    ))}
                  </div>
                </ResultCard>
              </div>
              <ResultCard title="Opportunities">
                <div className="space-y-2">
                  {((project.research.competitor as Record<string, string[]>).opportunity_suggestions || []).map((o, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-300 bg-cyan-500/5 rounded-lg p-2 border border-cyan-500/10">
                      <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />{o}
                    </div>
                  ))}
                </div>
              </ResultCard>
            </motion.div>
          )}

          {/* Runway results */}
          {!loading && activeTab === "runway" && project.research.runway && (
            <motion.div key="runway-result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Runway Analysis</h3>
              </div>
              <ResultCard title="Key Trends">
                <TagList items={(project.research.runway as Record<string, string[]>).key_trends || []} />
              </ResultCard>
              <ResultCard title="Top Silhouettes">
                <div className="space-y-2">
                  {((project.research.runway as Record<string, string[]>).top_silhouettes || []).map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                      <ChevronRight className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />{s}
                    </div>
                  ))}
                </div>
              </ResultCard>
              <ResultCard title="Dominant Colors">
                <div className="flex flex-wrap gap-3">
                  {((project.research.runway as Record<string, Array<{name: string; hex: string; designers: string}>>).dominant_colors || []).map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg border border-white/10" style={{ backgroundColor: c.hex }} title={c.designers} />
                      <div>
                        <div className="text-xs text-white">{c.name}</div>
                        <div className="text-[10px] text-gray-600">{c.hex}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ResultCard>
              <ResultCard title="Commercial Translation">
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{toStr((project.research.runway as Record<string, unknown>).commercial_translation)}</p>
              </ResultCard>
            </motion.div>
          )}

          {/* Saved images */}
          {!loading && activeTab === "saved" && (
            <motion.div key="saved-imgs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {project.research.savedImages.length === 0 ? (
                <div className="text-center py-20">
                  <ImagePlus className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No saved images yet</p>
                  <p className="text-gray-700 text-xs mt-1">Upload inspiration images from the left panel</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {project.research.savedImages.map((url, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="relative group aspect-square rounded-xl overflow-hidden bg-white/3 border border-white/5">
                      <img src={url} alt={`Inspiration ${i + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => removeInspirationImage(url)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/80 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Empty states */}
          {!loading && activeTab !== "saved" && !project.research[activeTab as "trends" | "competitor" | "runway"] && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/8 border border-cyan-500/15 flex items-center justify-center mx-auto mb-4 animate-float">
                <FlaskConical className="w-7 h-7 text-cyan-400/60" />
              </div>
              <h3 className="text-gray-400 font-medium mb-1">No analysis yet</h3>
              <p className="text-gray-600 text-sm max-w-xs">Configure your parameters in the left panel and run the AI analysis</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
