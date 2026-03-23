"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  FlaskConical,
  Layout,
  Palette,
  Camera,
  Plus,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useArtifaxStore, ArtifaxSection } from "@/store/artifaxStore";

// Dynamically import section panels to keep initial bundle small
const ResearchPanel = dynamic(() => import("./components/ResearchPanel"), {
  loading: () => <PanelSkeleton />,
});
const MoodboardCanvas = dynamic(() => import("./components/MoodboardCanvas"), {
  loading: () => <PanelSkeleton />,
  ssr: false,
});
const ColorStudio = dynamic(() => import("./components/ColorStudio"), {
  loading: () => <PanelSkeleton />,
});
const PhotoStudio = dynamic(() => import("./components/PhotoStudio"), {
  loading: () => <PanelSkeleton />,
});

function PanelSkeleton() {
  return (
    <div className="flex-1 p-8 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="shimmer h-32 rounded-2xl" />
      ))}
    </div>
  );
}

const SECTIONS: {
  id: ArtifaxSection;
  label: string;
  icon: React.ElementType;
  accent: string;
  description: string;
}[] = [
  {
    id: "research",
    label: "Research",
    icon: FlaskConical,
    accent: "#06b6d4",
    description: "Trend intelligence & inspiration",
  },
  {
    id: "moodboard",
    label: "Moodboard",
    icon: Layout,
    accent: "#a78bfa",
    description: "Canvas-based design board",
  },
  {
    id: "color-studio",
    label: "Color Studio",
    icon: Palette,
    accent: "#f472b6",
    description: "Palette creation & management",
  },
  {
    id: "photo-studio",
    label: "Photo Studio",
    icon: Camera,
    accent: "#fb923c",
    description: "AI product visualization",
  },
];

export default function ArtifaxPage() {
  const { isLoading } = useAuth();
  const { activeSection, setActiveSection, project, setProjectName } =
    useArtifaxStore();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(project.name);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeConfig = SECTIONS.find((s) => s.id === activeSection)!;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Workspace */}
      <div
        className="ml-60 flex-1 flex flex-col min-h-screen relative bg-primary artifax-workspace"
      >
        {/* Top Bar */}
        <div
          className="sticky top-0 z-30 flex items-center gap-0 border-b border-theme topbar-themed px-6"
          style={{ height: "56px" }}
        >
          {/* Logo badge */}
          <div className="flex items-center gap-2 mr-6 pr-6 border-r border-theme">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-bold gradient-text tracking-widest uppercase">
              Artifax
            </span>
          </div>

          {/* Section tabs */}
          <div className="flex items-center gap-1 flex-1">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <motion.button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  whileHover={{ y: -1 }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 relative ${
                    isActive
                      ? "text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                  style={
                    isActive
                      ? {
                          background: `${section.accent}18`,
                          border: `1px solid ${section.accent}30`,
                        }
                      : {}
                  }
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={isActive ? { color: section.accent } : {}}
                  />
                  <span>{section.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: section.accent }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Project name */}
          <div className="flex items-center gap-2">
            {editingName ? (
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={() => {
                  setProjectName(nameInput || "Untitled Project");
                  setEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setProjectName(nameInput || "Untitled Project");
                    setEditingName(false);
                  }
                }}
                className="input-base px-3 py-1.5 text-xs w-48"
              />
            ) : (
              <button
                onClick={() => {
                  setNameInput(project.name);
                  setEditingName(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/3 hover:bg-white/6 border border-white/5 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-all"
              >
                <span className="max-w-[140px] truncate">{project.name}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Section header strip */}
        <div
          className="flex items-center gap-3 px-8 py-3 border-b border-theme"
          style={{ background: `${activeConfig.accent}08` }}
        >
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: `${activeConfig.accent}25` }}
          >
            <activeConfig.icon
              className="w-3 h-3"
              style={{ color: activeConfig.accent }}
            />
          </div>
          <span
            className="text-xs font-semibold tracking-wider uppercase"
            style={{ color: activeConfig.accent }}
          >
            {activeConfig.label}
          </span>
          <span className="text-xs text-gray-600">
            — {activeConfig.description}
          </span>
        </div>

        {/* Section Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              {activeSection === "research" && <ResearchPanel />}
              {activeSection === "moodboard" && <MoodboardCanvas />}
              {activeSection === "color-studio" && <ColorStudio />}
              {activeSection === "photo-studio" && <PhotoStudio />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
