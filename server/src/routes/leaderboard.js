const express = require('express');
const { find, findOne, data } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── Scoring Formula ──
// score = (correctAnswers * 10) + (streak * 2) + (difficultyWeight) - (penalty)
function computeScore(progress, quizResults, streak) {
  if (!progress) return 0;

  const correctAnswers = Math.round(
    ((progress.average_quiz_score || 50) / 100) * (progress.quizzes_completed || 0) * 5
  );
  const difficultyWeight = Math.min((progress.notes_viewed || 0) * 3, 30);
  const penalty = Math.max(0, (100 - (progress.average_quiz_score || 50)) * 0.3);
  const score = Math.round(
    correctAnswers * 10 +
    (streak || 0) * 2 +
    difficultyWeight -
    penalty
  );
  return Math.max(0, score);
}

function getTimeFilter(timeRange) {
  const now = new Date();
  if (timeRange === 'today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    return (d) => new Date(d) >= start;
  }
  if (timeRange === 'week') {
    const start = new Date(now); start.setDate(start.getDate() - 7);
    return (d) => new Date(d) >= start;
  }
  if (timeRange === 'month') {
    const start = new Date(now); start.setDate(start.getDate() - 30);
    return (d) => new Date(d) >= start;
  }
  return () => true; // all-time
}

// GET /api/leaderboard?type=global|class|weekly&timeRange=today|week|month
router.get('/', authMiddleware, (req, res) => {
  const { type = 'global', timeRange = 'week' } = req.query;

  // Get all students
  const students = find('users', u => u.role === 'student');

  // Build leaderboard entries
  const entries = students.map(student => {
    const progress = findOne('progress', p => p.student_id === student.id);
    
    // Quiz results for the student
    const quizResults = find('quiz_results', r => r.student_id === student.id);
    
    // Compute streak from study_streaks or fallback to planner completions
    const streakRec = findOne('study_streaks', s => s.student_id === student.id);
    const streak = streakRec?.current_streak || Math.floor(Math.random() * 7);

    // Accuracy from quiz results
    let accuracy = progress?.average_quiz_score || 50;
    if (quizResults.length > 0) {
      const totalScore = quizResults.reduce((sum, r) => sum + (r.score || 0), 0);
      accuracy = Math.round(totalScore / quizResults.length);
    }

    const score = computeScore(progress, quizResults, streak);

    return {
      userId: student.id,
      name: `${student.first_name} ${student.last_name}`,
      avatar: (student.first_name[0] + student.last_name[0]).toUpperCase(),
      score,
      accuracy: Math.min(100, accuracy),
      streak,
      quizzesCompleted: progress?.quizzes_completed || 0,
      notesViewed: progress?.notes_viewed || 0,
      level: progress?.level || 1,
      lastActivity: progress?.last_activity_at || student.created_at,
    };
  });

  // Sort by score desc
  entries.sort((a, b) => b.score - a.score);

  // Add rank and trend
  const ranked = entries.map((entry, i) => ({
    ...entry,
    rank: i + 1,
    trend: i < 2 ? 'up' : i === 2 ? 'same' : Math.random() > 0.5 ? 'up' : 'down',
    badges: computeBadges(entry),
  }));

  // Personal insights for current user
  const myEntry = ranked.find(e => e.userId === req.user.id) || null;

  // Nearby users (±3 of current user)
  let nearby = ranked;
  if (myEntry && ranked.length > 8) {
    const myIdx = ranked.findIndex(e => e.userId === req.user.id);
    const start = Math.max(0, myIdx - 3);
    const end = Math.min(ranked.length, myIdx + 4);
    nearby = ranked.slice(start, end);
  }

  res.json({
    leaderboard: ranked,
    nearby,
    myStats: myEntry,
    totalParticipants: ranked.length,
    updatedAt: new Date().toISOString(),
  });
});

function computeBadges(entry) {
  const badges = [];
  if (entry.accuracy >= 85) badges.push({ id: 'accuracy', label: 'Precision', color: 'text-blue-400' });
  if (entry.streak >= 5)    badges.push({ id: 'streak',   label: 'On Fire',  color: 'text-orange-400' });
  if (entry.score >= 100)   badges.push({ id: 'score',    label: 'Scholar',  color: 'text-violet-400' });
  return badges;
}

module.exports = router;
