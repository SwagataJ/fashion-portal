"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  MessageSquareMore,
  ArrowUp,
  Sparkles,
  Loader2,
  Palette,
  TrendingUp,
  BookOpen,
  Megaphone,
  Shirt,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  { text: "Suggest a color palette for SS26", icon: Palette },
  { text: "What's trending in menswear?", icon: TrendingUp },
  { text: "Review my design concept", icon: BookOpen },
  { text: "Create a campaign brief", icon: Megaphone },
  { text: "Style this outfit for Gen Z", icon: Shirt },
];

const QUICK_ACTIONS = [
  "Color Palette",
  "Trend Brief",
  "Style Guide",
  "Campaign Ideas",
];

export default function CopilotPage() {
  const { isLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await api.post("/api/copilot/chat", {
        messages: updatedMessages,
        context: null,
      });
      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        role: "assistant",
        content:
          "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-primary">
      <Sidebar />
      <div className="ml-60 p-6 flex flex-col h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex-shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
              <MessageSquareMore className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold t-heading">AI Copilot</h1>
              <p className="text-sm t-muted">Your AI creative director</p>
            </div>
          </div>
        </motion.div>

        {/* Chat Container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="card flex-1 flex flex-col overflow-hidden"
          style={{ height: "calc(100vh - 200px)" }}
        >
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold t-heading mb-2">
                    How can I help you?
                  </h2>
                  <p className="text-sm t-muted mb-8 max-w-md">
                    I can help with trend analysis, color palettes, campaign
                    briefs, style recommendations, and more.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center max-w-lg">
                    {SUGGESTED_PROMPTS.map((prompt, idx) => {
                      const Icon = prompt.icon;
                      return (
                        <motion.button
                          key={prompt.text}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                          onClick={() => sendMessage(prompt.text)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border b-subtle t-secondary text-xs font-medium hover:bg-wash hover:border-theme hover:t-heading transition-all duration-200"
                        >
                          <Icon className="w-3.5 h-3.5 text-purple-400" />
                          {prompt.text}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl rounded-br-sm shadow-lg shadow-purple-500/20 whitespace-pre-wrap"
                            : "card t-primary rounded-2xl rounded-bl-sm"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                              em: ({ children }) => <em className="italic text-purple-300">{children}</em>,
                              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                              h1: ({ children }) => <h1 className="text-base font-bold text-white mb-2 mt-3">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-sm font-bold text-white mb-2 mt-3">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold text-purple-300 mb-1 mt-2">{children}</h3>,
                              hr: () => <hr className="border-white/10 my-3" />,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="card px-5 py-3 rounded-2xl rounded-bl-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
                        <div
                          className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                          style={{ animationDelay: "0.15s" }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                          style={{ animationDelay: "0.3s" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t b-subtle p-4 flex-shrink-0">
            {/* Quick Actions */}
            <div className="flex gap-2 mb-3">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => setInput((prev) => (prev ? prev + " " + action : action))}
                  className="px-3 py-1.5 rounded-full bg-surface-2 border b-subtle text-[11px] font-medium t-secondary hover:bg-wash hover:border-theme hover:t-heading transition-all duration-200"
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Input Row */}
            <div className="flex items-end gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask about trends, colors, campaigns, styling..."
                rows={2}
                className="input-base flex-1 rounded-xl text-sm py-3 px-4 resize-none"
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
