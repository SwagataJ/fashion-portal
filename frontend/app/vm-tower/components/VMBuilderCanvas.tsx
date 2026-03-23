"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid3X3,
  SquareStack,
  Package,
  X,
  Sparkles,
  Loader2,
  Plus,
  GripHorizontal,
} from "lucide-react";
import api from "@/lib/api";
import { useVMTowerStore, Product, VMLayout } from "@/store/vmTowerStore";
import AssetLibrary from "./AssetLibrary";

interface ZoneProduct {
  product_id: number;
  position: number;
  product_name: string;
  image_url: string | null;
}

interface Zone {
  id: string;
  name: string;
  type: "wall" | "table" | "mannequin";
  products: ZoneProduct[];
}

const DEFAULT_ZONES: Zone[] = [
  { id: "wall_a", name: "Wall A", type: "wall", products: [] },
  { id: "wall_b", name: "Wall B", type: "wall", products: [] },
  { id: "table", name: "Table", type: "table", products: [] },
];

export default function VMBuilderCanvas() {
  const {
    activeIntentId,
    products,
    layouts,
    setLayouts,
    updateLayout,
    intents,
    updateIntent,
  } = useVMTowerStore();

  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [dragProduct, setDragProduct] = useState<Product | null>(null);
  const [generating, setGenerating] = useState(false);
  const [savingZones, setSavingZones] = useState(false);
  const [generatingMockup, setGeneratingMockup] = useState<number | null>(null);

  const activeIntent = intents.find((i) => i.id === activeIntentId);
  const approvedLayouts = layouts.filter((l) => l.is_approved === 1);

  const handleToggleSelect = useCallback((productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  const handleDragStart = useCallback((product: Product) => {
    setDragProduct(product);
  }, []);

  const handleDropOnZone = useCallback((zoneId: string) => {
    if (!dragProduct) return;
    setZones((prev) =>
      prev.map((zone) => {
        if (zone.id !== zoneId) return zone;
        // Don't add duplicate
        if (zone.products.some((p) => p.product_id === dragProduct.id)) return zone;
        return {
          ...zone,
          products: [
            ...zone.products,
            {
              product_id: dragProduct.id,
              position: zone.products.length + 1,
              product_name: dragProduct.name,
              image_url: dragProduct.image_url,
            },
          ],
        };
      })
    );
    setDragProduct(null);
  }, [dragProduct]);

  const removeFromZone = (zoneId: string, productId: number) => {
    setZones((prev) =>
      prev.map((zone) => {
        if (zone.id !== zoneId) return zone;
        return {
          ...zone,
          products: zone.products.filter((p) => p.product_id !== productId),
        };
      })
    );
  };

  const addZone = () => {
    const num = zones.length + 1;
    setZones([...zones, {
      id: `custom_${Date.now()}`,
      name: `Zone ${num}`,
      type: "wall",
      products: [],
    }]);
  };

  const handleSaveZones = async () => {
    if (!approvedLayouts.length) return;
    setSavingZones(true);
    try {
      const zoneData: Record<string, ZoneProduct[]> = {};
      zones.forEach((z) => { zoneData[z.id] = z.products; });

      // Save to first approved layout
      const layoutId = approvedLayouts[0].id;
      const res = await api.put(`/api/vm-tower/layouts/${layoutId}/zones`, { zone_data: zoneData });
      updateLayout(res.data);

      // Save a version snapshot
      await api.post(`/api/vm-tower/layouts/${layoutId}/snapshot?label=designer_edit`);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingZones(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!activeIntentId) return;
    setGenerating(true);
    try {
      const res = await api.post("/api/vm-tower/layouts/generate", {
        intent_id: activeIntentId,
      });
      setLayouts(res.data);
      if (activeIntent) {
        updateIntent({ ...activeIntent, status: "ai_layout_suggested" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateMockup = async (layoutId: number) => {
    setGeneratingMockup(layoutId);
    try {
      const payload: Record<string, unknown> = { layout_id: layoutId };
      if (selectedProducts.length > 0) {
        payload.garment_product_ids = selectedProducts;
      }
      const res = await api.post("/api/vm-tower/mockup/generate", payload);
      updateLayout(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingMockup(null);
    }
  };

  const handleApproveAll = async () => {
    if (!activeIntentId || layouts.length === 0) return;
    try {
      const res = await api.post(`/api/vm-tower/intents/${activeIntentId}/layouts/approve`, {
        layout_ids: layouts.map((l) => l.id),
      });
      setLayouts(res.data);
      if (activeIntent) {
        updateIntent({ ...activeIntent, status: "designer_approved" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!activeIntentId) {
    return (
      <div className="text-center py-20">
        <Grid3X3 className="w-12 h-12 t-disabled mx-auto mb-3" />
        <p className="t-muted text-sm">Select a design intent first</p>
      </div>
    );
  }

  return (
    <div className="flex gap-0 -mx-6 -mt-6" style={{ height: "calc(100vh - 180px)" }}>
      {/* Left: Asset Library */}
      <div className="w-64 flex-shrink-0 border-r border-[var(--border-color)] bg-surface flex flex-col">
        <AssetLibrary
          onDragStart={handleDragStart}
          selectedProducts={selectedProducts}
          onToggleSelect={handleToggleSelect}
        />
      </div>

      {/* Center: VM Builder Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-color)] bg-surface">
          <button onClick={handleGenerateAI} disabled={generating} className="btn-gradient !py-1.5 !px-4 text-xs flex items-center gap-1.5">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Generate Layouts
          </button>
          <button onClick={addZone} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Zone
          </button>
          {approvedLayouts.length > 0 && (
            <button onClick={handleSaveZones} disabled={savingZones} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5">
              {savingZones ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save Layout
            </button>
          )}
          {layouts.length > 0 && !layouts.some(l => l.is_approved === 1) && (
            <button onClick={handleApproveAll} className="ml-auto btn-secondary !py-1.5 !px-3 text-xs text-green-400 border-green-500/30">
              Approve All Layouts
            </button>
          )}
          <div className="ml-auto text-[10px] t-muted">
            {zones.reduce((a, z) => a + z.products.length, 0)} items placed · {zones.length} zones
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-primary">
          <div className="space-y-6">
            {/* Drop Zones */}
            {zones.map((zone) => (
              <div
                key={zone.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnZone(zone.id)}
                className="section-container p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <GripHorizontal className="w-4 h-4 t-disabled" />
                  <h3 className="text-sm font-bold t-heading">{zone.name}</h3>
                  <span className="text-[10px] tag">{zone.type}</span>
                  <span className="text-[10px] t-muted ml-auto">{zone.products.length} items</span>
                </div>

                {zone.products.length === 0 ? (
                  <div className="border-2 border-dashed border-[var(--border-color)] rounded-xl p-8 text-center">
                    <Package className="w-8 h-8 t-disabled mx-auto mb-2" />
                    <p className="text-xs t-muted">Drag products here from the Asset Library</p>
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {zone.products.map((zp) => (
                      <motion.div
                        key={zp.product_id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative flex-shrink-0 w-28 group"
                      >
                        <div className="aspect-[3/4] rounded-lg overflow-hidden bg-surface-2 border border-[var(--border-color)]">
                          {zp.image_url ? (
                            <img src={`http://localhost:8000${zp.image_url}`} alt={zp.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 t-disabled" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] t-secondary mt-1 text-center truncate">{zp.product_name}</p>
                        <p className="text-[9px] t-muted text-center">M {zp.position}</p>
                        <button
                          onClick={() => removeFromZone(zone.id, zp.product_id)}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* AI Generated Layouts */}
            {layouts.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-bold t-heading mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI Generated Layouts
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {layouts.map((layout) => {
                    const Icon = layout.layout_type === "wall_story" ? Grid3X3
                      : layout.layout_type === "fixture" ? SquareStack
                      : layout.layout_type === "mannequin" ? Package
                      : Package;

                    return (
                      <motion.div
                        key={layout.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="section-container p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-purple-400" />
                          <h4 className="text-sm font-semibold t-heading flex-1">{layout.name}</h4>
                          {layout.is_approved === 1 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">Approved</span>
                          )}
                          <span className="text-[10px] tag">{layout.layout_type}</span>
                        </div>
                        {layout.reasoning && (
                          <p className="text-[11px] t-muted mb-3">{layout.reasoning}</p>
                        )}
                        {layout.mockup_image_url && (
                          <img
                            src={`http://localhost:8000${layout.mockup_image_url}`}
                            alt={layout.name}
                            className="w-full rounded-lg mb-3 border border-[var(--border-color)]"
                          />
                        )}
                        <button
                          onClick={() => handleGenerateMockup(layout.id)}
                          disabled={generatingMockup === layout.id}
                          className="btn-secondary !py-1.5 !px-3 text-xs w-full flex items-center justify-center gap-1.5"
                        >
                          {generatingMockup === layout.id ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating Mockup...</>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              Generate Mockup
                              {selectedProducts.length > 0 && (
                                <span className="ml-1 text-[9px] opacity-60">({selectedProducts.length} products)</span>
                              )}
                            </>
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
