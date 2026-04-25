const express = require('express');
const { find, findOne, insert, update, uuidv4 } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/notes/refine
router.post('/refine', authMiddleware, (req, res) => {
  try {
    const { lectureId, transcript } = req.body;
    const lecture = findOne('lectures', l => l.id === lectureId);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });

    const title = lecture.title;
    const sentences = (transcript || '').split(/[.!?]+/).filter(s => s.trim());
    let refined = `# ${title}\n\n## Overview\n${sentences.slice(0, 2).join('. ').trim()}.\n\n## Key Concepts\n`;
    sentences.slice(2).forEach(s => { refined += `- ${s.trim()}\n`; });
    refined += `\n## Summary\nThis lecture covered the fundamentals of ${title.toLowerCase()}.`;

    const notes = insert('notes', {
      lecture_id: lectureId, teacher_id: req.user.id, title, content: refined,
      language: 'en', is_original: true, parent_notes_id: null, published_at: null,
      version: 1, created_at: new Date().toISOString(),
    });
    res.status(201).json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/notes/teacher
router.get('/teacher', authMiddleware, (req, res) => {
  const notes = find('notes', n => n.teacher_id === req.user.id && n.is_original);
  notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(notes);
});

// GET /api/notes/student
router.get('/student', authMiddleware, (req, res) => {
  const notes = find('notes', n => n.published_at && n.is_original);
  notes.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  res.json(notes);
});

// GET /api/notes/:id
router.get('/:id', authMiddleware, (req, res) => {
  const language = req.query.language || 'en';
  let notes = findOne('notes', n => n.parent_notes_id === req.params.id && n.language === language);
  if (!notes) notes = findOne('notes', n => n.id === req.params.id);
  if (!notes) return res.status(404).json({ message: 'Notes not found' });
  res.json(notes);
});

// PUT /api/notes/:id
router.put('/:id', authMiddleware, (req, res) => {
  const { content } = req.body;
  const notes = update('notes', n => n.id === req.params.id && n.teacher_id === req.user.id,
    { content, version: (findOne('notes', n => n.id === req.params.id)?.version || 0) + 1 });
  if (!notes) return res.status(404).json({ message: 'Notes not found' });
  res.json(notes);
});

// POST /api/notes/:id/translate
router.post('/:id/translate', authMiddleware, (req, res) => {
  const { languages } = req.body;
  const original = findOne('notes', n => n.id === req.params.id);
  if (!original) return res.status(404).json({ message: 'Notes not found' });

  const translations = [];
  for (const lang of languages) {
    const t = insert('notes', {
      lecture_id: original.lecture_id, teacher_id: req.user.id, title: original.title,
      content: `[Translated to ${lang}]\n\n${original.content}`,
      language: lang, is_original: false, parent_notes_id: original.id,
      published_at: original.published_at, version: 1, created_at: new Date().toISOString(),
    });
    translations.push(t);
  }
  res.json({ translations, count: translations.length });
});

// POST /api/notes/:id/publish
router.post('/:id/publish', authMiddleware, (req, res) => {
  const notes = update('notes', n => n.id === req.params.id && n.teacher_id === req.user.id,
    { published_at: new Date().toISOString() });
  if (!notes) return res.status(404).json({ message: 'Notes not found' });
  res.json(notes);
});

module.exports = router;
