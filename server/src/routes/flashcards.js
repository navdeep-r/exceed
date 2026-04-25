const express = require('express');
const { find, findOne, insert, update } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/flashcards/notes/:notesId
router.get('/notes/:notesId', authMiddleware, (req, res) => {
  const cards = find('flashcards', f => f.notes_id === req.params.notesId);
  cards.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  res.json(cards);
});

// POST /api/flashcards/:id/review
router.post('/:id/review', authMiddleware, (req, res) => {
  update('flashcards', f => f.id === req.params.id, { reviewed: true });
  const progress = findOne('progress', p => p.student_id === req.user.id);
  if (progress) {
    progress.flashcards_reviewed = (progress.flashcards_reviewed || 0) + 1;
    progress.total_xp = (progress.total_xp || 0) + 2;
    progress.last_activity_at = new Date().toISOString();
  }
  res.json({ success: true, xp_awarded: 2 });
});

module.exports = router;
