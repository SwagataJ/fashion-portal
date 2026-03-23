"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Camera,
  Shirt,
  Map,
  BookOpen,
  Loader2,
  Sparkles,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "@/lib/api";
import { useVMTowerStore } from "@/store/vmTowerStore";

const GUIDELINE_SECTIONS = [
  {
    key: "vm_instruction_sheet",
    label: "VM Instruction Sheet",
    icon: FileText,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
  },
  {
    key: "shoot_team_shot_list",
    label: "Shoot Team Shot List",
    icon: Camera,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10 border-pink-500/20",
  },
  {
    key: "styling_notes",
    label: "Styling Notes",
    icon: Shirt,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-500/20",
  },
  {
    key: "placement_guide",
    label: "Placement Guide",
    icon: Map,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    key: "concept_explanation",
    label: "Concept Explanation",
    icon: BookOpen,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
  },
];

export default function VMOutputPanel() {
  const {
    activeIntentId,
    guidelines,
    setGuidelines,
    intents,
    updateIntent,
    setActivePanel,
  } = useVMTowerStore();

  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "vm_instruction_sheet"
  );

  const activeIntent = intents.find((i) => i.id === activeIntentId);

  const handleGenerate = async () => {
    if (!activeIntentId) return;
    setLoading(true);
    try {
      const res = await api.post(
        `/api/vm-tower/intents/${activeIntentId}/guidelines`
      );
      setGuidelines(res.data);
      if (activeIntent) {
        updateIntent({ ...activeIntent, status: "vm_ready" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuidelines = async () => {
    if (!activeIntentId) return;
    try {
      const res = await api.get(
        `/api/vm-tower/intents/${activeIntentId}/guidelines`
      );
      if (res.data) {
        setGuidelines(res.data);
      }
    } catch {
      // silent
    }
  };

  const handleFinalizeAndGenerate = async () => {
    if (!activeIntentId) return;
    try {
      await api.patch(`/api/vm-tower/intents/${activeIntentId}/status`, {
        status: "finalized",
      });
      if (activeIntent) {
        updateIntent({ ...activeIntent, status: "finalized" });
      }
      await handleGenerate();
    } catch (err) {
      console.error(err);
    }
  };

  if (!activeIntentId) {
    return (
      <div className="text-center py-16">
        <FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
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

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("# ")) {
        return (
          <h2 key={i} className="text-lg font-bold text-white mt-4 mb-2">
            {line.replace("# ", "")}
          </h2>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={i} className="text-md font-semibold text-gray-200 mt-3 mb-1.5">
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h4 key={i} className="text-sm font-semibold text-gray-300 mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={i} className="text-sm text-gray-400 ml-4 list-disc">
            {line.replace(/^[-*] /, "")}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={i} className="text-sm text-gray-400 ml-4 list-decimal">
            {line.replace(/^\d+\.\s/, "")}
          </li>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={i} className="text-sm font-semibold text-gray-200 mt-1">
            {line.replace(/\*\*/g, "")}
          </p>
        );
      }
      if (line.trim() === "") {
        return <div key={i} className="h-2" />;
      }
      return (
        <p key={i} className="text-sm text-gray-400 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            VM Output
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Auto-generated VM guidelines, shot lists, and styling notes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchGuidelines}
            className="px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={handleFinalizeAndGenerate}
            disabled={loading}
            className="btn-gradient px-4 py-2 text-sm flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Finalize & Generate
              </>
            )}
          </button>
        </div>
      </div>

      {guidelines ? (
        <div className="space-y-3">
          {GUIDELINE_SECTIONS.map((section) => {
            const Icon = section.icon;
            const content = (guidelines as any)[section.key];
            if (!content) return null;

            const isExpanded = expandedSection === section.key;

            return (
              <motion.div
                key={section.key}
                layout
                className="card overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedSection(isExpanded ? null : section.key)
                  }
                  className="w-full p-4 flex items-center gap-3 hover:bg-white/3 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${section.bgColor} border flex items-center justify-center`}
                  >
                    <Icon className={`w-4 h-4 ${section.color}`} />
                  </div>
                  <span className="text-sm font-semibold text-white flex-1 text-left">
                    {section.label}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-1 border-t border-white/5">
                        <div className="prose-sm max-w-none">
                          {renderContent(content)}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-12 card">
            <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-400 mb-2">
              No Guidelines Generated Yet
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Finalize your layouts and generate comprehensive VM guidelines
            </p>
            <button
              onClick={handleFinalizeAndGenerate}
              className="btn-gradient px-6 py-2.5 text-sm"
            >
              Generate VM Guidelines
            </button>
          </div>
        )
      )}

      {loading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            AI is generating comprehensive VM guidelines...
          </p>
          <p className="text-xs text-gray-600 mt-1">
            This includes instruction sheets, shot lists, styling notes, and more
          </p>
        </div>
      )}
    </div>
  );
}
