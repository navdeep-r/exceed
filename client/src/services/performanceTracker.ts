import { PracticeMode } from '../types/practice';

const PERFORMANCE_KEY = 'exceed_performance_data';

export interface PerformanceRecord {
  setId: string;
  topic: string;
  questionId: string;
  correct: boolean;
  timestamp: string;
  mode: PracticeMode;
}

export interface TopicPerformance {
  topic: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  lastAttempted: string;
}

export const performanceTracker = {
  /**
   * Record a user's answer to a question
   */
  recordAnswer: (record: PerformanceRecord) => {
    try {
      const data = performanceTracker.getAllRecords();
      data.push(record);
      localStorage.setItem(PERFORMANCE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to record answer performance', e);
    }
  },

  /**
   * Get all performance records
   */
  getAllRecords: (): PerformanceRecord[] => {
    try {
      const dataStr = localStorage.getItem(PERFORMANCE_KEY);
      return dataStr ? JSON.parse(dataStr) : [];
    } catch (e) {
      console.error('Failed to get performance records', e);
      return [];
    }
  },

  /**
   * Get performance aggregated by topic for a specific set
   */
  getSetPerformance: (setId: string): TopicPerformance[] => {
    const records = performanceTracker.getAllRecords().filter(r => r.setId === setId);
    
    const topicMap = new Map<string, TopicPerformance>();
    
    for (const record of records) {
      const existing = topicMap.get(record.topic);
      
      if (existing) {
        existing.totalAttempts += 1;
        if (record.correct) {
          existing.correctAttempts += 1;
        }
        existing.accuracy = existing.correctAttempts / existing.totalAttempts;
        existing.lastAttempted = record.timestamp;
      } else {
        topicMap.set(record.topic, {
          topic: record.topic,
          totalAttempts: 1,
          correctAttempts: record.correct ? 1 : 0,
          accuracy: record.correct ? 1 : 0,
          lastAttempted: record.timestamp
        });
      }
    }
    
    return Array.from(topicMap.values()).sort((a, b) => a.accuracy - b.accuracy);
  },

  /**
   * Get weak topics (accuracy < 60%) for a specific set
   */
  getWeakTopics: (setId: string): TopicPerformance[] => {
    const performance = performanceTracker.getSetPerformance(setId);
    return performance.filter(p => p.accuracy < 0.6);
  },

  /**
   * Get all incorrect question IDs for a specific set
   */
  getIncorrectQuestionIds: (setId: string): string[] => {
    const records = performanceTracker.getAllRecords().filter(
      r => r.setId === setId && !r.correct
    );
    return [...new Set(records.map(r => r.questionId))];
  },

  /**
   * Get performance summary for a set
   */
  getPerformanceSummary: (setId: string): {
    totalQuestions: number;
    correctAnswers: number;
    overallAccuracy: number;
    weakTopicCount: number;
  } => {
    const records = performanceTracker.getAllRecords().filter(r => r.setId === setId);
    const correctAnswers = records.filter(r => r.correct).length;
    const weakTopics = performanceTracker.getWeakTopics(setId);
    
    return {
      totalQuestions: records.length,
      correctAnswers,
      overallAccuracy: records.length > 0 ? correctAnswers / records.length : 0,
      weakTopicCount: weakTopics.length
    };
  },

  /**
   * Clear performance data (optionally for a specific set)
   */
  clearPerformance: (setId?: string) => {
    try {
      if (setId) {
        // Remove records for specific set
        const data = performanceTracker.getAllRecords().filter(r => r.setId !== setId);
        localStorage.setItem(PERFORMANCE_KEY, JSON.stringify(data));
      } else {
        // Clear all performance data
        localStorage.removeItem(PERFORMANCE_KEY);
      }
    } catch (e) {
      console.error('Failed to clear performance data', e);
    }
  }
};
