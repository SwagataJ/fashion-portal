"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Loader2,
  CheckCircle2,
  Circle,
  Shirt,
  MapPin,
  ClipboardList,
  Sparkles,
  Download,
  Share2,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import { useVMTowerStore } from "@/store/vmTowerStore";

export default function ShootPlanPanel() {
  const { activeIntentId, shootPlan, setShootPlan, intents, layouts, products } =
    useVMTowerStore();
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checklistState, setChecklistState] = useState<Record<number, boolean>>({});

  const activeIntent = intents.find((i) => i.id === activeIntentId);

  const handleGenerate = async () => {
    if (!activeIntentId) return;
    setGenerating(true);
    try {
      const res = await api.post(`/api/vm-tower/intents/${activeIntentId}/shoot-plan`);
      setShootPlan(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!activeIntentId) return;
    try {
      const res = await api.post(`/api/vm-tower/intents/${activeIntentId}/export`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vm-plan-${activeIntent?.theme || "export"}-${activeIntent?.season || ""}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/vm-tower?intent=${activeIntentId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleChecklist = (idx: number) => {
    setChecklistState((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!activeIntentId) {
    return (
      <div className="text-center py-20">
        <Camera className="w-12 h-12 t-disabled mx-auto mb-3" />
        <p className="t-muted text-sm">Select a design intent to generate a shoot plan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold t-heading flex items-center gap-2">
            <Camera className="w-5 h-5 text-orange-400" />
            Shoot Plan & Execution
          </h2>
          <p className="text-sm t-muted mt-1">
            Convert your VM layouts into actionable shoot plans with outfit combos and checklists
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2 !py-2 !px-4 text-sm">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={handleCopyLink} className="btn-secondary flex items-center gap-2 !py-2 !px-4 text-sm">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Copied!" : "Share Link"}
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-gradient flex items-center gap-2 !py-2 !px-5 text-sm"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : shootPlan ? (
              <>
                <RefreshCw className="w-4 h-4" /> Regenerate
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate Shoot Plan
              </>
            )}
          </button>
        </div>
      </div>

      {!shootPlan ? (
        <div className="section-container p-12 text-center">
          <Camera className="w-16 h-16 t-disabled mx-auto mb-4" />
          <h3 className="text-lg font-semibold t-heading mb-2">No Shoot Plan Yet</h3>
          <p className="t-muted text-sm mb-6 max-w-md mx-auto">
            Generate a structured shoot plan from your approved layouts. Includes outfit combinations,
            styling instructions, shot sequences, and a production checklist.
          </p>
          <button onClick={handleGenerate} disabled={generating} className="btn-gradient !px-8 !py-3">
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4 inline mr-2" />Generate Shoot Plan</>
            )}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Outfit Combinations */}
          <div className="section-container p-5">
            <h3 className="text-sm font-semibold t-heading flex items-center gap-2 mb-4">
              <Shirt className="w-4 h-4 text-purple-400" />
              Outfit Combinations
            </h3>
            <div className="space-y-3">
              {(shootPlan.outfit_combinations || []).map((combo, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-xl bg-wash border border-[var(--border-color)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold t-heading">
                      Look {combo.look_number}
                    </span>
                    <span className="text-[10px] tag">{combo.products?.length || 0} items</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(combo.products || []).map((p, j) => (
                      <span key={j} className="text-[11px] px-2 py-0.5 rounded-md bg-purple-600/10 text-purple-400 border border-purple-500/20">
                        {p}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] t-muted">{combo.styling_notes}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Shot Sequence */}
          <div className="section-container p-5">
            <h3 className="text-sm font-semibold t-heading flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-blue-400" />
              Shot Sequence
            </h3>
            <div className="space-y-2">
              {(shootPlan.shot_sequence || []).map((shot, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-wash border border-[var(--border-color)]"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {shot.shot_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold t-heading">{shot.zone}</span>
                      <span className="text-[10px] tag">{shot.angle}</span>
                    </div>
                    <p className="text-[11px] t-muted">{shot.notes}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Styling Instructions */}
          <div className="section-container p-5">
            <h3 className="text-sm font-semibold t-heading flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-pink-400" />
              Styling Instructions
            </h3>
            <div className="ai-summary-block p-4 text-sm leading-relaxed">
              {shootPlan.styling_instructions || "No instructions generated."}
            </div>
          </div>

          {/* Checklist */}
          <div className="section-container p-5">
            <h3 className="text-sm font-semibold t-heading flex items-center gap-2 mb-4">
              <ClipboardList className="w-4 h-4 text-emerald-400" />
              Production Checklist
              <span className="ml-auto text-[10px] tag">
                {Object.values(checklistState).filter(Boolean).length}/{(shootPlan.checklist || []).length} done
              </span>
            </h3>
            <div className="space-y-1.5">
              {(shootPlan.checklist || []).map((item, i) => (
                <button
                  key={i}
                  onClick={() => toggleChecklist(i)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                    checklistState[i]
                      ? "bg-[var(--status-valid-bg)] line-through"
                      : "bg-wash hover:bg-wash-2"
                  }`}
                >
                  {checklistState[i] ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 t-disabled flex-shrink-0" />
                  )}
                  <span className={`text-xs flex-1 ${checklistState[i] ? "t-muted" : "t-secondary"}`}>
                    {item.item}
                  </span>
                  {item.category && (
                    <span className="text-[9px] tag">{item.category}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
