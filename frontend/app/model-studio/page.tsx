"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Sparkles,
  Loader2,
  Download,
  Check,
  ImageIcon,
  Wand2,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

const GENDERS = ["Female", "Male", "Non-binary"];
const AGE_RANGES = ["18-24", "25-30", "31-40", "40+"];
const ETHNICITIES = [
  "Caucasian",
  "South Asian",
  "East Asian",
  "Black",
  "Hispanic",
  "Middle Eastern",
  "Diverse",
];
const POSES = [
  { value: "standing", label: "Standing", icon: "🧍" },
  { value: "walking", label: "Walking", icon: "🚶" },
  { value: "seated", label: "Seated", icon: "🪑" },
  { value: "editorial", label: "Editorial", icon: "📸" },
  { value: "dynamic", label: "Dynamic", icon: "💃" },
];
const BODY_TYPES = ["Slim", "Athletic", "Curvy", "Plus-size"];
const EXPRESSIONS = ["Natural", "Confident", "Joyful", "Serious", "Playful"];
const HAIR_STYLES = ["Short", "Medium", "Long", "Updo", "Natural"];
const SHOOT_MOODS = ["Editorial", "E-commerce", "Lifestyle", "Street", "Luxury"];

interface GeneratedModel {
  id: string;
  image_url: string;
  prompt_used: string;
}

interface Filters {
  gender: string;
  age_range: string;
  ethnicity: string[];
  pose: string;
  body_type: string;
  expression: string;
  hair: string;
  shoot_mood: string;
}

function PillGroup({
  options,
  selected,
  onSelect,
  multi = false,
}: {
  options: string[];
  selected: string | string[];
  onSelect: (val: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = multi
          ? (selected as string[]).includes(opt)
          : selected === opt;
        return (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                : "bg-surface-2 t-secondary hover:bg-wash border b-subtle"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function ModelStudioPage() {
  const { isLoading } = useAuth();
  const [filters, setFilters] = useState<Filters>({
    gender: "Female",
    age_range: "25-30",
    ethnicity: [],
    pose: "standing",
    body_type: "Athletic",
    expression: "Natural",
    hair: "Long",
    shoot_mood: "Editorial",
  });
  const [results, setResults] = useState<GeneratedModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleEthnicity = (eth: string) => {
    setFilters((prev) => ({
      ...prev,
      ethnicity: prev.ethnicity.includes(eth)
        ? prev.ethnicity.filter((e) => e !== eth)
        : [...prev.ethnicity, eth],
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await api.post("/api/model-studio/generate", filters);
      const newModel: GeneratedModel = {
        id: Date.now().toString(),
        image_url: response.data.image_url,
        prompt_used: response.data.prompt_used,
      };
      setResults((prev) => [newModel, ...prev]);
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
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
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold t-heading">Model Studio</h1>
              <p className="text-sm t-muted">
                Select and generate AI fashion models for your shoots
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-6">
          {/* Filter Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="w-[300px] flex-shrink-0"
          >
            <div className="card p-5 space-y-5 sticky top-6">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold t-heading">Model Configuration</h3>
              </div>

              {/* Gender */}
              <div>
                <label className="text-xs font-medium t-secondary mb-2 block uppercase tracking-wider">
                  Gender
                </label>
                <PillGroup
                  options={GENDERS}
                  selected={filters.gender}
                  onSelect={(v) => updateFilter("gender", v)}
                />
              </div>

              {/* Age Range */}
              <div>
                <label className="text-xs font-medium t-secondary mb-2 block uppercase tracking-wider">
                  Age Range
                </label>
                <PillGroup
                  options={AGE_RANGES}
                  selected={filters.age_range}
                  onSelect={(v) => updateFilter("age_range", v)}
                />
              </div>

              {/* Ethnicity */}
              <div>
                <label className="text-xs font-medium t-secondary mb-2 block uppercase tracking-wider">
                  Ethnicity
                </label>
                <PillGroup
                  options={ETHNICITIES}
                  selected={filters.ethnicity}
                  onSelect={toggleEthnicity}
                  multi
                />
              </div>

              {/* Pose */}
              <div>
                <label className="text-xs font-medium t-secondary mb-2 block uppercase tracking-wider">
                  Pose
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {POSES.map((pose) => (
                    <button
                      key={pose.value}
                      onClick={() => updateFilter("pose", pose.value)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                        filters.pose === pose.value
                          ? "bg-gradient-to-br from-purple-600/20 to-pink-500/20 border-2 border-purple-500 t-heading"
                          : "bg-surface-2 border b-subtle t-secondary hover:bg-wash"
                      }`}
                    >
                      <span className="text-lg">{pose.icon}</span>
                      <span>{pose.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Type */}
              <div>
                <label className="text-xs font-medium t-secondary mb-2 block uppercase tracking-wider">
                  Body Type
                </label>
                <PillGroup
                  options={BODY_TYPES}
                  selected={filters.body_type}
                  onSelect={(v) => updateFilter("body_type", v)}
                />
              </div>

              {/* Expression */}
              <div>
                <label className="text-xs font-medium t-secondary mb-2 block uppercase tracking-wider">
                  Expression
                </label>
                <PillGroup
                  options={EXPRESSIONS}
                  selected={filters.expression}
                  onSelect={(v) => updateFilter("expression", v)}
                />
              </div>

              {/* Hair */}
              <div>
                <label className="text-xs font-medium t-secondary mb-2 block uppercase tracking-wider">
                  Hair Style
                </label>
                <PillGroup
                  options={HAIR_STYLES}
                  selected={filters.hair}
                  onSelect={(v) => updateFilter("hair", v)}
                />
              </div>

              {/* Shoot Mood */}
              <div>
                <label className="text-xs font-medium t-secondary mb-2 block uppercase tracking-wider">
                  Shoot Mood
                </label>
                <PillGroup
                  options={SHOOT_MOODS}
                  selected={filters.shoot_mood}
                  onSelect={(v) => updateFilter("shoot_mood", v)}
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-gradient w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Model
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Results Gallery */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold t-heading uppercase tracking-wider">
                Generated Models
              </h3>
              {results.length > 0 && (
                <span className="text-xs t-muted">
                  {results.length} model{results.length !== 1 ? "s" : ""} generated
                </span>
              )}
            </div>

            {loading && results.length === 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-xl shimmer"
                  />
                ))}
              </div>
            ) : results.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32"
              >
                <div className="w-20 h-20 rounded-2xl bg-surface-2 flex items-center justify-center mb-6">
                  <ImageIcon className="w-10 h-10 t-faint" />
                </div>
                <h3 className="text-lg font-semibold t-heading mb-2">
                  No models generated yet
                </h3>
                <p className="text-sm t-muted text-center max-w-sm">
                  Configure your ideal model parameters on the left panel and click
                  "Generate Model" to create AI fashion models for your shoots.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="aspect-[3/4] rounded-xl shimmer"
                    />
                  )}
                  {results.map((model, idx) => (
                    <motion.div
                      key={model.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group relative aspect-[3/4] rounded-xl overflow-hidden card cursor-pointer"
                      onClick={() => setSelectedModel(model.id)}
                    >
                      <img
                        src={`http://localhost:8000${model.image_url}`}
                        alt="Generated model"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <div className="flex items-center justify-between w-full">
                          <button className="btn-gradient px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            Use in Shoot
                          </button>
                          <button className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                            <Download className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                      {selectedModel === model.id && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
