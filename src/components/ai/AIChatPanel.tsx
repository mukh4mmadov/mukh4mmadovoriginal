"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Copy,
  RotateCcw,
} from "lucide-react";
import {
  AIMessage,
  AIConversationContext,
  AIPersonality,
} from "@/types/aiCoach";
import { parseAIResponse, formatParsedResponse } from "@/lib/ai/parseResponse";
import { useAuth } from "@/contexts/AuthContext";
import { analyticsService } from "@/lib/analytics/analytics.service";
import { supabase } from "@/lib/supabase/client";

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context: AIConversationContext;
  personality: AIPersonality;
  onPersonalityChange: (personality: AIPersonality) => void;
}

const SUGGESTED_PROMPTS = [
  { icon: "💡", label: "Hint", prompt: "Give me a hint for this question." },
  {
    icon: "📖",
    label: "Explain Paragraph",
    prompt: "Explain the paragraph that contains the evidence.",
  },
  {
    icon: "🎯",
    label: "Find Evidence",
    prompt: "Which sentence contains the evidence for the correct answer?",
  },
  {
    icon: "📚",
    label: "Vocabulary",
    prompt: "Explain the difficult vocabulary in this passage.",
  },
  {
    icon: "🧠",
    label: "Strategy",
    prompt: "What strategy should I use for this type of question?",
  },
  {
    icon: "📝",
    label: "Summary",
    prompt: "Summarize the main point of this passage.",
  },
  {
    icon: "🔁",
    label: "Explain Simpler",
    prompt: "Explain this in simpler terms.",
  },
  {
    icon: "🔥",
    label: "Roast Me",
    prompt: "Roast my answer and tell me what I did wrong.",
    personality: "savage" as const,
  },
];

