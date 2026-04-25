const express = require('express');
const { find, findOne, insert } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  let progress = findOne('progress', p => p.student_id === req.user.id);
  if (!progress) {
    progress = insert('progress', { student_id: req.user.id, total_xp: 0, level: 1, notes_viewed: 0, quizzes_completed: 0, flashcards_reviewed: 0, average_quiz_score: 0, last_activity_at: new Date().toISOString() });
  }
  res.json(progress);
});

router.get('/students', authMiddleware, (req, res) => {
  const students = find('users', u => u.role === 'student');
  const result = students.map(s => {
    const p = findOne('progress', pr => pr.student_id === s.id) || {};
    return { id: s.id, first_name: s.first_name, last_name: s.last_name, email: s.email, total_xp: p.total_xp || 0, level: p.level || 1, notes_viewed: p.notes_viewed || 0, quizzes_completed: p.quizzes_completed || 0, flashcards_reviewed: p.flashcards_reviewed || 0, average_quiz_score: p.average_quiz_score || 0, last_activity_at: p.last_activity_at };
  });
  result.sort((a, b) => b.total_xp - a.total_xp);
  res.json(result);
});

module.exports = router;
