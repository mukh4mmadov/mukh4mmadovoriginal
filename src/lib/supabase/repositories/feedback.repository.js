import { supabase } from "../client";
import { analyticsService } from "@/lib/analytics/analytics.service";

export class FeedbackRepository {
  async submitFeedback(data) {
    if (!supabase) {
      throw new Error(
        "Feedback service is unavailable because Supabase is not configured.",
      );
    }

    const sanitizedData = this.#sanitizeData(data);

    const { data: result, error } = await supabase
      .from("feedback_messages")
      .insert(sanitizedData)
      .select()
      .single();

    if (error) throw error;

    const userId = data.user_id ?? null;
    if (data.message_type === "bug") {
      await analyticsService.trackBugReportSubmitted(userId, result.id, {
        subject: data.subject,
      });
    } else {
      await analyticsService.trackFeedbackSubmitted(userId, result.id, {
        type: data.message_type,
      });
    }

    return result;
  }

  async getUserFeedback(userId) {
    const { data, error } = await supabase
      .from("feedback_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  #sanitizeData(data) {
    return {
      ...data,
      name: this.#escapeHtml(data.name),
      email: this.#escapeHtml(data.email),
      subject: this.#escapeHtml(data.subject),
      message: this.#escapeHtml(data.message),
      page_url: data.page_url ? this.#escapeHtml(data.page_url) : null,
    };
  }

  #escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

export const feedbackRepository = new FeedbackRepository();
