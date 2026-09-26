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
import { parseAIResponse, formatParsedResponse } from "@/lib/ai/parseResponse";
import { useAuth } from "@/contexts/AuthContext";
import { analyticsService } from "@/lib/analytics/analytics.service";

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
    personality: "savage",
  },
];

function normalizeConversationMessages(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (message) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .slice(-49)
    .map((message) => ({
      id:
        typeof message.id === "string"
          ? message.id
          : `${Date.now()}-${Math.random()}`,
      role: message.role,
      content: message.content.trim().slice(0, 10000),
      timestamp:
        typeof message.timestamp === "number" ? message.timestamp : Date.now(),
    }));
}

export default function AIChatPanel({
  isOpen,
  onClose,
  context,
  personality,
  onPersonalityChange,
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedPrompt, setLastFailedPrompt] = useState(null);
  const [isNotConfigured, setIsNotConfigured] = useState(false);
  const [panelWidth, setPanelWidth] = useState(370);
  const [isResizing, setIsResizing] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const conversationKey = `ai-conversation-${context.passage.title}`;

  useEffect(() => {
    if (isOpen) {
      analyticsService.trackAICoachOpened(
        user?.id ?? null,
        context.passage.title,
      );
    }
  }, [isOpen, user?.id, context.passage.title]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(conversationKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            setMessages(normalizeConversationMessages(parsed.messages));
          }
        }
      } catch (e) {}
    }
  }, [conversationKey]);

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
        try {
          localStorage.clear();
        } catch (clearError) {}
      }
    }
  }, [messages, conversationKey]);

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

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (event) => {
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

  const handleSend = async (prompt) => {
    if (!prompt.trim() || isLoading) return;

    const userMessage = {
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

    analyticsService.trackAIMessageSent(
      user?.id ?? null,
      context.passage.title,
      {
        prompt: prompt.trim(),
      },
    );

    let assistantMessageId = null;

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...normalizeConversationMessages(messages),
            userMessage,
          ],
          context,
          personality,
          provider: "openai",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get AI response");
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };
      assistantMessageId = assistantMessage.id;

      setMessages((prev) => [...prev, assistantMessage]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let pending = "";

      const processLine = (line) => {
        if (!line.startsWith("data: ")) return;

        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") return;

        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          return;
        }

        if (parsed.error) throw new Error(parsed.error);

        if (typeof parsed.chunk === "string") {
          fullContent += parsed.chunk;
          setStreamingContent(fullContent);
        }

        if (parsed.done) {
          const content =
            typeof parsed.content === "string" ? parsed.content : fullContent;
          fullContent = content;
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessage.id
                ? { ...message, content }
                : message,
            ),
          );
        }
      };

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          pending += decoder.decode(value, { stream: true });
          const lines = pending.split("\n");
          pending = lines.pop() || "";

          for (const line of lines) {
            processLine(line.trimEnd());
          }
        }

        pending += decoder.decode();
        if (pending) processLine(pending.trimEnd());
      } else {
        throw new Error("The AI response stream was empty. Please try again.");
      }

      if (!fullContent.trim()) {
        throw new Error("The AI returned an empty response. Please try again.");
      }

      setRetryCount(0);
      setLastFailedPrompt(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get AI response";

      if (
        errorMessage.includes("AI service not configured") ||
        errorMessage.includes("not configured")
      ) {
        setIsNotConfigured(true);
        setError(null);
      } else {
        setError(errorMessage);
      }

      if (assistantMessageId) {
        setMessages((prev) =>
          prev.filter((message) => message.id !== assistantMessageId),
        );
      }
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const formatMessage = (content) => {
    const sanitized = content
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");

    const parsed = parseAIResponse(sanitized);
    const formatted = formatParsedResponse(parsed);

    return formatted
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /`(.*?)`/g,
        '<code class="bg-white/10 px-1 py-0.5 rounded text-sm">$1</code>',
      )
      .replace(/\n/g, "<br />");
  };

  const handleCopy = (content) => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(content);
    }
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isNotConfigured && (
            <div className="text-center py-8">
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full animate-pulse" />
                <Sparkles className="text-brand-400 relative" size={28} />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1.5">
                AI Coach needs an API key
              </h3>
              <p className="text-slate-400 text-xs max-w-[220px] mx-auto leading-relaxed">
                Create a key in OpenAI and add it to your local environment
                before restarting the app. Then the coach can generate reading
                feedback in real time.
              </p>
              <div className="mt-4 space-y-2 text-left text-xs text-slate-300">
                <p>1. Open: https://platform.openai.com/api-keys</p>
                <p>2. Create a new secret key</p>
                <p>3. Add OPENAI_API_KEY in .env.local</p>
              </div>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center w-full px-3 py-2 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-medium hover:bg-brand-500/20 transition-colors"
              >
                Get API key
              </a>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-amber-300 font-medium">
                  Requires API key
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

      <div className="sm:hidden fixed inset-0 z-50 flex flex-col bg-surface">
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isNotConfigured && (
            <div className="text-center py-8">
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full animate-pulse" />
                <Sparkles className="text-brand-400 relative" size={28} />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1.5">
                AI Coach needs an API key
              </h3>
              <p className="text-slate-400 text-xs max-w-[220px] mx-auto leading-relaxed">
                Create a key in OpenAI and add it to your local environment
                before restarting the app. Then the coach can generate reading
                feedback in real time.
              </p>
              <div className="mt-4 space-y-2 text-left text-xs text-slate-300">
                <p>1. Open: https://platform.openai.com/api-keys</p>
                <p>2. Create a new secret key</p>
                <p>3. Add OPENAI_API_KEY in .env.local</p>
              </div>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center w-full px-3 py-2 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-medium hover:bg-brand-500/20 transition-colors"
              >
                Get API key
              </a>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-amber-300 font-medium">
                  Requires API key
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
