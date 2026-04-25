import { practiceAPI } from '../api';
import { SyncedContentPool } from '../types/practice';

const CACHE_PREFIX = 'exceed_practice_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * ContentSyncService
 * 
 * Manages one-time content sync for all practice modes.
 * Uses localStorage as a first-level cache, with backend as source of truth.
 * Generate once → cache → serve all modes instantly.
 */
export const ContentSyncService = {

  /**
   * Get cached pool from localStorage
   */
  getCached(notesId: string): SyncedContentPool | null {
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}${notesId}`);
      if (!raw) return null;

      const cached = JSON.parse(raw);
      const age = Date.now() - new Date(cached.syncedAt).getTime();

      // Check TTL
      if (age > CACHE_TTL_MS) {
        localStorage.removeItem(`${CACHE_PREFIX}${notesId}`);
        return null;
      }

      return cached;
    } catch {
      return null;
    }
  },

  /**
   * Sync content: check local cache → backend cache → generate new
   */
  async sync(notesId: string, forceRefresh = false): Promise<SyncedContentPool> {
    // 1. Check local cache unless forcing refresh
    if (!forceRefresh) {
      const cached = this.getCached(notesId);
      if (cached) return cached;
    }

    // 2. Call backend sync (handles its own caching + AI generation)
    const pool = await practiceAPI.sync(notesId);

    // 3. Cache locally
    localStorage.setItem(`${CACHE_PREFIX}${notesId}`, JSON.stringify(pool));

    return pool;
  },

  /**
   * Get questions for a specific mode from the synced pool
   */
  getQuestionsForMode(pool: SyncedContentPool, mode: string, count?: number) {
    const modeMap: Record<string, any[]> = {
      'quiz': pool.questions.quiz || [],
      'flashcards': pool.questions.flashcards || [],
      'story': pool.questions.scenario || [],
      'challenge': pool.questions.challenge || [],
      'weak_areas': pool.questions.weak || [],
      'runner': pool.questions.quiz || [], // Runner uses quiz questions
    };

    let questions = modeMap[mode] || pool.questions.quiz || [];

    if (count) {
      questions = questions.sort(() => Math.random() - 0.5).slice(0, count);
    }

    return questions;
  },

  /**
   * Save results and update weak topics
   */
  async saveResults(
    mode: string,
    notesId: string,
    score: number,
    streak: number,
    totalQuestions: number,
    correctAnswers: number,
    topicPerformance?: { topicId: string; correct: boolean }[]
  ) {
    try {
      await practiceAPI.saveResults({
        mode,
        notesId,
        score,
        streak,
        totalQuestions,
        correctAnswers,
        topicPerformance
      });
    } catch (err) {
      console.error('Failed to save results:', err);
    }
  },

  /**
   * Clear cached content for a specific notes set
   */
  async clearCache(notesId: string) {
    localStorage.removeItem(`${CACHE_PREFIX}${notesId}`);
    try {
      await practiceAPI.clearCache(notesId);
    } catch {
      // Backend cache clear is best-effort
    }
  },

  /**
   * List all cached sets
   */
  listCachedSets(): { notesId: string; title: string; syncedAt: string }[] {
    const results: { notesId: string; title: string; syncedAt: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '');
          results.push({
            notesId: data.setId,
            title: data.title,
            syncedAt: data.syncedAt
          });
        } catch { /* skip corrupted entries */ }
      }
    }
    return results;
  }
};
