"use client";

import { useState } from "react";
import {
  AlertTriangle,
  X,
  Bug,
  Lightbulb,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { feedbackRepository } from "@/lib/supabase/repositories/feedback.repository";
import { useAuth } from "@/contexts/AuthContext";
import Toast from "./Toast";

export default function ReportIssueButton() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.full_name || "",
    email: user?.email || "",
    message_type: "bug" as "bug" | "feature" | "incorrect_answer" | "general",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  type FeedbackMessageType = "bug" | "feature" | "incorrect_answer" | "general";

  function isFeedbackMessageType(value: string): value is FeedbackMessageType {
    return (
      value === "bug" ||
      value === "feature" ||
      value === "incorrect_answer" ||
      value === "general"
    );
  }

  const messageTypes = [
    { value: "bug", label: "Report a Bug", icon: Bug, color: "text-red-400" },
    {
      value: "feature",
      label: "Suggest a Feature",
      icon: Lightbulb,
      color: "text-yellow-400",
    },
    {
      value: "incorrect_answer",
      label: "Incorrect Answer",
      icon: AlertCircle,
      color: "text-orange-400",
    },
    {
      value: "general",
      label: "General Feedback",
      icon: MessageSquare,
      color: "text-blue-400",
    },
  ];

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await feedbackRepository.submitFeedback({
        user_id: user?.id || null,
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        message_type: formData.message_type,
        page_url: window.location.href,
        browser_info: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
        },
        screen_size: `${window.innerWidth}x${window.innerHeight}`,
      });

      setToastMessage("Thank you! Your report has been received.");
      setShowToast(true);
      setFormData({
        name: profile?.full_name || "",
        email: user?.email || "",
        message_type: "bug",
        subject: "",
        message: "",
      });
      setIsOpen(false);
    } catch (error: any) {
      setErrors({
        submit: error.message || "Failed to send report. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-brand-500 hover:bg-brand-600 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
        aria-label="Report an issue"
        title="Report an issue"
      >
        <AlertTriangle size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-200 mb-2 flex items-center gap-2">
                <AlertTriangle className="text-brand-400" size={24} />
                Report an Issue
              </h2>
              <p className="text-slate-400 text-sm">
                Help us improve by reporting bugs, suggesting features, or
                providing feedback
              </p>
            </div>

            {errors.submit && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-300 text-sm">{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Type of Report *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {messageTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          const value = type.value;
                          setFormData((prev) => ({
                            ...prev,
                            message_type: isFeedbackMessageType(value)
                              ? value
                              : "bug",
                          }));
                        }}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                          formData.message_type === type.value
                            ? "border-brand-500 bg-brand-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <Icon className={type.color} size={18} />
                        <span className="text-sm text-slate-200">
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                    errors.name ? "border-red-500" : "border-white/10"
                  }`}
                  placeholder="Your name"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                    errors.email ? "border-red-500" : "border-white/10"
                  }`}
                  placeholder="your@email.com"
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                    errors.subject ? "border-red-500" : "border-white/10"
                  }`}
                  placeholder="Brief description"
                  required
                />
                {errors.subject && (
                  <p className="mt-1 text-xs text-red-400">{errors.subject}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Details *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none ${
                    errors.message ? "border-red-500" : "border-white/10"
                  }`}
                  placeholder="Please provide as much detail as possible..."
                  required
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-400">{errors.message}</p>
                )}
              </div>

              <div className="text-xs text-slate-500">
                <p>System info will be automatically included:</p>
                <p>• Page: {window.location.href}</p>
                <p>
                  • Screen: {window.innerWidth}x{window.innerHeight}
                </p>
                <p>• User: {user?.id ? "Logged in" : "Guest"}</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Submit Report"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
