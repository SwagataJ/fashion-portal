"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Sparkles,
  Loader2,
  Download,
  ChevronRight,
  Package,
  Ruler,
  Layers,
  Tag,
  ClipboardList,
} from "lucide-react";
import api from "@/lib/api";
import { useArtifaxStore } from "@/store/artifaxStore";
import { downloadTextFile } from "@/lib/utils";

const CATEGORIES = ["Shirt", "Blouse", "Dress", "Skirt", "Trousers", "Jacket", "Kurta", "Saree Blouse", "Co-ord Set", "Outerwear", "Knitwear", "Denim"];

function Section({ title, icon: Icon, children, accent = "#4ade80" }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accent?: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all hover:bg-white/2"
        style={{ background: `${accent}08` }}
      >
        <Icon className="w-4 h-4" style={{ color: accent }} />
        <span className="text-sm font-semibold text-white flex-1">{title}</span>
        <ChevronRight
          className={`w-4 h-4 text-gray-600 transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 bg-white/2 border-t border-white/5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SpecTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/5">
            {headers.map((h, i) => (
              <th key={i} className="text-left py-2 px-3 text-gray-500 font-medium first:pl-0 last:pr-0">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/3 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className={`py-2 px-3 text-gray-300 first:pl-0 last:pr-0 ${j === 0 ? "font-medium text-white" : ""}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TechpackPanel() {
  const { project, setTechpackContent, setTechpackFormData } = useArtifaxStore();
  const { content, formData } = project.techpack;

  const [form, setForm] = useState({
    style_name: formData.style_name || "",
    style_code: formData.style_code || "",
    category: formData.category || "Shirt",
    fabric_details: formData.fabric_details || "",
    color_description: formData.color_description || "",
    key_features: formData.key_features || "",
    target_market: formData.target_market || "",
  });

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setGenerating(true);
    setTechpackFormData(form);
    try {
      const res = await api.post("/api/artifax/techpack/generate", form);
      setTechpackContent(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Techpack generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadText = () => {
    if (!content) return;
    const c = content as Record<string, unknown>;
    const bom = (c.bom_table as Array<Record<string, string>> || [])
      .map((r) => `  ${r.item} | ${r.description} | ${r.quantity} | ${r.supplier_note}`)
      .join("\n");
    const sizes = (c.size_spec_chart as Array<Record<string, string>> || [])
      .map((r) => `  ${r.size} | Chest: ${r.chest} | Waist: ${r.waist} | Hips: ${r.hips} | Length: ${r.length} | Shoulder: ${r.shoulder}`)
      .join("\n");

    const text = `FASHION AI TECH PACK
============================
Style Name: ${c.style_name}
Style Code: ${c.style_code}
Season: ${c.season}
Category: ${c.category}

FABRIC DETAILS
${c.fabric_details}

CONSTRUCTION NOTES
${c.construction_notes}

STITCH TYPE
${c.stitch_type}

TRIM DETAILS
${c.trim_details}

BILL OF MATERIALS (BOM)
Item | Description | Quantity | Supplier Note
${bom}

SIZE SPECIFICATION CHART
Size | Chest | Waist | Hips | Length | Shoulder
${sizes}

CARE INSTRUCTIONS
${c.care_instructions}

PACKAGING INSTRUCTIONS
${c.packaging_instructions}

QUALITY STANDARDS
${c.quality_standards}
`;
    downloadTextFile(text, `techpack-${c.style_code || Date.now()}.txt`);
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-120px)]">
      {/* Left: Form */}
      <div className="w-80 flex-shrink-0 border-r border-white/5 flex flex-col overflow-y-auto">
        <div className="p-5">
          <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-4">
            Product Information
          </h3>

          <form onSubmit={handleGenerate} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Style Name</label>
              <input value={form.style_name} onChange={(e) => setForm({ ...form, style_name: e.target.value })} className="input-base text-sm" placeholder="e.g. Classic Oxford Shirt" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Style Code</label>
              <input value={form.style_code} onChange={(e) => setForm({ ...form, style_code: e.target.value })} className="input-base text-sm" placeholder="e.g. SH-001-SS25" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-base text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Fabric Details</label>
              <textarea value={form.fabric_details} onChange={(e) => setForm({ ...form, fabric_details: e.target.value })} rows={2} className="input-base text-sm resize-none" placeholder="e.g. 100% cotton poplin, 80 GSM, plain weave..." required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Color Description</label>
              <input value={form.color_description} onChange={(e) => setForm({ ...form, color_description: e.target.value })} className="input-base text-sm" placeholder="e.g. Classic white with navy pinstripe" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Key Features</label>
              <textarea value={form.key_features} onChange={(e) => setForm({ ...form, key_features: e.target.value })} rows={3} className="input-base text-sm resize-none" placeholder="e.g. spread collar, button-down front, chest pocket, curved hem..." required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Target Market</label>
              <input value={form.target_market} onChange={(e) => setForm({ ...form, target_market: e.target.value })} className="input-base text-sm" placeholder="e.g. Men 25-40, premium mid-market" required />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={generating}
              className="btn-gradient w-full flex items-center justify-center gap-2 py-2.5 text-sm"
              style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Techpack…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Tech Pack
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right: Generated techpack */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {generating && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Building your tech pack</p>
                <p className="text-gray-500 text-sm mt-0.5">AI is generating production specifications…</p>
              </div>
              <div className="w-56 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-green-600 to-emerald-600" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
              </div>
            </motion.div>
          )}

          {!generating && content && (() => {
            const c = content as Record<string, unknown>;
            const bomRows = (c.bom_table as Array<Record<string, string>> || []).map((r) => [r.item, r.description, r.quantity, r.supplier_note]);
            const sizeRows = (c.size_spec_chart as Array<Record<string, string>> || []).map((r) => [r.size, r.chest, r.waist, r.hips, r.length, r.shoulder]);
            return (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-white">{c.style_name as string}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 font-mono">{c.style_code as string}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/25 text-green-300">{c.season as string}</span>
                      <span className="text-xs text-gray-500">{c.category as string}</span>
                    </div>
                  </div>
                  <button onClick={handleDownloadText} className="flex items-center gap-2 px-4 py-2 bg-green-600/15 hover:bg-green-600/25 border border-green-500/25 rounded-xl text-sm text-green-300 transition-all">
                    <Download className="w-4 h-4" />
                    Download .txt
                  </button>
                </div>

                <Section title="Fabric Details" icon={Layers} accent="#4ade80">
                  <p className="text-gray-300 text-sm leading-relaxed">{c.fabric_details as string}</p>
                </Section>

                <Section title="Construction Notes" icon={ClipboardList} accent="#a3e635">
                  <p className="text-gray-300 text-sm leading-relaxed">{c.construction_notes as string}</p>
                </Section>

                <Section title="Stitch Type & Seam Details" icon={Ruler} accent="#86efac">
                  <p className="text-gray-300 text-sm leading-relaxed">{c.stitch_type as string}</p>
                </Section>

                <Section title="Trim Details" icon={Tag} accent="#6ee7b7">
                  <p className="text-gray-300 text-sm leading-relaxed">{c.trim_details as string}</p>
                </Section>

                <Section title="Bill of Materials (BOM)" icon={Package} accent="#34d399">
                  <SpecTable
                    headers={["Item", "Description", "Quantity", "Supplier Note"]}
                    rows={bomRows}
                  />
                </Section>

                <Section title="Size Specification Chart" icon={Ruler} accent="#4ade80">
                  <SpecTable
                    headers={["Size", "Chest", "Waist", "Hips", "Length", "Shoulder"]}
                    rows={sizeRows}
                  />
                </Section>

                <Section title="Care Instructions" icon={FileText} accent="#a7f3d0">
                  <p className="text-gray-300 text-sm leading-relaxed">{c.care_instructions as string}</p>
                </Section>

                <Section title="Packaging Instructions" icon={Package} accent="#6ee7b7">
                  <p className="text-gray-300 text-sm leading-relaxed">{c.packaging_instructions as string}</p>
                </Section>

                <Section title="Quality Standards" icon={ClipboardList} accent="#34d399">
                  <p className="text-gray-300 text-sm leading-relaxed">{c.quality_standards as string}</p>
                </Section>
              </motion.div>
            );
          })()}

          {!generating && !content && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/8 border border-green-500/15 flex items-center justify-center mx-auto mb-4 animate-float">
                <FileText className="w-7 h-7 text-green-400/60" />
              </div>
              <h3 className="text-gray-400 font-medium mb-2">No tech pack yet</h3>
              <p className="text-gray-600 text-sm max-w-sm">
                Fill in the product details and generate a complete production-ready tech pack with BOM, size specs, and quality standards
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
