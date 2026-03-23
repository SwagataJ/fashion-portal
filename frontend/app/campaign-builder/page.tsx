"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Loader2,
  ImageIcon,
  Plus,
  Calendar,
  Wand2,
  Save,
  Layout,
  BookOpen,
  Share2,
  Mail,
  Sparkles,
  Film,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import api, { API_BASE_URL } from "@/lib/api";

const FORMATS = [
  { value: "hero_banner", label: "Hero Banner", icon: Layout },
  { value: "lookbook", label: "Lookbook Page", icon: BookOpen },
  { value: "social_post", label: "Social Post", icon: Share2 },
  { value: "email_header", label: "Email Header", icon: Mail },
  { value: "ad_creative", label: "Ad Creative", icon: Sparkles },
  { value: "editorial", label: "Editorial", icon: Film },
];

const STYLES = ["Premium", "Minimal", "Bold", "Editorial", "Playful", "Luxury"];

interface Campaign {
  id: string;
  name: string;
  format: string;
  thumbnail_url: string;
  created_at: string;
}

export default function CampaignBuilderPage() {
  const { isLoading } = useAuth();
  const [selectedFormat, setSelectedFormat] = useState("hero_banner");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [style, setStyle] = useState("Premium");
  const [productDescription, setProductDescription] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const response = await api.get("/api/campaign-builder/list");
      setCampaigns(response.data || []);
    } catch {
      // Error handled silently
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await api.post("/api/campaign-builder/generate", {
        format: selectedFormat,
        headline,
        subheadline,
        cta: ctaText,
        style,
        product_description: productDescription,
        custom_prompt: customPrompt,
      });
      setResultImage(`${API_BASE_URL}${response.data.image_url}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!resultImage) return;
    setSaving(true);
    try {
      await api.post("/api/campaign-builder/save", {
        name: headline || "Untitled Campaign",
        format: selectedFormat,
        result_image_url: resultImage,
        config: { headline, subheadline, cta: ctaText, style, product_description: productDescription },
      });
      fetchCampaigns();
    } catch {
      // Error handled silently
    } finally {
      setSaving(false);
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
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold t-heading">Campaign Builder</h1>
              <p className="text-sm t-muted">
                Create stunning fashion marketing campaigns with AI
              </p>
            </div>
          </div>
        </motion.div>

        {/* Format Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8 overflow-x-auto pb-1"
        >
          {FORMATS.map((format) => {
            const Icon = format.icon;
            const isActive = selectedFormat === format.value;
            return (
              <button
                key={format.value}
                onClick={() => setSelectedFormat(format.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                    : "bg-surface-2 t-secondary border b-subtle hover:bg-wash hover:border-theme"
                }`}
              >
                <Icon className="w-4 h-4" />
                {format.label}
              </button>
            );
          })}
        </motion.div>

        {/* Builder Area */}
        <div className="flex gap-6 mb-10">
          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1"
          >
            <div className="card p-1 min-h-[500px] flex items-center justify-center overflow-hidden">
              {error ? (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Megaphone className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-sm font-medium text-red-400">Generation failed</p>
                  <p className="text-xs t-muted max-w-sm">{error}</p>
                </div>
              ) : generating ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-500/20 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium t-heading">
                      Crafting your campaign...
                    </p>
                    <p className="text-xs t-muted mt-1">
                      AI is generating your{" "}
                      {FORMATS.find((f) => f.value === selectedFormat)?.label}
                    </p>
                  </div>
                </div>
              ) : resultImage ? (
                <div className="relative w-full h-full">
                  <motion.img
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={resultImage}
                    alt="Generated campaign"
                    className="w-full h-full object-contain rounded-xl"
                  />
                  <div className="absolute bottom-4 right-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-gradient px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg"
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Save Campaign
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 p-12">
                  <div className="w-full max-w-lg aspect-video rounded-2xl border-2 border-dashed b-subtle flex flex-col items-center justify-center gap-4 bg-surface-2/50">
                    <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
                      <Megaphone className="w-8 h-8 t-faint" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium t-heading">
                        Campaign preview will appear here
                      </p>
                      <p className="text-xs t-muted mt-1">
                        Fill in the campaign details and click Generate
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-[320px] flex-shrink-0"
          >
            <div className="card p-5 space-y-4 sticky top-6">
              <h3 className="text-sm font-semibold t-heading uppercase tracking-wider">
                Campaign Details
              </h3>

              {/* Headline */}
              <div>
                <label className="text-xs font-medium t-secondary mb-1.5 block">
                  Headline
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g., Summer Essentials 2026"
                  className="input-base w-full rounded-lg text-sm py-2.5 px-3"
                />
              </div>

              {/* Subheadline */}
              <div>
                <label className="text-xs font-medium t-secondary mb-1.5 block">
                  Subheadline
                </label>
                <input
                  type="text"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="e.g., Discover the new collection"
                  className="input-base w-full rounded-lg text-sm py-2.5 px-3"
                />
              </div>

              {/* CTA */}
              <div>
                <label className="text-xs font-medium t-secondary mb-1.5 block">
                  CTA Text
                </label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="e.g., Shop Now"
                  className="input-base w-full rounded-lg text-sm py-2.5 px-3"
                />
              </div>

              {/* Style */}
              <div>
                <label className="text-xs font-medium t-secondary mb-2 block">
                  Style
                </label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        style === s
                          ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                          : "bg-surface-2 t-secondary border b-subtle hover:bg-wash"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Description */}
              <div>
                <label className="text-xs font-medium t-secondary mb-1.5 block">
                  Product Description
                </label>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Describe the product or collection..."
                  rows={3}
                  className="input-base w-full rounded-lg text-sm py-2.5 px-3 resize-none"
                />
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="text-xs font-medium t-secondary mb-1.5 block">
                  Custom Instructions
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Any additional creative direction..."
                  rows={2}
                  className="input-base w-full rounded-lg text-sm py-2.5 px-3 resize-none"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn-gradient w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Campaign
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Campaign History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold t-heading uppercase tracking-wider">
              Campaign History
            </h3>
            <button
              onClick={() => {
                setResultImage(null);
                setHeadline("");
                setSubheadline("");
                setCtaText("");
                setProductDescription("");
                setCustomPrompt("");
              }}
              className="btn-secondary px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New
            </button>
          </div>

          {loadingCampaigns ? (
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 rounded-xl shimmer" />
              ))}
            </div>
          ) : campaigns.length > 0 ? (
            <div className="grid grid-cols-4 gap-4">
              {campaigns.map((campaign, idx) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="card overflow-hidden group cursor-pointer hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300"
                >
                  <div className="aspect-video bg-surface-2 overflow-hidden">
                    <img
                      src={`${API_BASE_URL}${campaign.thumbnail_url}`}
                      alt={campaign.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="text-xs font-semibold t-heading truncate mb-1">
                      {campaign.name}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="tag text-[10px]">{campaign.format}</span>
                      <span className="text-[10px] t-faint flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {campaign.created_at}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card p-8 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center mb-3">
                <ImageIcon className="w-6 h-6 t-faint" />
              </div>
              <p className="text-sm t-muted">
                No campaigns created yet. Generate your first campaign above.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
