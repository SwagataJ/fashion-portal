import { create } from "zustand";
import { persist } from "zustand/middleware";

export type VMTowerPanel =
  | "design-intent"
  | "vm-builder"
  | "layout-canvas"
  | "concept-lock"
  | "buyer-flex"
  | "vm-output"
  | "shoot-plan";

export type WorkflowStatus =
  | "intent_defined"
  | "ai_layout_suggested"
  | "designer_approved"
  | "concept_locked"
  | "buyer_editing"
  | "finalized"
  | "vm_ready";

export interface DesignIntent {
  id: number;
  theme: string;
  season: string;
  color_flow: string[];
  key_piece_priority: { sku: string; name: string; priority: number }[];
  styling_rules: string[];
  category_mix: Record<string, number>;
  target_store_type: string;
  visual_mood: string;
  ai_context_summary: string | null;
  status: WorkflowStatus;
  created_at: string | null;
}

export interface Product {
  id: number;
  intent_id: number;
  sku: string;
  name: string;
  category: string | null;
  color: string | null;
  fabric: string | null;
  image_url: string | null;
  attributes: Record<string, unknown> | null;
}

export interface VMLayout {
  id: number;
  intent_id: number;
  layout_type: string;
  name: string;
  placement_plan: Record<string, unknown> | null;
  product_grouping: unknown[] | null;
  reasoning: string | null;
  mockup_image_url: string | null;
  mockup_prompt: string | null;
  zone_data: Record<string, ZonePlacement[]> | null;
  is_approved: number;
  version: number;
  created_at: string | null;
}

export interface ZonePlacement {
  product_id: number;
  position: number;
  product_name?: string;
  image_url?: string;
}

export interface LayoutVersion {
  id: number;
  layout_id: number;
  version_number: number;
  label: string;
  zone_data: Record<string, ZonePlacement[]> | null;
  placement_plan: Record<string, unknown> | null;
  product_grouping: unknown[] | null;
  created_at: string | null;
}

export interface ShootPlan {
  id: number;
  intent_id: number;
  outfit_combinations: { look_number: number; products: string[]; styling_notes: string }[] | null;
  styling_instructions: string | null;
  checklist: { item: string; category?: string; completed?: boolean }[] | null;
  shot_sequence: { shot_number: number; zone: string; angle: string; products?: string[]; notes: string }[] | null;
  created_at: string | null;
}

export interface OutfitRecommendation {
  look_name: string;
  product_ids: number[];
  product_names: string[];
  styling_note: string;
  confidence: number;
  tags: string[];
}

export interface ConceptLock {
  id: number;
  intent_id: number;
  color_continuity_rules: Record<string, unknown> | null;
  focal_hierarchy_rules: Record<string, unknown> | null;
  category_balance_rules: Record<string, unknown> | null;
  placement_rules: Record<string, unknown> | null;
  flexibility_level: string;
  is_active: number;
}

export interface BuyerEdit {
  id: number;
  layout_id: number;
  edit_type: string;
  edit_data: Record<string, unknown>;
  validation_result: string | null;
  validation_message: string | null;
  applied: number;
  created_at: string | null;
}

export interface VMGuideline {
  id: number;
  intent_id: number;
  vm_instruction_sheet: string | null;
  shoot_team_shot_list: string | null;
  styling_notes: string | null;
  placement_guide: string | null;
  concept_explanation: string | null;
}

interface VMTowerStore {
  activePanel: VMTowerPanel;
  setActivePanel: (panel: VMTowerPanel) => void;

  // Current intent
  activeIntentId: number | null;
  setActiveIntentId: (id: number | null) => void;

  // Intents list (cached)
  intents: DesignIntent[];
  setIntents: (intents: DesignIntent[]) => void;
  addIntent: (intent: DesignIntent) => void;
  updateIntent: (intent: DesignIntent) => void;

  // Products
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProducts: (products: Product[]) => void;

  // Layouts
  layouts: VMLayout[];
  setLayouts: (layouts: VMLayout[]) => void;
  updateLayout: (layout: VMLayout) => void;

  // Concept Lock
  conceptLock: ConceptLock | null;
  setConceptLock: (lock: ConceptLock | null) => void;

  // Buyer Edits
  buyerEdits: BuyerEdit[];
  addBuyerEdit: (edit: BuyerEdit) => void;

  // Guidelines
  guidelines: VMGuideline | null;
  setGuidelines: (guidelines: VMGuideline | null) => void;

  // Shoot Plan
  shootPlan: ShootPlan | null;
  setShootPlan: (plan: ShootPlan | null) => void;

  // Reset
  resetStore: () => void;
}

export const useVMTowerStore = create<VMTowerStore>()(
  persist(
    (set) => ({
      activePanel: "design-intent",
      setActivePanel: (panel) => set({ activePanel: panel }),

      activeIntentId: null,
      setActiveIntentId: (id) => set({ activeIntentId: id }),

      intents: [],
      setIntents: (intents) => set({ intents }),
      addIntent: (intent) =>
        set((s) => ({ intents: [intent, ...s.intents] })),
      updateIntent: (intent) =>
        set((s) => ({
          intents: s.intents.map((i) => (i.id === intent.id ? intent : i)),
        })),

      products: [],
      setProducts: (products) => set({ products }),
      addProducts: (products) =>
        set((s) => ({ products: [...s.products, ...products] })),

      layouts: [],
      setLayouts: (layouts) => set({ layouts }),
      updateLayout: (layout) =>
        set((s) => ({
          layouts: s.layouts.map((l) => (l.id === layout.id ? layout : l)),
        })),

      conceptLock: null,
      setConceptLock: (lock) => set({ conceptLock: lock }),

      buyerEdits: [],
      addBuyerEdit: (edit) =>
        set((s) => ({ buyerEdits: [edit, ...s.buyerEdits] })),

      guidelines: null,
      setGuidelines: (guidelines) => set({ guidelines }),

      shootPlan: null,
      setShootPlan: (plan) => set({ shootPlan: plan }),

      resetStore: () =>
        set({
          activePanel: "design-intent",
          activeIntentId: null,
          intents: [],
          products: [],
          layouts: [],
          conceptLock: null,
          buyerEdits: [],
          guidelines: null,
          shootPlan: null,
        }),
    }),
    {
      name: "vm-tower-storage",
      partialize: (state) => ({
        activeIntentId: state.activeIntentId,
        activePanel: state.activePanel,
      }),
    }
  )
);
