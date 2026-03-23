"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Palette,
  Camera,
  BookOpen,
  LogOut,
  Sparkles,
  Layers,
  Users,
  Clapperboard,
  Radar,
  Megaphone,
  MessageSquareMore,
} from "lucide-react";
import { removeToken } from "@/lib/auth";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    badge: null,
    color: "text-blue-400",
  },
  {
    href: "/artifax",
    label: "Artifax",
    icon: Palette,
    badge: "Design AI",
    color: "text-purple-400",
  },
  {
    href: "/photogenix",
    label: "Photogenix",
    icon: Camera,
    badge: "Photo AI",
    color: "text-pink-400",
  },
  {
    href: "/catalogix",
    label: "Catalogix",
    icon: BookOpen,
    badge: "Catalog AI",
    color: "text-cyan-400",
  },
  {
    href: "/vm-tower",
    label: "VM Tower",
    icon: Layers,
    badge: "VM AI",
    color: "text-orange-400",
  },
  // ─── New Modules ───
  {
    href: "/model-studio",
    label: "Model Studio",
    icon: Users,
    badge: "Model AI",
    color: "text-emerald-400",
  },
  {
    href: "/scene-builder",
    label: "Scene Builder",
    icon: Clapperboard,
    badge: "Scene AI",
    color: "text-amber-400",
  },
  {
    href: "/trend-radar",
    label: "Trend Radar",
    icon: Radar,
    badge: "Trends",
    color: "text-teal-400",
  },
  {
    href: "/campaign-builder",
    label: "Campaigns",
    icon: Megaphone,
    badge: "Campaign",
    color: "text-rose-400",
  },
  {
    href: "/copilot",
    label: "AI Copilot",
    icon: MessageSquareMore,
    badge: "Chat AI",
    color: "text-indigo-400",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  return (
    <div className="fixed left-0 top-0 h-full w-60 sidebar-themed border-r flex flex-col z-20">
      {/* Logo */}
      <div className="p-5 border-b border-theme">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <div className="font-bold text-sm gradient-text tracking-wider">
              FASHION AI
            </div>
            <div className="text-[10px] text-muted tracking-wide">
              Concept to Commerce
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 3 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? "bg-purple-600/15 border border-purple-500/20 text-white"
                    : "text-secondary hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? item.color : "text-gray-500 group-hover:text-gray-300"
                  }`}
                />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                      isActive
                        ? "bg-purple-600/30 text-purple-300"
                        : "bg-[var(--toggle-bg)] text-muted"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* AI Badge */}
      <div className="px-4 pb-3">
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-green-400 font-medium">
              AI Models Active
            </span>
          </div>
          <p className="text-[10px] text-muted">
            Gemini · Nano Banana
          </p>
        </div>
      </div>

      {/* Sign Out */}
      <div className="p-3 border-t border-theme">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-secondary hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-all duration-200 group"
        >
          <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-400 transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
