const express = require('express');
const { find, findOne, insert, update } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/flashcards/notes/:notesId/generate  — create cards from note content
router.post('/notes/:notesId/generate', authMiddleware, (req, res) => {
  const { notesId } = req.params;
  const { find: findAll, findOne, insert, uuidv4 } = require('../db/memory-store');

  const existing = find('flashcards', f => f.notes_id === notesId);
  if (existing.length > 0) {
    existing.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return res.json(existing);
  }

  const note = findOne('notes', n => n.id === notesId);
  if (!note) return res.status(404).json({ message: 'Note not found' });

  const content = note.content || '';
  const generated = [];

  // Parse bullet points as Q&A pairs
  const bullets = content.match(/^[-*] .+$/gm) || [];
  bullets.slice(0, 8).forEach((line, i) => {
    const text = line.replace(/^[-*] /, '').trim();
    if (text.length < 10) return;
    const isDefinition = text.includes(':');
    let front, back;
    if (isDefinition) {
      const [term, ...rest] = text.split(':');
      front = `What is ${term.trim()}?`;
      back = rest.join(':').trim();
    } else {
      front = `Explain: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"`;
      back = text;
    }
    generated.push(insert('flashcards', {
      notes_id: notesId,
      front,
      back,
      reviewed: false,
      created_at: new Date().toISOString(),
    }));
  });

  // Parse ## headings as concept cards
  const headings = content.match(/^## .+$/gm) || [];
  headings.slice(0, 4).forEach((h) => {
    const topic = h.replace(/^## /, '').trim();
    generated.push(insert('flashcards', {
      notes_id: notesId,
      front: `What is the main topic of "${topic}"?`,
      back: `This section covers key concepts related to: ${topic}`,
      reviewed: false,
      created_at: new Date().toISOString(),
    }));
  });

  if (generated.length === 0) {
    // Fallback: split content into sentences
    const sentences = content.replace(/^#+ .+$/gm, '').split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 20);
    sentences.slice(0, 5).forEach((s, i) => {
      generated.push(insert('flashcards', {
        notes_id: notesId,
        front: `Recall concept ${i + 1} from these notes.`,
        back: s,
        reviewed: false,
        created_at: new Date().toISOString(),
      }));
    });
  }

  generated.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  res.json(generated);
});

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
