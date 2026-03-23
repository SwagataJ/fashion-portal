"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  ArrowLeftRight,
  Loader2,
  Check,
  AlertTriangle,
  XCircle,
  Send,
  Eye,
  History,
  CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";
import { useVMTowerStore } from "@/store/vmTowerStore";

const EDIT_TYPES = [
  {
    value: "swap_product",
    label: "Swap Product",
    icon: ArrowLeftRight,
    desc: "Replace a product with another",
  },
  {
    value: "adjust_assortment",
    label: "Adjust Assortment",
    icon: ShoppingBag,
    desc: "Change the product mix",
  },
  {
    value: "move_placement",
    label: "Move Placement",
    icon: ArrowLeftRight,
    desc: "Reposition a product in the layout",
  },
];

const VALIDATION_STYLES: Record<string, { bg: string; icon: typeof Check; label: string }> = {
  valid: {
    bg: "bg-green-500/10 border-green-500/30 text-green-400",
    icon: Check,
    label: "Valid",
  },
  warning: {
    bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    icon: AlertTriangle,
    label: "Warning",
  },
  violation: {
    bg: "bg-red-500/10 border-red-500/30 text-red-400",
    icon: XCircle,
    label: "Violation",
  },
};

export default function BuyerFlexMode() {
  const {
    activeIntentId,
    layouts,
    buyerEdits,
    addBuyerEdit,
    setActivePanel,
    intents,
    updateIntent,
  } = useVMTowerStore();

  const [selectedLayoutId, setSelectedLayoutId] = useState<number | null>(null);
  const [editType, setEditType] = useState("swap_product");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"edited" | "original">("edited");
  const [approvingFinal, setApprovingFinal] = useState(false);

  // Form fields for different edit types
  const [originalProduct, setOriginalProduct] = useState("");
  const [replacementProduct, setReplacementProduct] = useState("");
  const [reason, setReason] = useState("");

  if (!activeIntentId) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="w-12 h-12 text-gray-700 mx-auto mb-4" />
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

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLayoutId) return;

    setLoading(true);
    try {
      const editData: Record<string, string> = {
        original_product: originalProduct,
        replacement_product: replacementProduct,
        reason: reason,
      };

      const res = await api.post("/api/vm-tower/buyer-edit", {
        layout_id: selectedLayoutId,
        edit_type: editType,
        edit_data: editData,
      });
      addBuyerEdit(res.data);
      setOriginalProduct("");
      setReplacementProduct("");
      setReason("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approvedLayouts = layouts.filter((l) => l.is_approved === 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold t-heading flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-400" />
            Buyer Mode
          </h2>
          <p className="text-sm t-muted mt-1">
            Make controlled adjustments — AI validates against concept lock
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Version Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-[var(--border-color)]">
            <button
              onClick={() => setViewMode("original")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-all ${
                viewMode === "original"
                  ? "bg-[var(--accent-purple-bg)] text-purple-400 font-medium"
                  : "bg-wash t-muted hover:t-secondary"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              View Original
            </button>
            <button
              onClick={() => setViewMode("edited")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-all ${
                viewMode === "edited"
                  ? "bg-[var(--accent-purple-bg)] text-purple-400 font-medium"
                  : "bg-wash t-muted hover:t-secondary"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              View Edited
            </button>
          </div>

          {/* Approve & Send to VM */}
          <button
            onClick={async () => {
              if (!activeIntentId) return;
              setApprovingFinal(true);
              try {
                const res = await api.patch(`/api/vm-tower/intents/${activeIntentId}/status`, { status: "finalized" });
                updateIntent(res.data);
              } catch (err) { console.error(err); }
              finally { setApprovingFinal(false); }
            }}
            disabled={approvingFinal}
            className="btn-gradient flex items-center gap-2 !py-2 !px-4 text-sm"
          >
            {approvingFinal ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Approve & Send to VM
          </button>
        </div>
      </div>

      {/* View mode indicator */}
      {viewMode === "original" && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-[var(--status-warn-bg)] border border-amber-500/20 text-sm flex items-center gap-2"
        >
          <History className="w-4 h-4 text-amber-400" />
          <span className="t-secondary">Viewing original designer layouts — edits are not reflected in this view</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Edit Form - Left side */}
        <div className="lg:col-span-3 space-y-4">
          {/* Select Layout */}
          <div className="card p-4">
            <label className="text-sm font-medium text-gray-300 mb-3 block">
              Select Layout to Edit
            </label>
            <div className="grid grid-cols-2 gap-2">
              {approvedLayouts.length > 0 ? (
                approvedLayouts.map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => setSelectedLayoutId(layout.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedLayoutId === layout.id
                        ? "bg-purple-600/10 border-purple-500/30 text-purple-300"
                        : "bg-white/3 border-white/10 text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    <div className="text-sm font-semibold">{layout.name}</div>
                    <div className="text-[11px] text-gray-500 capitalize">
                      {layout.layout_type.replace("_", " ")}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500 col-span-2">
                  No approved layouts found. Approve layouts first.
                </p>
              )}
            </div>
          </div>

          {selectedLayoutId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Edit Type */}
              <div className="card p-4 mb-4">
                <label className="text-sm font-medium text-gray-300 mb-3 block">
                  Edit Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EDIT_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setEditType(type.value)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          editType === type.value
                            ? "bg-orange-600/10 border-orange-500/30 text-orange-300"
                            : "bg-white/3 border-white/10 text-gray-400 hover:bg-white/5"
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <div className="text-xs font-semibold">{type.label}</div>
                        <div className="text-[10px] opacity-60 mt-0.5">
                          {type.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSubmitEdit} className="card p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    {editType === "swap_product"
                      ? "Original Product"
                      : editType === "adjust_assortment"
                        ? "Current Assortment"
                        : "Current Position"}
                  </label>
                  <input
                    type="text"
                    value={originalProduct}
                    onChange={(e) => setOriginalProduct(e.target.value)}
                    className="input-base"
                    placeholder={
                      editType === "swap_product"
                        ? "Product to replace"
                        : editType === "adjust_assortment"
                          ? "Current category/mix"
                          : "Current zone/position"
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    {editType === "swap_product"
                      ? "Replacement Product"
                      : editType === "adjust_assortment"
                        ? "New Assortment"
                        : "New Position"}
                  </label>
                  <input
                    type="text"
                    value={replacementProduct}
                    onChange={(e) => setReplacementProduct(e.target.value)}
                    className="input-base"
                    placeholder={
                      editType === "swap_product"
                        ? "New product"
                        : editType === "adjust_assortment"
                          ? "New category/mix"
                          : "Target zone/position"
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="input-base"
                    placeholder="Why is this change needed?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gradient w-full py-3 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI is validating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Edit for Validation
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </div>

        {/* Validation History - Right side */}
        <div className="lg:col-span-2">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-white mb-3">
              Validation History
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {buyerEdits.length > 0 ? (
                buyerEdits.map((edit) => {
                  const style =
                    VALIDATION_STYLES[edit.validation_result || "warning"] ||
                    VALIDATION_STYLES.warning;
                  const Icon = style.icon;

                  return (
                    <motion.div
                      key={edit.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-xl border ${style.bg}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">
                          {style.label}
                        </span>
                        <span className="ml-auto text-[10px] opacity-60 capitalize">
                          {edit.edit_type.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-90">
                        {edit.validation_message}
                      </p>
                      {edit.applied ? (
                        <div className="mt-2 text-[10px] flex items-center gap-1 opacity-60">
                          <Check className="w-3 h-3" /> Applied
                        </div>
                      ) : (
                        <div className="mt-2 text-[10px] flex items-center gap-1 opacity-60">
                          <XCircle className="w-3 h-3" /> Blocked
                        </div>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-600 text-center py-6">
                  No edits submitted yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