export default function AIChatPanel({
  isOpen,
  onClose,
  context,
  personality,
  onPersonalityChange,
}: AIChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [isNotConfigured, setIsNotConfigured] = useState(false);
  const [panelWidth, setPanelWidth] = useState(370);
  const [isResizing, setIsResizing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const conversationKey = `ai-conversation-${context.passage.title}`;

  // Track AI coach opened
  useEffect(() => {
    if (isOpen) {
      analyticsService.trackAICoachOpened(
        user?.id ?? null,
        context.passage.title,
      );
    }
  }, [isOpen, user?.id, context.passage.title]);

  // Load conversation from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(conversationKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Only load if less than 24 hours old
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            setMessages(parsed.messages);
          }
        }
      } catch (e) {
        // Ignore parse errors or quota exceeded
      }
    }
  }, [conversationKey]);

  // Save conversation to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0 && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          conversationKey,
          JSON.stringify({
            messages,
            timestamp: Date.now(),
          }),
        );
      } catch (e) {
        // Handle quota exceeded or other localStorage errors
        // Try to clear old data to free space
        try {
          localStorage.clear();
        } catch (clearError) {
          // Ignore clear errors
        }
      }
    }
  }, [messages, conversationKey]);

  // Clear conversation when passage changes
  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [context.passage.title]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle panel resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (event: MouseEvent) => {
      const newWidth = window.innerWidth - event.clientX;
      const clamped = Math.min(500, Math.max(320, newWidth));
      setPanelWidth(clamped);
    };

    const stopResize = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stopResize);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stopResize);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const handleSend = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: prompt.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setIsNotConfigured(false);
    setIsLoading(true);
    setStreamingContent("");
    setLastFailedPrompt(prompt.trim());

    // Track AI message sent
    analyticsService.trackAIMessageSent(
      user?.id ?? null,
      context.passage.title,
      {
        prompt: prompt.trim(),
      },
    );

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Please sign in to use the AI coach.");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context,
          personality,
          provider: "openai",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get AI response");
      }

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk
            .split("\n")
            .filter((line) => line.trim().startsWith("data: "));

          for (const line of lines) {
            const data = line.replace("data: ", "").trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                fullContent += parsed.chunk;
                setStreamingContent(fullContent);
              }
              if (parsed.done) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: parsed.content }
                      : msg,
                  ),
                );
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Reset retry count on success
      setRetryCount(0);
      setLastFailedPrompt(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get AI response";

      // Check if it's a configuration error
      if (
        errorMessage.includes("AI service not configured") ||
        errorMessage.includes("not configured")
      ) {
        setIsNotConfigured(true);
        setError(null);
      } else {
        setError(errorMessage);
      }

      setMessages((prev) => prev.slice(0, -1)); // Remove the empty assistant message
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const formatMessage = (content: string) => {
    // Sanitize content to prevent XSS
    const sanitized = content
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");

    // Parse and format structured AI responses
    const parsed = parseAIResponse(sanitized);
    const formatted = formatParsedResponse(parsed);

    // Safe markdown-like formatting (only allow specific tags)
    return formatted
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /`(.*?)`/g,
        '<code class="bg-white/10 px-1 py-0.5 rounded text-sm">$1</code>',
      )
      .replace(/\n/g, "<br />");
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleRegenerate = () => {
    if (messages.length >= 2) {
      const lastUserMessage = messages[messages.length - 2];
      if (lastUserMessage.role === "user") {
        setMessages((prev) => prev.slice(0, -1));
        handleSend(lastUserMessage.content);
      }
    }
  };

  const handleRetry = () => {
    if (lastFailedPrompt && retryCount < 3) {
      setRetryCount((prev) => prev + 1);
      setError(null);
      handleSend(lastFailedPrompt);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      {/* Resize Handle */}
      <div
        className="hidden sm:block fixed top-0 h-full w-1.5 -ml-1.5 cursor-col-resize hover:bg-brand-500/30 transition-colors z-50"
        onMouseDown={() => setIsResizing(true)}
        style={{ left: `calc(100% - ${panelWidth}px)` }}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize AI panel"
      />
      <div
        className="hidden sm:block fixed right-0 top-0 h-full bg-surface/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col"
        style={{ width: `${panelWidth}px` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-brand-500/5 via-transparent to-transparent">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500/20 blur-lg rounded-full" />
              <Bot className="text-brand-400 relative" size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">
                AI Reading Coach
              </h2>
              <p className="text-[10px] text-slate-400">
                Think like an examiner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 text-slate-400 hover:text-white"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Personality Selector */}
        <div className="p-3 border-b border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent">
          <label className="text-[10px] font-medium text-slate-400 mb-1.5 block uppercase tracking-wider">
            Coach Personality
          </label>
          <div className="flex gap-1.5">
            <button
              onClick={() => onPersonalityChange("friendly")}
              className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-200 ${
                personality === "friendly"
                  ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300"
              }`}
            >
              😊 Friendly
            </button>
            <button
              onClick={() => onPersonalityChange("strict")}
              className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-200 ${
                personality === "strict"
                  ? "bg-blue-500/20 border border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/10"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300"
              }`}
            >
              📋 Strict
            </button>
            <button
              onClick={() => onPersonalityChange("savage")}
              className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-200 ${
                personality === "savage"
                  ? "bg-brand-500/20 border border-brand-500/50 text-brand-300 shadow-lg shadow-brand-500/10"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300"
              }`}
            >
              😈 Savage
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isNotConfigured && (
            <div className="text-center py-8">
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full animate-pulse" />
                <Sparkles className="text-brand-400 relative" size={28} />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1.5">
                AI Coach Coming Soon
              </h3>
              <p className="text-slate-400 text-xs max-w-[200px] mx-auto leading-relaxed">
                Get personalized IELTS reading guidance powered by AI.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20">
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                <span className="text-xs text-brand-300 font-medium">
                  In Development
                </span>
              </div>
            </div>
          )}

          {messages.length === 0 && !isNotConfigured && (
            <div className="text-center py-6">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full" />
                <Sparkles className="text-brand-400 relative" size={32} />
              </div>
              <h3 className="text-white font-semibold text-base mb-2">
                Welcome to AI Reading Coach
              </h3>
              <p className="text-slate-400 text-sm max-w-[220px] mx-auto leading-relaxed mb-6">
                Ask me anything about the passage, questions, or IELTS
                strategies.
              </p>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                  Try asking:
                </p>
                {SUGGESTED_PROMPTS.filter(
                  (p) => !p.personality || p.personality === personality,
                )
                  .slice(0, 4)
                  .map((suggestion) => (
                    <button
                      key={suggestion.label}
                      onClick={() => handleSend(suggestion.prompt)}
                      disabled={isLoading}
                      className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-500/30 text-sm text-slate-300 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <span className="mr-2 text-lg">{suggestion.icon}</span>
                      <span className="group-hover:translate-x-1 transition-transform inline-block">
                        {suggestion.label}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                  <Bot size={16} className="text-brand-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-brand-500/20 text-brand-100"
                    : "bg-white/5 text-slate-200"
                }`}
              >
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(message.content),
                  }}
                />
                {message.role === "assistant" && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleCopy(message.content)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                      title="Copy message"
                    >
                      <Copy size={12} />
                      Copy
                    </button>
                    {!isLoading && (
                      <button
                        onClick={handleRegenerate}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                        title="Regenerate response"
                      >
                        <RotateCcw size={12} />
                        Regenerate
                      </button>
                    )}
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <User size={16} className="text-slate-400" />
                </div>
              )}
            </div>
          ))}

          {isLoading && streamingContent && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                <Bot size={16} className="text-brand-400" />
              </div>
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white/5 text-slate-200">
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(streamingContent),
                  }}
                />
                <span className="inline-block w-0.5 h-5 bg-brand-400 ml-1 animate-blink" />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3">
              <p className="text-rose-300 text-sm mb-2">{error}</p>
              {retryCount < 3 && (
                <button
                  onClick={handleRetry}
                  className="text-xs text-rose-400 hover:text-rose-300 underline"
                >
                  Retry (Attempt {retryCount + 1}/3)
                </button>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {messages.length === 0 && (
          <div className="p-3 border-t border-white/10">
            <div className="grid grid-cols-2 gap-1.5">
              {SUGGESTED_PROMPTS.filter(
                (p) => !p.personality || p.personality === personality,
              ).map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => handleSend(suggestion.prompt)}
                  disabled={isLoading}
                  className="text-left px-2 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="mr-1">{suggestion.icon}</span>
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything... (Shift+Enter for new line)"
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 resize-none disabled:opacity-50"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <div className="sm:hidden fixed inset-0 z-50 flex flex-col bg-surface">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Bot className="text-brand-400" size={20} />
            <h2 className="font-semibold text-white">AI Reading Coach</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Personality Selector */}
        <div className="p-3 border-b border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent">
          <label className="text-[10px] font-medium text-slate-400 mb-1.5 block uppercase tracking-wider">
            Coach Personality
          </label>
          <div className="flex gap-1.5">
            <button
              onClick={() => onPersonalityChange("friendly")}
              className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-200 ${
                personality === "friendly"
                  ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300"
              }`}
            >
              😊 Friendly
            </button>
            <button
              onClick={() => onPersonalityChange("strict")}
              className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-200 ${
                personality === "strict"
                  ? "bg-blue-500/20 border border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/10"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300"
              }`}
            >
              📋 Strict
            </button>
            <button
              onClick={() => onPersonalityChange("savage")}
              className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-200 ${
                personality === "savage"
                  ? "bg-brand-500/20 border border-brand-500/50 text-brand-300 shadow-lg shadow-brand-500/10"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300"
              }`}
            >
              😈 Savage
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isNotConfigured && (
            <div className="text-center py-8">
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full animate-pulse" />
                <Sparkles className="text-brand-400 relative" size={28} />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1.5">
                AI Coach Coming Soon
              </h3>
              <p className="text-slate-400 text-xs max-w-[200px] mx-auto leading-relaxed">
                Get personalized IELTS reading guidance powered by AI.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20">
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                <span className="text-xs text-brand-300 font-medium">
                  In Development
                </span>
              </div>
            </div>
          )}

          {messages.length === 0 && !isNotConfigured && (
            <div className="text-center py-6">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full" />
                <Sparkles className="text-brand-400 relative" size={32} />
              </div>
              <h3 className="text-white font-semibold text-base mb-2">
                Welcome to AI Reading Coach
              </h3>
              <p className="text-slate-400 text-sm max-w-[220px] mx-auto leading-relaxed mb-6">
                Ask me anything about the passage, questions, or IELTS
                strategies.
              </p>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                  Try asking:
                </p>
                {SUGGESTED_PROMPTS.filter(
                  (p) => !p.personality || p.personality === personality,
                )
                  .slice(0, 4)
                  .map((suggestion) => (
                    <button
                      key={suggestion.label}
                      onClick={() => handleSend(suggestion.prompt)}
                      disabled={isLoading}
                      className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-500/30 text-sm text-slate-300 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <span className="mr-2 text-lg">{suggestion.icon}</span>
                      <span className="group-hover:translate-x-1 transition-transform inline-block">
                        {suggestion.label}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                  <Bot size={16} className="text-brand-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-brand-500/20 text-brand-100"
                    : "bg-white/5 text-slate-200"
                }`}
              >
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(message.content),
                  }}
                />
                {message.role === "assistant" && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleCopy(message.content)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                      title="Copy message"
                    >
                      <Copy size={12} />
                      Copy
                    </button>
                    {!isLoading && (
                      <button
                        onClick={handleRegenerate}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                        title="Regenerate response"
                      >
                        <RotateCcw size={12} />
                        Regenerate
                      </button>
                    )}
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <User size={16} className="text-slate-400" />
                </div>
              )}
            </div>
          ))}

          {isLoading && streamingContent && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                <Bot size={16} className="text-brand-400" />
              </div>
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white/5 text-slate-200">
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(streamingContent),
                  }}
                />
                <span className="inline-block w-0.5 h-5 bg-brand-400 ml-1 animate-blink" />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3">
              <p className="text-rose-300 text-sm mb-2">{error}</p>
              {retryCount < 3 && (
                <button
                  onClick={handleRetry}
                  className="text-xs text-rose-400 hover:text-rose-300 underline"
                >
                  Retry (Attempt {retryCount + 1}/3)
                </button>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {messages.length === 0 && (
          <div className="p-3 border-t border-white/10">
            <div className="grid grid-cols-2 gap-1.5">
              {SUGGESTED_PROMPTS.filter(
                (p) => !p.personality || p.personality === personality,
              ).map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => handleSend(suggestion.prompt)}
                  disabled={isLoading}
                  className="text-left px-2 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="mr-1">{suggestion.icon}</span>
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything... (Shift+Enter for new line)"
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 resize-none disabled:opacity-50"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
