import { supabase } from '../client';
import { maybeRow, requireRow } from '../queryHelpers';
import {
  StudyStatistics,
  StudyStatisticsInsert,
  StudyStatisticsUpdate,
} from '../models';

export class StudyStatisticsRepository {
  /**
   * Get study statistics for a user
   */
  async getStatistics(userId: string): Promise<StudyStatistics | null> {
    return maybeRow(
      supabase
        .from('study_statistics')
        .select('*')
        .eq('user_id', userId)
        .single()
    );
  }

  /**
   * Create statistics record
   */
  async createStatistics(stats: StudyStatisticsInsert): Promise<StudyStatistics> {
    return requireRow(
      supabase
        .from('study_statistics')
        .insert(stats)
        .select()
        .single()
    );
  }

  /**
   * Update statistics
   */
  async updateStatistics(userId: string, updates: StudyStatisticsUpdate): Promise<StudyStatistics> {
    return requireRow(
      supabase
        .from('study_statistics')
        .update({ ...updates, last_updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single()
    );
  }

  /**
   * Update statistics after completing a passage
   */
  async updateAfterPassage(
    userId: string,
    score: number,
    bandScore: number,
    timeSpentSeconds: number,
    questionsAnswered: number,
    correctAnswers: number,
    category?: string
  ): Promise<StudyStatistics> {
    const stats = await this.getStatistics(userId);
    
    if (!stats) {
      return this.createStatistics({
        user_id: userId,
        total_passages_completed: 1,
        total_time_spent_seconds: timeSpentSeconds,
        average_score: score,
        average_band_score: bandScore,
        total_questions_answered: questionsAnswered,
        correct_answers: correctAnswers,
        accuracy_rate: (correctAnswers / questionsAnswered) * 100,
        strongest_category: category || null,
        weakest_category: category || null,
      });
    }

    const newTotalPassages = stats.total_passages_completed + 1;
    const newTotalTime = stats.total_time_spent_seconds + timeSpentSeconds;
    const newTotalQuestions = stats.total_questions_answered + questionsAnswered;
    const newCorrectAnswers = stats.correct_answers + correctAnswers;
    
    const newAverageScore = stats.average_score
      ? ((stats.average_score * stats.total_passages_completed + score) / newTotalPassages)
      : score;
    const newAverageBandScore = stats.average_band_score
      ? ((stats.average_band_score * stats.total_passages_completed + bandScore) / newTotalPassages)
      : bandScore;
    const newAccuracyRate = (newCorrectAnswers / newTotalQuestions) * 100;

    return this.updateStatistics(userId, {
      total_passages_completed: newTotalPassages,
      total_time_spent_seconds: newTotalTime,
      average_score: newAverageScore,
      average_band_score: newAverageBandScore,
      total_questions_answered: newTotalQuestions,
      correct_answers: newCorrectAnswers,
      accuracy_rate: newAccuracyRate,
    });
  }
}

export const studyStatisticsRepository = new StudyStatisticsRepository();
