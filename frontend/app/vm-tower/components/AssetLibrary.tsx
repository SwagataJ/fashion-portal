"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Package,
  Tag,
  Palette,
  Grid,
  List,
  X,
  GripVertical,
  CheckSquare,
  Square,
  Sparkles,
  Loader2,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  Box,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "@/lib/api";
import { useVMTowerStore, Product } from "@/store/vmTowerStore";

interface AssetLibraryProps {
  onDragStart?: (product: Product) => void;
  selectedProducts: number[];
  onToggleSelect: (productId: number) => void;
}

interface Fixture {
  id: number;
  name: string;
  fixture_type: string;
  image_url: string | null;
  num_positions: number;
  position_labels: string[] | null;
  dimensions: string | null;
}

interface RangeImage {
  image_url: string;
  label: string;
}

const CATEGORY_OPTIONS = ["All", "Shirts", "Tops", "Trousers", "Denim", "Tees", "Outerwear", "Accessories", "Knitwear", "Dresses"];
const COLOR_OPTIONS = ["All", "White", "Blue", "Navy", "Black", "Beige", "Sand", "Sky Blue", "Olive", "Red", "Pink"];

type ActiveTab = "products" | "fixtures" | "ranges";

export default function AssetLibrary({ onDragStart, selectedProducts, onToggleSelect }: AssetLibraryProps) {
  const { products, setProducts, addProducts, activeIntentId } = useVMTowerStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [colorFilter, setColorFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("products");
  const [loadingReco, setLoadingReco] = useState(false);
  const [recommendations, setRecommendations] = useState<{ look_name: string; product_ids: number[]; styling_note: string }[]>([]);

  // Upload state
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newColor, setNewColor] = useState("");

  // Fixtures state
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);

  // Range images state
  const [rangeImages, setRangeImages] = useState<RangeImage[]>([]);
  const rangeFileRef = useRef<HTMLInputElement>(null);
  const [uploadingRange, setUploadingRange] = useState(false);

  // Fetch fixtures and range images
  useEffect(() => {
    if (!activeIntentId) return;
    const fetchData = async () => {
      try {
        const [fixRes, rangeRes] = await Promise.all([
          api.get("/api/vm-tower/fixtures"),
          api.get(`/api/vm-tower/intents/${activeIntentId}/range-images`),
        ]);
        setFixtures(fixRes.data);
        setRangeImages(rangeRes.data);
      } catch {}
    };
    fetchData();
  }, [activeIntentId]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = categoryFilter === "All" || (p.category && p.category.toLowerCase().includes(categoryFilter.toLowerCase()));
      const matchColor = colorFilter === "All" || (p.color && p.color.toLowerCase().includes(colorFilter.toLowerCase()));
      return matchSearch && matchCategory && matchColor;
    });
  }, [products, search, categoryFilter, colorFilter]);

  const handleGetRecommendations = async () => {
    if (!activeIntentId) return;
    setLoadingReco(true);
    try {
      const res = await api.post("/api/vm-tower/ai/outfit-recommendation", {
        intent_id: activeIntentId,
        product_ids: products.map(p => p.id),
      });
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReco(false);
    }
  };

  // Upload product image and create product
  const handleUploadProduct = async (file: File) => {
    if (!activeIntentId) return;
    setUploading(true);
    try {
      // Create product first
      const name = newName || file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
      const res = await api.post(`/api/vm-tower/intents/${activeIntentId}/products`, {
        sku: `SKU-${Date.now()}`,
        name,
        category: newCategory || null,
        color: newColor || null,
      });
      const product = res.data;

      // Upload image
      const formData = new FormData();
      formData.append("image", file);
      const imgRes = await api.post(
        `/api/vm-tower/intents/${activeIntentId}/products/${product.id}/upload-image`,
        formData
      );
      addProducts([imgRes.data]);
      setNewName("");
      setNewCategory("");
      setNewColor("");
      setShowAddProduct(false);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId: number) => {
    if (!activeIntentId) return;
    try {
      await api.delete(`/api/vm-tower/intents/${activeIntentId}/products/${productId}`);
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      console.error(err);
    }
  };

  // Delete fixture
  const handleDeleteFixture = async (fixtureId: number) => {
    try {
      await api.delete(`/api/vm-tower/fixtures/${fixtureId}`);
      setFixtures(fixtures.filter(f => f.id !== fixtureId));
    } catch (err) {
      console.error(err);
    }
  };

  // Upload range image
  const handleUploadRange = async (file: File) => {
    if (!activeIntentId) return;
    setUploadingRange(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("label", "range");
      const res = await api.post(`/api/vm-tower/intents/${activeIntentId}/range-image`, formData);
      setRangeImages([...rangeImages, { image_url: res.data.image_url, label: res.data.label }]);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingRange(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with tabs */}
      <div className="p-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-0.5 mb-2">
          {(["products", "fixtures", "ranges"] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-[10px] py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? "bg-[var(--accent-purple-bg)] text-purple-400"
                  : "t-muted hover:t-secondary"
              }`}
            >
              {tab === "products" ? "Products" : tab === "fixtures" ? "Fixtures" : "Ranges"}
            </button>
          ))}
        </div>

        {activeTab === "products" && (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <button onClick={() => setViewMode("grid")} className={`p-1 rounded ${viewMode === "grid" ? "bg-wash-2 t-heading" : "t-muted"}`}>
                  <Grid className="w-3 h-3" />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-1 rounded ${viewMode === "list" ? "bg-wash-2 t-heading" : "t-muted"}`}>
                  <List className="w-3 h-3" />
                </button>
                <button onClick={() => setShowFilters(!showFilters)} className={`p-1 rounded ${showFilters ? "bg-purple-600/20 text-purple-400" : "t-muted"}`}>
                  <Filter className="w-3 h-3" />
                </button>
              </div>
              <button
                onClick={() => setShowAddProduct(!showAddProduct)}
                className="text-[10px] px-2 py-1 rounded-md bg-[var(--accent-purple-bg)] text-purple-400 hover:bg-purple-600/20 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 t-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base !py-1 !pl-7 !text-[11px]"
                placeholder="Search..."
              />
            </div>
          </>
        )}
      </div>

      {/* Add Product Form */}
      <AnimatePresence>
        {showAddProduct && activeTab === "products" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-[var(--border-color)] overflow-hidden"
          >
            <div className="p-2 space-y-1.5">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input-base !py-1 !text-[11px]" placeholder="Product name" />
              <div className="flex gap-1.5">
                <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="input-base !py-1 !text-[11px] !w-auto flex-1" placeholder="Category" />
                <input value={newColor} onChange={(e) => setNewColor(e.target.value)} className="input-base !py-1 !text-[11px] !w-auto flex-1" placeholder="Color" />
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[var(--border-color)] hover:border-purple-500/30 t-muted text-[11px] transition-colors"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {uploading ? "Uploading..." : "Upload Photo & Add"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadProduct(file);
                  e.target.value = "";
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && activeTab === "products" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-[var(--border-color)] overflow-hidden"
          >
            <div className="p-2 space-y-1.5">
              <div>
                <label className="text-[9px] t-muted uppercase tracking-wider mb-0.5 block">Category</label>
                <div className="flex flex-wrap gap-0.5">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                        categoryFilter === cat ? "bg-purple-600/20 text-purple-400" : "bg-wash t-muted"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] t-muted uppercase tracking-wider mb-0.5 block">Color</label>
                <div className="flex flex-wrap gap-0.5">
                  {COLOR_OPTIONS.map((col) => (
                    <button
                      key={col}
                      onClick={() => setColorFilter(col)}
                      className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                        colorFilter === col ? "bg-purple-600/20 text-purple-400" : "bg-wash t-muted"
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Recommendations (products tab only) */}
      {activeTab === "products" && (
        <div className="p-2 border-b border-[var(--border-color)]">
          <button
            onClick={handleGetRecommendations}
            disabled={loadingReco || products.length === 0}
            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-[var(--accent-purple-bg)] border border-[var(--accent-purple-border)] text-purple-400 text-[10px] font-medium hover:bg-purple-600/20 transition-colors disabled:opacity-40"
          >
            {loadingReco ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI Outfit Suggestions
          </button>
          {recommendations.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {recommendations.map((reco, i) => (
                <button
                  key={i}
                  onClick={() => reco.product_ids.forEach(id => {
                    if (!selectedProducts.includes(id)) onToggleSelect(id);
                  })}
                  className="w-full text-left p-1.5 rounded-lg bg-wash hover:bg-wash-2 border border-[var(--border-color)] transition-colors"
                >
                  <div className="text-[10px] font-medium t-heading">{reco.look_name}</div>
                  <div className="text-[9px] t-muted mt-0.5">{reco.styling_note}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* ─── Products Tab ─── */}
        {activeTab === "products" && (
          <>
            <div className="text-[10px] t-muted px-1 mb-1.5">{filtered.length} items</div>
            {filtered.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-8 h-8 t-disabled mx-auto mb-2" />
                <p className="text-[11px] t-muted">No products yet</p>
                <p className="text-[10px] t-disabled">Click + Add above to upload products</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-1.5">
                {filtered.map((product) => (
                  <motion.div
                    key={product.id}
                    draggable
                    onDragStart={() => onDragStart?.(product)}
                    whileHover={{ scale: 1.02 }}
                    className="relative rounded-lg overflow-hidden border border-[var(--border-color)] cursor-grab active:cursor-grabbing bg-card group"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleSelect(product.id); }}
                      className="absolute top-1 left-1 z-10"
                    >
                      {selectedProducts.includes(product.id) ? (
                        <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 t-disabled opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                    {/* Delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}
                      className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                    <div className="aspect-square bg-surface-2 flex items-center justify-center">
                      {product.image_url ? (
                        <img src={`http://localhost:8000${product.image_url}`} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 t-disabled" />
                      )}
                    </div>
                    <div className="p-1">
                      <div className="text-[9px] font-medium t-heading truncate">{product.name}</div>
                      <div className="text-[8px] t-muted">{product.category} · {product.color}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((product) => (
                  <div
                    key={product.id}
                    draggable
                    onDragStart={() => onDragStart?.(product)}
                    className="flex items-center gap-2 p-1.5 rounded-lg border border-[var(--border-color)] cursor-grab bg-card hover:bg-wash transition-colors group"
                  >
                    <button onClick={() => onToggleSelect(product.id)}>
                      {selectedProducts.includes(product.id) ? (
                        <CheckSquare className="w-3 h-3 text-purple-400" />
                      ) : (
                        <Square className="w-3 h-3 t-disabled" />
                      )}
                    </button>
                    <div className="w-7 h-7 rounded bg-surface-2 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img src={`http://localhost:8000${product.image_url}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-3 h-3 t-disabled" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium t-heading truncate">{product.name}</div>
                      <div className="text-[8px] t-muted">{product.color}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Fixtures Tab ─── */}
        {activeTab === "fixtures" && (
          <div className="space-y-2">
            <div className="text-[10px] t-muted mb-1">{fixtures.length} fixtures</div>
            {fixtures.length === 0 ? (
              <div className="text-center py-8">
                <Box className="w-8 h-8 t-disabled mx-auto mb-2" />
                <p className="text-[11px] t-muted">No fixtures yet</p>
                <p className="text-[10px] t-disabled">Go to Products & Fixtures tab to create fixtures</p>
              </div>
            ) : (
              fixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  className="p-2 rounded-lg border border-[var(--border-color)] bg-card group"
                >
                  <div className="flex items-center gap-2">
                    {fixture.image_url ? (
                      <div className="w-10 h-10 rounded bg-surface-2 overflow-hidden flex-shrink-0">
                        <img src={`http://localhost:8000${fixture.image_url}`} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-surface-2 flex items-center justify-center flex-shrink-0">
                        <Box className="w-4 h-4 t-disabled" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium t-heading truncate">{fixture.name}</div>
                      <div className="text-[8px] t-muted">{fixture.fixture_type} · {fixture.num_positions} positions</div>
                      {fixture.dimensions && (
                        <div className="text-[8px] t-disabled">{fixture.dimensions}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteFixture(fixture.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {fixture.position_labels && fixture.position_labels.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1.5">
                      {fixture.position_labels.map((label, i) => (
                        <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-wash border border-[var(--border-color)] t-muted">
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── Range Images Tab ─── */}
        {activeTab === "ranges" && (
          <div className="space-y-2">
            <button
              onClick={() => rangeFileRef.current?.click()}
              disabled={uploadingRange}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-[var(--border-color)] hover:border-purple-500/30 t-muted text-[11px] transition-colors"
            >
              {uploadingRange ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploadingRange ? "Uploading..." : "Upload Range Image"}
            </button>
            <input
              ref={rangeFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadRange(file);
                e.target.value = "";
              }}
            />

            <div className="text-[10px] t-muted">{rangeImages.length} range images</div>

            {rangeImages.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="w-8 h-8 t-disabled mx-auto mb-2" />
                <p className="text-[11px] t-muted">No range images yet</p>
                <p className="text-[10px] t-disabled">Upload combo/styled look photos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {rangeImages.map((img, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-[var(--border-color)] bg-card">
                    <div className="aspect-[4/3] bg-surface-2">
                      <img src={`http://localhost:8000${img.image_url}`} alt={img.label} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-1">
                      <div className="text-[9px] t-muted text-center">{img.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
