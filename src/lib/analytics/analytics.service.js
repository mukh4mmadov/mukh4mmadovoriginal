import { supabase } from "@/lib/supabase/client";

export class AnalyticsService {
  constructor() {}

  static getInstance() {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async track(event, userId) {
    if (
      process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true" ||
      !supabase
    ) {
      return;
    }

    try {
      if (
        typeof window === "undefined" ||
        window.localStorage.getItem("analyticsConsent") !== "granted"
      ) {
        return;
      }

      const browserInfo = this.getBrowserInfo();
      const deviceInfo = this.getDeviceInfo();
      const pageUrl = typeof window !== "undefined"
        ? window.location.pathname.slice(0, 256)
        : null;
      const metadata = Object.fromEntries(
        Object.entries(event.metadata || {})
          .filter(([key, value]) =>
            !/(prompt|answer|content|message|email|name|text|token|url|bio)/i.test(key) &&
            (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
          )
          .map(([key, value]) => [
            key.slice(0, 64),
            typeof value === "string" ? value.slice(0, 128) : value,
          ])
      );

      const eventData = {
        user_id: userId || null,
        event_type: event.event_type,
        event_data: {
          ...metadata,
        },
        browser_info: browserInfo,
        device_info: deviceInfo,
        page_url: pageUrl,
      };

      const { error } = await supabase
        .from("analytics_events")
        .insert(eventData);
      if (error) return;
    } catch (error) {}
  }

  getBrowserInfo() {
    if (typeof window === "undefined") return {};

    return {
      language: navigator.language,
    };
  }

  getDeviceInfo() {
    if (typeof window === "undefined") return {};

    return {
      category: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
    };
  }

  async trackUserRegistration(
    userId,
    metadata,
  ) {
    await this.track({ event_type: "user_registered", metadata }, userId);
  }

  async trackUserLogin(
    userId,
    metadata,
  ) {
    await this.track({ event_type: "user_login", metadata }, userId);
  }

  async trackUserLogout(
    userId,
    metadata,
  ) {
    await this.track({ event_type: "user_logout", metadata }, userId);
  }

  async trackReadingStarted(
    userId,
    passageId,
    metadata,
  ) {
    await this.track(
      {
        event_type: "reading_started",
        metadata: { passageId, ...metadata },
      },
      userId,
    );
  }

  async trackReadingFinished(
    userId,
    passageId,
    timeSpent,
    metadata,
  ) {
    await this.track(
      {
        event_type: "reading_finished",
        metadata: { passageId, timeSpent, ...metadata },
      },
      userId,
    );
  }

  async trackQuestionAnswered(
    userId,
    passageId,
    questionId,
    isCorrect,
    metadata,
  ) {
    await this.track(
      {
        event_type: "question_answered",
        metadata: {
          passageId,
          questionId,
          isCorrect,
          ...metadata,
        },
      },
      userId,
    );
  }

  async trackPassageCompleted(
    userId,
    passageId,
    score,
    metadata,
  ) {
    await this.track(
      {
        event_type: "passage_completed",
        metadata: { passageId, score, ...metadata },
      },
      userId,
    );
  }



  async trackHighlightCreated(
    userId,
    passageId,
    metadata,
  ) {
    await this.track(
      {
        event_type: "highlight_created",
        metadata: { passageId, ...metadata },
      },
      userId,
    );
  }

  async trackHighlightRemoved(
    userId,
    passageId,
    metadata,
  ) {
    await this.track(
      {
        event_type: "highlight_removed",
        metadata: { passageId, ...metadata },
      },
      userId,
    );
  }



  async trackAICoachOpened(
    userId,
    passageId,
    metadata,
  ) {
    await this.track(
      {
        event_type: "ai_coach_opened",
        metadata: { passageId, ...metadata },
      },
      userId,
    );
  }

  async trackAIMessageSent(
    userId,
    passageId,
    metadata,
  ) {
    await this.track(
      {
        event_type: "ai_message_sent",
        metadata: { passageId, ...metadata },
      },
      userId,
    );
  }



  async trackQuoteSaved(
    userId,
    quoteId,
    metadata,
  ) {
    await this.track(
      {
        event_type: "quote_saved",
        metadata: { quoteId, ...metadata },
      },
      userId,
    );
  }



  async trackFeedbackSubmitted(
    userId,
    feedbackId,
    metadata,
  ) {
    await this.track(
      {
        event_type: "feedback_submitted",
        metadata: { feedbackId, ...metadata },
      },
      userId,
    );
  }

  async trackBugReportSubmitted(
    userId,
    feedbackId,
    metadata,
  ) {
    await this.track(
      {
        event_type: "bug_report_submitted",
        metadata: { feedbackId, ...metadata },
      },
      userId,
    );
  }
}

export const analyticsService = AnalyticsService.getInstance();
