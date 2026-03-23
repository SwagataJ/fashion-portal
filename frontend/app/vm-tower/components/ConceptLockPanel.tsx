"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Unlock,
  Shield,
  Loader2,
  AlertTriangle,
  Check,
  Sparkles,
  Send,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import api from "@/lib/api";
import { useVMTowerStore } from "@/store/vmTowerStore";

const FLEXIBILITY_LEVELS = [
  {
    value: "strict",
    label: "Strict",
    desc: "Minimal changes allowed. AI will flag most edits.",
    color: "border-red-500/30 bg-red-500/10 text-red-400",
  },
  {
    value: "moderate",
    label: "Moderate",
    desc: "Balanced flexibility. AI validates impact of changes.",
    color: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  {
    value: "flexible",
    label: "Flexible",
    desc: "High flexibility. AI only blocks major violations.",
    color: "border-green-500/30 bg-green-500/10 text-green-400",
  },
];

export default function ConceptLockPanel() {
  const {
    activeIntentId,
    conceptLock,
    setConceptLock,
    intents,
    updateIntent,
    setActivePanel,
  } = useVMTowerStore();

  const [loading, setLoading] = useState(false);
  const [flexibility, setFlexibility] = useState("moderate");
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [lockHeroLooks, setLockHeroLooks] = useState(true);
  const [allowFlexEditing, setAllowFlexEditing] = useState(true);
  const [sending, setSending] = useState(false);

  const activeIntent = intents.find((i) => i.id === activeIntentId);

  const handleActivateLock = async () => {
    if (!activeIntentId) return;
    setLoading(true);
    try {
      const res = await api.post("/api/vm-tower/concept-lock", {
        intent_id: activeIntentId,
        flexibility_level: flexibility,
      });
      setConceptLock(res.data);
      if (activeIntent) {
        updateIntent({ ...activeIntent, status: "concept_locked" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateLock = async () => {
    if (!activeIntentId) return;
    setLoading(true);
    try {
      await api.delete(`/api/vm-tower/intents/${activeIntentId}/concept-lock`);
      setConceptLock(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLock = async () => {
    if (!activeIntentId) return;
    try {
      const res = await api.get(
        `/api/vm-tower/intents/${activeIntentId}/concept-lock`
      );
      setConceptLock(res.data);
    } catch {
      setConceptLock(null);
    }
  };

  const handleSendToBuyer = async () => {
    if (!activeIntentId) return;
    setSending(true);
    try {
      const res = await api.post(`/api/vm-tower/intents/${activeIntentId}/send-to-buyer`, {
        intent_id: activeIntentId,
        lock_hero_looks: lockHeroLooks,
        allow_flexible_editing: allowFlexEditing,
      });
      updateIntent(res.data);
      setShowSendDialog(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!activeIntentId) {
    return (
      <div className="text-center py-16">
        <Shield className="w-12 h-12 text-gray-700 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-400 mb-2">
          No Design Intent Selected
        </h3>
        <button
          onClick={() => setActivePanel("design-intent")}
          className="btn-gradient px-6 py-2.5 text-sm"
        >
          Go to Design Intent
        </button>
      </div>
    );
  }

  const renderRules = (
    rules: Record<string, unknown> | null,
    title: string,
    icon: React.ReactNode
  ) => {
    if (!rules) return null;
    const ruleList = (rules as any).rules || [];
    const tolerance = (rules as any).tolerance;

    return (
      <div className="p-4 bg-white/3 border border-white/5 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          {tolerance !== undefined && (
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
              ±{tolerance}% tolerance
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          {Array.isArray(ruleList)
            ? ruleList.map((rule: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-gray-300"
                >
                  <Check className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>{rule}</span>
                </div>
              ))
            : typeof ruleList === "object" &&
              Object.entries(ruleList).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-start gap-2 text-xs text-gray-300"
                >
                  <Check className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-gray-200 capitalize">
                      {key.replace("_", " ")}:
                    </strong>{" "}
                    {String(val)}
                  </span>
                </div>
              ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Concept Lock
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Protect design intent while enabling controlled flexibility
          </p>
        </div>
        <button
          onClick={fetchLock}
          className="px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
        >
          Refresh
        </button>
      </div>

      {conceptLock && conceptLock.is_active ? (
        /* Active Lock View */
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Concept Lock Active
                </h3>
                <p className="text-sm text-gray-400">
                  Flexibility:{" "}
                  <span className="text-purple-400 capitalize">
                    {conceptLock.flexibility_level}
                  </span>
                </p>
              </div>
              <button
                onClick={handleDeactivateLock}
                disabled={loading}
                className="ml-auto px-4 py-2 text-sm rounded-lg bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30 transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
                Deactivate Lock
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderRules(
                conceptLock.color_continuity_rules,
                "Color Continuity",
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400" />
                </div>
              )}
              {renderRules(
                conceptLock.focal_hierarchy_rules,
                "Focal Hierarchy",
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                </div>
              )}
              {renderRules(
                conceptLock.category_balance_rules,
                "Category Balance",
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
              )}
              {renderRules(
                conceptLock.placement_rules,
                "Placement Rules",
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Shield className="w-3 h-3 text-purple-400" />
                </div>
              )}
            </div>
          </motion.div>

          <div className="flex gap-3">
            <button
              onClick={() => setActivePanel("buyer-flex")}
              className="btn-gradient px-6 py-2.5 text-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Enter Buyer Flex Mode
            </button>
            <button
              onClick={() => setShowSendDialog(true)}
              className="px-6 py-2.5 text-sm rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send to Buyer
            </button>
          </div>

          {/* Send to Buyer Dialog */}
          {showSendDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="modal-content rounded-2xl p-6 w-full max-w-md mx-4"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold t-heading flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-400" />
                    Send to Buyer?
                  </h3>
                  <button onClick={() => setShowSendDialog(false)} className="t-muted hover:t-primary">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm t-muted mb-5">
                  Send approved layouts to the buyer for review. Choose what the buyer can and cannot change.
                </p>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => setLockHeroLooks(!lockHeroLooks)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-wash border border-[var(--border-color)] hover:bg-wash-2 transition-colors text-left"
                  >
                    {lockHeroLooks ? (
                      <CheckSquare className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 t-disabled flex-shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-medium t-heading">Lock Hero Looks</div>
                      <div className="text-[11px] t-muted">Hero product positions cannot be changed by the buyer</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setAllowFlexEditing(!allowFlexEditing)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-wash border border-[var(--border-color)] hover:bg-wash-2 transition-colors text-left"
                  >
                    {allowFlexEditing ? (
                      <CheckSquare className="w-5 h-5 text-green-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 t-disabled flex-shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-medium t-heading">Allow Flexible Editing</div>
                      <div className="text-[11px] t-muted">Buyer can swap products and adjust non-hero positions</div>
                    </div>
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSendDialog(false)}
                    className="btn-secondary flex-1 !py-2.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendToBuyer}
                    disabled={sending}
                    className="btn-gradient flex-1 flex items-center justify-center gap-2 !py-2.5"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Confirm & Send
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      ) : (
        /* Activate Lock View */
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Unlock className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Activate Concept Lock
              </h3>
              <p className="text-sm text-gray-400">
                Convert design intent into enforceable constraints
              </p>
            </div>
          </div>

          {/* Flexibility Level */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-300 mb-3 block">
              Flexibility Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {FLEXIBILITY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setFlexibility(level.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    flexibility === level.value
                      ? level.color + " ring-1 ring-current"
                      : "bg-white/3 border-white/10 text-gray-400 hover:bg-white/5"
                  }`}
                >
                  <div className="text-sm font-semibold mb-1">
                    {level.label}
                  </div>
                  <div className="text-[11px] opacity-70">{level.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleActivateLock}
            disabled={loading}
            className="btn-gradient px-6 py-3 text-sm flex items-center gap-2 w-full justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI is generating constraints...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Activate Concept Lock
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
