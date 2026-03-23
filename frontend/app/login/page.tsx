"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { setToken, isAuthenticated } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@fashion.ai");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/api/auth/login", { email, password });
      setToken(response.data.access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 items-center justify-center mb-4"
            style={{ boxShadow: "0 0 40px rgba(124,58,237,0.4)" }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold gradient-text tracking-tight">
            Fashion AI
          </h1>
          <p className="text-muted text-sm mt-1">Concept to Commerce Platform</p>
        </div>

        {/* Card */}
        <div
          className="card p-8"
          style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}
        >
          <h2 className="text-xl font-semibold text-primary mb-1">
            Welcome back
          </h2>
          <p className="text-muted text-sm mb-6">
            Sign in to access your AI workspace
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder="admin@fashion.ai"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gradient w-full flex items-center justify-center gap-2 py-3 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 bg-white/3 border border-white/5 rounded-lg">
            <p className="text-[11px] text-gray-500 text-center">
              Demo credentials pre-filled above
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-muted text-xs mt-6">
          Fashion AI Platform · Local MVP · Powered by Gemini & Nano Banana
        </p>
      </motion.div>
    </div>
  );
}
