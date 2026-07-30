import { supabase } from '../client';
import { requireRows } from '../queryHelpers';
import { analyticsService } from '@/lib/analytics/analytics.service';

export interface FeedbackMessage {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  message_type: 'bug' | 'feature' | 'incorrect_answer' | 'general';
  page_url: string | null;
  browser_info: Record<string, any> | null;
  screen_size: string | null;
  created_at: string;
  status: 'new' | 'read' | 'replied';
}

export interface FeedbackInsert {
  user_id?: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  message_type?: 'bug' | 'feature' | 'incorrect_answer' | 'general';
  page_url?: string | null;
  browser_info?: Record<string, any> | null;
  screen_size?: string | null;
}

export class FeedbackRepository {
  async submitFeedback(data: FeedbackInsert): Promise<FeedbackMessage> {
    // Check rate limit
    const { data: rateCheck, error: rateError } = await supabase.rpc('check_rate_limit', {
      user_email: data.email
    });

    if (rateError || !rateCheck) {
      throw new Error('Rate limit exceeded. Please wait a few minutes before sending another message.');
    }

    // Sanitize inputs
    const sanitizedData = this.sanitizeData(data);

    const { data: result, error } = await supabase
      .from('feedback_messages')
      .insert(sanitizedData)
      .select()
      .single();

    if (error) throw error;

    // Track analytics
    const userId = data.user_id ?? null;
    if (data.message_type === 'bug') {
      await analyticsService.trackBugReportSubmitted(userId, result.id, { subject: data.subject });
    } else {
      await analyticsService.trackFeedbackSubmitted(userId, result.id, { type: data.message_type });
    }

    return result as FeedbackMessage;
  }

  async getUserFeedback(userId: string): Promise<FeedbackMessage[]> {
    return requireRows(
      supabase
        .from('feedback_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    );
  }

  private sanitizeData(data: FeedbackInsert): FeedbackInsert {
    return {
      ...data,
      name: this.escapeHtml(data.name),
      email: this.escapeHtml(data.email),
      subject: this.escapeHtml(data.subject),
      message: this.escapeHtml(data.message),
      page_url: data.page_url ? this.escapeHtml(data.page_url) : null,
    };
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

export const feedbackRepository = new FeedbackRepository();
