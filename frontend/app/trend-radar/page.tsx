"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Search,
  Sparkles,
  ArrowRight,
  BarChart3,
  X,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

const TABS = ["Trend Radar", "Trend Scout", "Brand Compare"] as const;
type TabType = (typeof TABS)[number];

const CATEGORIES = [
  "Womenswear",
  "Menswear",
  "Ethnicwear",
  "Kidswear",
  "Innerwear",
  "Footwear",
  "Accessories",
];
const SEASONS = ["SS25", "AW25", "SS26", "AW26", "SS27", "AW27"];

interface TrendItem {
  id: string;
  name: string;
  category: string;
  score: number;
  growth: "up" | "stable" | "down";
  color_hex: string;
  description: string;
}

interface CompareResult {
  name: string;
  positioning: string;
  price_segment: string;
  trend_score: number;
  key_trends: string[];
  strengths: string[];
  gaps: string[];
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score > 80
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : score > 50
      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
      : "bg-gray-500/15 t-muted border-gray-500/30";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}
    >
      {score}
    </span>
  );
}

function GrowthIndicator({ growth }: { growth: "up" | "stable" | "down" }) {
  if (growth === "up")
    return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (growth === "down")
    return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-amber-400" />;
}

function TrendModal({ trend, onClose }: { trend: TrendItem; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="card w-full max-w-md overflow-hidden shadow-2xl shadow-black/40"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-2" style={{ backgroundColor: trend.color_hex }} />
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-bold t-heading mb-1">{trend.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="tag text-[10px]">{trend.category}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center t-muted hover:t-heading transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-5 p-3 rounded-xl bg-surface-2">
              <div className="flex items-center gap-2">
                <GrowthIndicator growth={trend.growth} />
                <span className="text-xs t-secondary capitalize">{trend.growth}</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <ScoreBadge score={trend.score} />
                <span className="text-xs t-secondary">Trend strength</span>
              </div>
              {trend.color_hex && (
                <>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-white/10"
                      style={{ backgroundColor: trend.color_hex }}
                    />
                    <span className="text-xs t-secondary font-mono">{trend.color_hex}</span>
                  </div>
                </>
              )}
            </div>

            <p className="text-sm t-secondary leading-relaxed">{trend.description}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TrendCard({ trend, index, onClick }: { trend: TrendItem; index: number; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="card overflow-hidden group hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 cursor-pointer"
    >
      <div
        className="h-1.5"
        style={{ backgroundColor: trend.color_hex }}
      />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="text-sm font-bold t-heading group-hover:text-purple-400 transition-colors">
              {trend.name}
            </h4>
            <span className="tag text-[10px] mt-1 inline-block">
              {trend.category}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GrowthIndicator growth={trend.growth} />
            <ScoreBadge score={trend.score} />
          </div>
        </div>
        <p className="text-xs t-muted line-clamp-2 leading-relaxed">
          {trend.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function TrendRadarPage() {
  const { isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("Trend Radar");

  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);

  // Trend Radar state
  const [category, setCategory] = useState("Womenswear");
  const [season, setSeason] = useState("SS26");
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [summary, setSummary] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  // Trend Scout state
  const [scoutQuery, setScoutQuery] = useState("");
  const [scoutCategory, setScoutCategory] = useState("");
  const [scoutResults, setScoutResults] = useState<TrendItem[]>([]);
  const [scouting, setScouting] = useState(false);

  // Brand Compare state
  const [brand1, setBrand1] = useState("");
  const [brand2, setBrand2] = useState("");
  const [compareResults, setCompareResults] = useState<CompareResult[]>([]);
  const [compareSummary, setCompareSummary] = useState("");
  const [comparing, setComparing] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await api.post("/api/trend-radar/analyze", {
        category,
        season,
      });
      setTrends(response.data.trends || []);
      setSummary(response.data.summary || "");
    } catch {
      // Error handled silently
    } finally {
      setAnalyzing(false);
    }
  };

  const handleScout = async () => {
    if (!scoutQuery.trim()) return;
    setScouting(true);
    try {
      const response = await api.post("/api/trend-radar/scout", {
        query: scoutQuery,
        category: scoutCategory || undefined,
      });
      setScoutResults(response.data.trends || []);
    } catch {
      // Error handled silently
    } finally {
      setScouting(false);
    }
  };

  const handleCompare = async () => {
    if (!brand1.trim() || !brand2.trim()) return;
    setComparing(true);
    try {
      const response = await api.post("/api/trend-radar/compare", {
        brands: [brand1, brand2],
      });
      setCompareResults(response.data.brands || []);
      setCompareSummary(response.data.summary || "");
    } catch {
      // Error handled silently
    } finally {
      setComparing(false);
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
              <Radar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold t-heading">Trend Radar</h1>
              <p className="text-sm t-muted">
                Discover rising aesthetics, colors, fabrics, and silhouettes
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-1 p-1 bg-surface-2 rounded-xl w-fit mb-8"
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                  : "t-secondary hover:t-heading hover:bg-wash"
              }`}
            >
              {tab}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Trend Radar Tab */}
          {activeTab === "Trend Radar" && (
            <motion.div
              key="radar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Controls */}
              <div className="card p-4 mb-6">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium t-secondary mb-1.5 block">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-base w-full rounded-lg text-sm py-2.5 px-3"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium t-secondary mb-1.5 block">
                      Season
                    </label>
                    <select
                      value={season}
                      onChange={(e) => setSeason(e.target.value)}
                      className="input-base w-full rounded-lg text-sm py-2.5 px-3"
                    >
                      {SEASONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="btn-gradient px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {analyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <BarChart3 className="w-4 h-4" />
                    )}
                    Analyze
                  </button>
                </div>
              </div>

              {/* Results */}
              {analyzing ? (
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-40 rounded-xl shimmer" />
                  ))}
                </div>
              ) : trends.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {trends.map((trend, idx) => (
                      <TrendCard key={trend.id} trend={trend} index={idx} onClick={() => setSelectedTrend(trend)} />
                    ))}
                  </div>
                  {summary && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="ai-summary-block p-5 rounded-xl"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-semibold t-heading">
                          AI Summary
                        </span>
                      </div>
                      <p className="text-sm t-secondary leading-relaxed">
                        {summary}
                      </p>
                    </motion.div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
                    <Radar className="w-8 h-8 t-faint" />
                  </div>
                  <h3 className="text-base font-semibold t-heading mb-1">
                    Ready to discover trends
                  </h3>
                  <p className="text-sm t-muted">
                    Select a category and season, then click Analyze
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Trend Scout Tab */}
          {activeTab === "Trend Scout" && (
            <motion.div
              key="scout"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="card p-4 mb-6">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium t-secondary mb-1.5 block">
                      Search Trends
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 t-faint" />
                      <input
                        type="text"
                        value={scoutQuery}
                        onChange={(e) => setScoutQuery(e.target.value)}
                        placeholder="Search for trends, aesthetics, fabrics..."
                        className="input-base w-full rounded-lg text-sm py-2.5 pl-10 pr-3"
                        onKeyDown={(e) => e.key === "Enter" && handleScout()}
                      />
                    </div>
                  </div>
                  <div className="w-44 flex-shrink-0">
                    <label className="text-xs font-medium t-secondary mb-1.5 block">
                      Category
                    </label>
                    <select
                      value={scoutCategory}
                      onChange={(e) => setScoutCategory(e.target.value)}
                      className="input-base w-full rounded-lg text-sm py-2.5 px-3"
                    >
                      <option value="">All Categories</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleScout}
                    disabled={scouting || !scoutQuery.trim()}
                    className="btn-gradient px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {scouting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Discover
                  </button>
                </div>
              </div>

              {scouting ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 rounded-xl shimmer" />
                  ))}
                </div>
              ) : scoutResults.length > 0 ? (
                <div className="space-y-3">
                  {scoutResults.map((trend, idx) => (
                    <motion.div
                      key={trend.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedTrend(trend)}
                      className="card p-4 flex items-center gap-4 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 cursor-pointer"
                    >
                      <div
                        className="w-2 h-12 rounded-full flex-shrink-0"
                        style={{ backgroundColor: trend.color_hex }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold t-heading">
                            {trend.name}
                          </h4>
                          <span className="tag text-[10px]">
                            {trend.category}
                          </span>
                        </div>
                        <p className="text-xs t-muted line-clamp-1">
                          {trend.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <GrowthIndicator growth={trend.growth} />
                        <ScoreBadge score={trend.score} />
                        <ArrowRight className="w-4 h-4 t-faint" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 t-faint" />
                  </div>
                  <h3 className="text-base font-semibold t-heading mb-1">
                    Scout emerging trends
                  </h3>
                  <p className="text-sm t-muted">
                    Search by keyword, aesthetic, fabric, or silhouette
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Brand Compare Tab */}
          {activeTab === "Brand Compare" && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="card p-4 mb-6">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium t-secondary mb-1.5 block">
                      Brand 1
                    </label>
                    <input
                      type="text"
                      value={brand1}
                      onChange={(e) => setBrand1(e.target.value)}
                      placeholder="e.g., Zara"
                      className="input-base w-full rounded-lg text-sm py-2.5 px-3"
                    />
                  </div>
                  <div className="flex items-center pb-2.5 t-faint text-sm font-medium">
                    vs
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium t-secondary mb-1.5 block">
                      Brand 2
                    </label>
                    <input
                      type="text"
                      value={brand2}
                      onChange={(e) => setBrand2(e.target.value)}
                      placeholder="e.g., H&M"
                      className="input-base w-full rounded-lg text-sm py-2.5 px-3"
                    />
                  </div>
                  <button
                    onClick={handleCompare}
                    disabled={comparing || !brand1.trim() || !brand2.trim()}
                    className="btn-gradient px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {comparing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <BarChart3 className="w-4 h-4" />
                    )}
                    Compare
                  </button>
                </div>
              </div>

              {comparing ? (
                <div className="grid grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-80 rounded-xl shimmer" />
                  ))}
                </div>
              ) : compareResults.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {compareResults.map((result, idx) => (
                      <motion.div
                        key={result.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.15 }}
                        className="card p-5"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-bold t-heading">{result.name}</h3>
                          <ScoreBadge score={result.trend_score} />
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="tag text-[10px]">{result.price_segment}</span>
                          <p className="text-xs t-muted line-clamp-1">{result.positioning}</p>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs font-semibold t-secondary mb-2">Key Trends</p>
                          <div className="flex flex-wrap gap-1.5">
                            {result.key_trends.map((t) => (
                              <span key={t} className="tag text-[10px]">{t}</span>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-semibold text-emerald-400 mb-1.5">Strengths</p>
                            <ul className="space-y-1">
                              {result.strengths.map((s) => (
                                <li key={s} className="text-xs t-muted flex gap-1.5">
                                  <span className="text-emerald-400 mt-0.5">+</span>{s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-amber-400 mb-1.5">Gaps</p>
                            <ul className="space-y-1">
                              {result.gaps.map((g) => (
                                <li key={g} className="text-xs t-muted flex gap-1.5">
                                  <span className="text-amber-400 mt-0.5">△</span>{g}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {compareSummary && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="ai-summary-block p-5 rounded-xl"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-semibold t-heading">AI Summary</span>
                      </div>
                      <p className="text-sm t-secondary leading-relaxed">{compareSummary}</p>
                    </motion.div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 t-faint" />
                  </div>
                  <h3 className="text-base font-semibold t-heading mb-1">
                    Compare brand trend adoption
                  </h3>
                  <p className="text-sm t-muted">
                    Enter two brand names to see a side-by-side trend comparison
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedTrend && (
        <TrendModal trend={selectedTrend} onClose={() => setSelectedTrend(null)} />
      )}
    </div>
  );
}
