import { supabase } from '@/lib/supabase/client';

export type AnalyticsEventType =
  | 'user_registered'
  | 'user_login'
  | 'user_logout'
  | 'reading_started'
  | 'reading_finished'
  | 'question_answered'
  | 'passage_completed'
  | 'highlight_created'
  | 'highlight_removed'
  | 'ai_coach_opened'
  | 'ai_message_sent'
  | 'quote_saved'
  | 'feedback_submitted'
  | 'bug_report_submitted';

export interface AnalyticsEvent {
  event_type: AnalyticsEventType;
  metadata?: Record<string, any>;
}

export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async track(event: AnalyticsEvent, userId?: string | null): Promise<void> {
    try {
      const eventData = {
        user_id: userId || null,
        event_type: event.event_type,
        event_data: event.metadata || {},
        browser_info: this.getBrowserInfo(),
        device_info: this.getDeviceInfo(),
        page_url: typeof window !== 'undefined' ? window.location.href : null,
      };

      await supabase.from('analytics_events').insert(eventData);
    } catch (error) {
      // Silently fail to not disrupt user experience
    }
  }

  private getBrowserInfo(): Record<string, any> {
    if (typeof window === 'undefined') return {};

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
    };
  }

  private getDeviceInfo(): Record<string, any> {
    if (typeof window === 'undefined') return {};

    return {
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
    };
  }

  // Convenience methods for common events
  async trackUserRegistration(userId: string, metadata?: Record<string, any>): Promise<void> {
    await this.track({ event_type: 'user_registered', metadata }, userId);
  }

  async trackUserLogin(userId: string, metadata?: Record<string, any>): Promise<void> {
    await this.track({ event_type: 'user_login', metadata }, userId);
  }

  async trackUserLogout(userId: string, metadata?: Record<string, any>): Promise<void> {
    await this.track({ event_type: 'user_logout', metadata }, userId);
  }

  async trackReadingStarted(userId: string, passageId: string, metadata?: Record<string, any>): Promise<void> {
    await this.track({ event_type: 'reading_started', metadata: { passageId, ...metadata } }, userId);
  }

  async trackReadingFinished(userId: string, passageId: string, timeSpent: number, metadata?: Record<string, any>): Promise<void> {
    await this.track({ event_type: 'reading_finished', metadata: { passageId, timeSpent, ...metadata } }, userId);
  }

  async trackQuestionAnswered(userId: string, passageId: string, questionId: string, isCorrect: boolean, metadata?: Record<string, any>): Promise<void> {
    await this.track({ event_type: 'question_answered', metadata: { passageId, questionId, isCorrect, ...metadata } }, userId);
  }

  async trackPassageCompleted(userId: string, passageId: string, score: number, metadata?: Record<string, any>): Promise<void> {
    await this.track({ event_type: 'passage_completed', metadata: { passageId, score, ...metadata } }, userId);
  }

  async trackHighlightCreated(userId: string, passageId: string, metadata?: Record<string, any>): Promise<void> {
    await this.track({ event_type: 'highlight_created', metadata: { passageId, ...metadata } }, userId);
  }

  async trackHighlightRemoved(userId: string, passageId: string, metadata?: Record<string, any>): Promise<void> {
    await this.track({ event_type: 'highlight_removed', metadata: { passageId, ...metadata } }, userId);
  }

  async trackAICoachOpened(userId: string, passageId: string, metadata?: Record<string, any>): Promise<void> {
    await this.track({ event_type: 'ai_coach_opened', metadata: { passageId, ...metadata } }, userId);
  }

  async trackAIMessageSent(userId: string, passageId: string, metadata?: Record<string, any>): Promise<void> {
    await this.track({ event_type: 'ai_message_sent', metadata: { passageId, ...metadata } }, userId);
  }

  async trackQuoteSaved(userId: string, quoteId: string, metadata?: Record<string, any>): Promise<void> {
    await this.track({ event_type: 'quote_saved', metadata: { quoteId, ...metadata } }, userId);
  }

  async trackFeedbackSubmitted(userId: string | null, feedbackId: string, metadata?: Record<string, any>): Promise<void> {
    await this.track({ event_type: 'feedback_submitted', metadata: { feedbackId, ...metadata } }, userId);
  }

  async trackBugReportSubmitted(userId: string | null, feedbackId: string, metadata?: Record<string, any>): Promise<void> {
    await this.track({ event_type: 'bug_report_submitted', metadata: { feedbackId, ...metadata } }, userId);
  }
}

export const analyticsService = AnalyticsService.getInstance();
