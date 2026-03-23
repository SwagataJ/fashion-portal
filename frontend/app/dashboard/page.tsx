"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Palette,
  Camera,
  BookOpen,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Zap,
  Layers,
  Users,
  Clapperboard,
  Radar,
  Megaphone,
  MessageSquareMore,
  Search,
  Clock,
  Star,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

interface Stats {
  total_designs: number;
  total_images: number;
  total_catalogs: number;
  [key: string]: unknown;
}

const statCards = [
  { key: "total_designs", label: "Designs", icon: Palette, color: "from-purple-600 to-violet-700", glow: "rgba(124,58,237,0.3)" },
  { key: "total_images", label: "Photos", icon: Camera, color: "from-pink-600 to-rose-700", glow: "rgba(236,72,153,0.3)" },
  { key: "total_catalogs", label: "Catalogs", icon: BookOpen, color: "from-cyan-600 to-blue-700", glow: "rgba(6,182,212,0.3)" },
];

const modules = [
  { href: "/artifax", title: "Artifax", desc: "Design concepts, moodboards, palettes & tech packs", icon: Palette, gradient: "from-purple-600/20 to-violet-800/20", border: "border-purple-500/20", badge: "Design AI", badgeColor: "bg-purple-600/30 text-purple-300" },
  { href: "/photogenix", title: "Photogenix", desc: "AI-powered product photography & scene generation", icon: Camera, gradient: "from-pink-600/20 to-rose-800/20", border: "border-pink-500/20", badge: "Photo AI", badgeColor: "bg-pink-600/30 text-pink-300" },
  { href: "/catalogix", title: "Catalogix", desc: "SEO catalog content, keywords & product descriptions", icon: BookOpen, gradient: "from-cyan-600/20 to-blue-800/20", border: "border-cyan-500/20", badge: "Catalog AI", badgeColor: "bg-cyan-600/30 text-cyan-300" },
  { href: "/vm-tower", title: "VM Tower", desc: "Visual merchandising layouts, fixtures & collaboration", icon: Layers, gradient: "from-orange-600/20 to-red-800/20", border: "border-orange-500/20", badge: "VM AI", badgeColor: "bg-orange-600/30 text-orange-300" },
  { href: "/model-studio", title: "Model Studio", desc: "Generate AI fashion models for any shoot or campaign", icon: Users, gradient: "from-emerald-600/20 to-teal-800/20", border: "border-emerald-500/20", badge: "Model AI", badgeColor: "bg-emerald-600/30 text-emerald-300" },
  { href: "/scene-builder", title: "Scene Builder", desc: "Create backgrounds, scenes & lighting for photography", icon: Clapperboard, gradient: "from-amber-600/20 to-yellow-800/20", border: "border-amber-500/20", badge: "Scene AI", badgeColor: "bg-amber-600/30 text-amber-300" },
  { href: "/trend-radar", title: "Trend Radar", desc: "Discover rising aesthetics, colors, fabrics & silhouettes", icon: Radar, gradient: "from-teal-600/20 to-cyan-800/20", border: "border-teal-500/20", badge: "Trends", badgeColor: "bg-teal-600/30 text-teal-300" },
  { href: "/campaign-builder", title: "Campaigns", desc: "Assemble hero banners, lookbooks & marketing assets", icon: Megaphone, gradient: "from-rose-600/20 to-red-800/20", border: "border-rose-500/20", badge: "Campaign", badgeColor: "bg-rose-600/30 text-rose-300" },
  { href: "/copilot", title: "AI Copilot", desc: "Conversational AI for creative direction & styling advice", icon: MessageSquareMore, gradient: "from-indigo-600/20 to-blue-800/20", border: "border-indigo-500/20", badge: "Chat AI", badgeColor: "bg-indigo-600/30 text-indigo-300" },
];

function SkeletonCard() {
  return <div className="card p-5"><div className="shimmer h-4 w-20 rounded mb-3" /><div className="shimmer h-8 w-12 rounded mb-1" /><div className="shimmer h-3 w-28 rounded" /></div>;
}

export default function DashboardPage() {
  const { isLoading, authenticated } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authenticated) return;
    api.get("/api/dashboard/stats")
      .then((r) => setStats(r.data))
      .catch(() => setStats({ total_designs: 0, total_images: 0, total_catalogs: 0 }))
      .finally(() => setStatsLoading(false));
  }, [authenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const filteredModules = searchQuery
    ? modules.filter((m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : modules;

  return (
    <div className="min-h-screen bg-primary">
      <Sidebar />
      <main className="ml-60 p-8 overflow-y-auto">
        {/* Header + Search */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold t-heading flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              {greeting}
            </h1>
            <p className="t-muted text-sm mt-1 ml-12">Your AI-powered fashion command center</p>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 t-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base !pl-10 !py-2.5"
              placeholder="Search modules, features..."
            />
          </div>
        </motion.div>

        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl mb-8 p-6"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(236,72,153,0.08) 50%, rgba(6,182,212,0.08) 100%)",
            border: "1px solid rgba(124,58,237,0.15)",
          }}
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-xs font-semibold tracking-wider uppercase">Retail Command Center</span>
              </div>
              <h2 className="text-lg font-bold t-heading mb-1">Fashion AI Platform</h2>
              <p className="t-muted text-sm max-w-lg">
                Design, photograph, merchandise, and market your fashion collections with AI — all from one workspace.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/copilot">
                <motion.div whileHover={{ scale: 1.03 }} className="px-4 py-2.5 rounded-xl bg-[var(--accent-purple-bg)] border border-[var(--accent-purple-border)] text-purple-400 text-sm font-medium flex items-center gap-2 cursor-pointer">
                  <MessageSquareMore className="w-4 h-4" /> Ask Copilot
                </motion.div>
              </Link>
              <Link href="/trend-radar">
                <motion.div whileHover={{ scale: 1.03 }} className="px-4 py-2.5 rounded-xl bg-wash-2 border border-[var(--border-color)] t-secondary text-sm font-medium flex items-center gap-2 cursor-pointer">
                  <TrendingUp className="w-4 h-4" /> What's Trending
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statsLoading
            ? Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : statCards.map((card, i) => {
                const Icon = card.icon;
                const value = stats ? (stats[card.key] as number) : 0;
                return (
                  <motion.div
                    key={card.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="card p-5 group cursor-default"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 25px ${card.glow}`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="t-muted text-sm font-medium">{card.label}</span>
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold t-heading">{value}</div>
                  </motion.div>
                );
              })}
        </div>

        {/* Module Grid */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold t-heading uppercase tracking-wider mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            All Modules
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                whileHover={{ y: -3 }}
              >
                <Link href={action.href}>
                  <div className={`card p-5 bg-gradient-to-br ${action.gradient} border ${action.border} hover:border-[var(--border-hover)] transition-all duration-300 cursor-pointer group h-full`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-wash-2 flex items-center justify-center">
                        <Icon className="w-5 h-5 t-secondary group-hover:text-purple-400 transition-colors" />
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${action.badgeColor}`}>{action.badge}</span>
                    </div>
                    <h4 className="font-semibold t-heading mb-1 text-base">{action.title}</h4>
                    <p className="text-xs t-muted leading-relaxed mb-3">{action.desc}</p>
                    <div className="flex items-center gap-1 text-xs t-faint group-hover:text-purple-400 transition-colors">
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
