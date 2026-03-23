"use client";

import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 theme-toggle-btn flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative w-9 h-5 rounded-full bg-[var(--bg-surface-3)] flex items-center">
        <motion.div
          className="absolute w-4 h-4 rounded-full"
          style={{
            background: theme === "dark"
              ? "linear-gradient(135deg, #7c3aed, #ec4899)"
              : "linear-gradient(135deg, #f59e0b, #f97316)",
          }}
          animate={{ x: theme === "dark" ? 2 : 18 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, type: "spring" }}
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-500" />
        )}
      </motion.div>
    </motion.button>
  );
}
