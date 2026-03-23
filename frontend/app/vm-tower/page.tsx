"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Layers,
  Shield,
  ShoppingBag,
  FileText,
  ChevronRight,
  CircleDot,
  Camera,
  Package,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useVMTowerStore, VMTowerPanel, WorkflowStatus } from "@/store/vmTowerStore";
import DesignIntentPanel from "./components/DesignIntentPanel";
import LayoutCanvas from "./components/LayoutCanvas";
import VMBuilderCanvas from "./components/VMBuilderCanvas";
import ConceptLockPanel from "./components/ConceptLockPanel";
import BuyerFlexMode from "./components/BuyerFlexMode";
import VMOutputPanel from "./components/VMOutputPanel";
import ShootPlanPanel from "./components/ShootPlanPanel";
import api from "@/lib/api";

const PANELS: {
  id: VMTowerPanel;
  label: string;
  icon: typeof Sparkles;
  color: string;
}[] = [
  {
    id: "design-intent",
    label: "Design Intent",
    icon: Sparkles,
    color: "text-purple-400",
  },
  {
    id: "vm-builder",
    label: "VM Builder",
    icon: Layers,
    color: "text-blue-400",
  },
  {
    id: "layout-canvas",
    label: "Products & Fixtures",
    icon: Package,
    color: "text-teal-400",
  },
  {
    id: "concept-lock",
    label: "Concept Lock",
    icon: Shield,
    color: "text-emerald-400",
  },
  {
    id: "buyer-flex",
    label: "Buyer Flex",
    icon: ShoppingBag,
    color: "text-orange-400",
  },
  {
    id: "vm-output",
    label: "VM Output",
    icon: FileText,
    color: "text-cyan-400",
  },
  {
    id: "shoot-plan",
    label: "Shoot Plan",
    icon: Camera,
    color: "text-orange-400",
  },
];

const WORKFLOW_STEPS: { status: WorkflowStatus; label: string }[] = [
  { status: "intent_defined", label: "Intent Defined" },
  { status: "ai_layout_suggested", label: "AI Layout" },
  { status: "designer_approved", label: "Approved" },
  { status: "concept_locked", label: "Locked" },
  { status: "buyer_editing", label: "Buyer Edit" },
  { status: "finalized", label: "Finalized" },
  { status: "vm_ready", label: "VM Ready" },
];

export default function VMTowerPage() {
  const { isLoading: loading } = useAuth();
  const {
    activePanel,
    setActivePanel,
    activeIntentId,
    intents,
    setIntents,
    setLayouts,
    setProducts,
    setConceptLock,
    setGuidelines,
    setShootPlan,
  } = useVMTowerStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/api/vm-tower/intents");
        setIntents(res.data);
      } catch {
        // silent
      }
    };
    fetchData();
  }, [setIntents]);

  useEffect(() => {
    if (!activeIntentId) return;

    const fetchIntentData = async () => {
      try {
        const [layoutsRes, productsRes] = await Promise.all([
          api.get(`/api/vm-tower/intents/${activeIntentId}/layouts`),
          api.get(`/api/vm-tower/intents/${activeIntentId}/products`),
        ]);
        setLayouts(layoutsRes.data);
        setProducts(productsRes.data);

        try {
          const lockRes = await api.get(
            `/api/vm-tower/intents/${activeIntentId}/concept-lock`
          );
          setConceptLock(lockRes.data);
        } catch {
          setConceptLock(null);
        }

        try {
          const guidelinesRes = await api.get(
            `/api/vm-tower/intents/${activeIntentId}/guidelines`
          );
          if (guidelinesRes.data) {
            setGuidelines(guidelinesRes.data);
          }
        } catch {
          setGuidelines(null);
        }

        try {
          const shootRes = await api.get(
            `/api/vm-tower/intents/${activeIntentId}/shoot-plan`
          );
          if (shootRes.data) {
            setShootPlan(shootRes.data);
          }
        } catch {
          setShootPlan(null);
        }
      } catch {
        // silent
      }
    };
    fetchIntentData();
  }, [activeIntentId, setLayouts, setProducts, setConceptLock, setGuidelines]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeIntent = intents.find((i) => i.id === activeIntentId);
  const currentStatus = activeIntent?.status || "intent_defined";
  const currentStepIndex = WORKFLOW_STEPS.findIndex(
    (s) => s.status === currentStatus
  );

  const renderPanel = () => {
    switch (activePanel) {
      case "design-intent":
        return <DesignIntentPanel />;
      case "vm-builder":
        return <VMBuilderCanvas />;
      case "layout-canvas":
        return <LayoutCanvas />;
      case "concept-lock":
        return <ConceptLockPanel />;
      case "buyer-flex":
        return <BuyerFlexMode />;
      case "vm-output":
        return <VMOutputPanel />;
      case "shoot-plan":
        return <ShootPlanPanel />;
      default:
        return <DesignIntentPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-primary">
      <Sidebar />
      <div className="ml-60">
        {/* Top Bar */}
        <div className="border-b border-theme topbar-themed sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold t-heading flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  Visual Merchandising Control Tower
                </h1>
                {activeIntent && (
                  <p className="text-xs t-muted mt-1 ml-10">
                    {activeIntent.theme} · {activeIntent.season}
                  </p>
                )}
              </div>

              {/* Workflow Progress */}
              {activeIntent && (
                <div className="flex items-center gap-1">
                  {WORKFLOW_STEPS.map((step, i) => {
                    const isCompleted = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;

                    return (
                      <div key={step.status} className="flex items-center">
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-all ${
                            isCurrent
                              ? "workflow-step current"
                              : isCompleted
                                ? "workflow-step completed"
                                : "workflow-step"
                          }`}
                        >
                          <CircleDot
                            className={`w-2.5 h-2.5 ${
                              isCurrent
                                ? "text-purple-500"
                                : isCompleted
                                  ? "text-green-500"
                                  : "t-disabled"
                            }`}
                          />
                          {step.label}
                        </div>
                        {i < WORKFLOW_STEPS.length - 1 && (
                          <ChevronRight
                            className={`w-3 h-3 mx-0.5 ${
                              isCompleted ? "workflow-chevron active" : "workflow-chevron"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Panel Navigation */}
            <div className="flex gap-1">
              {PANELS.map((panel) => {
                const Icon = panel.icon;
                const isActive = activePanel === panel.id;

                return (
                  <button
                    key={panel.id}
                    onClick={() => setActivePanel(panel.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                      isActive
                        ? "nav-item active font-medium"
                        : "nav-item"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${isActive ? panel.color : "t-muted"}`}
                    />
                    {panel.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel Content */}
        <div className="p-6">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderPanel()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
