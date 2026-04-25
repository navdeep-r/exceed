const express = require('express');
const { find, findOne, insert, update, remove } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── Helper: enrich query with student name & reply count ──
function enrichQuery(q) {
  const student = findOne('users', u => u.id === q.student_id);
  const replies = find('query_replies', r => r.query_id === q.id);
  return {
    ...q,
    student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown',
    reply_count: replies.length,
    last_replied_at: replies.length > 0
      ? replies.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at
      : null,
  };
}

// POST /api/queries — Student creates a new query
router.post('/', authMiddleware, (req, res) => {
  const { title, body, class_id, subject, priority = 'normal' } = req.body;
  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ message: 'Title and body are required' });
  }
  const query = insert('queries', {
    student_id: req.user.id,
    title: title.trim(),
    body: body.trim(),
    class_id: class_id || null,
    subject: subject || 'General',
    priority,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  res.status(201).json(enrichQuery(query));
});

// GET /api/queries/student — Student's own queries
router.get('/student', authMiddleware, (req, res) => {
  const queries = find('queries', q => q.student_id === req.user.id);
  queries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(queries.map(enrichQuery));
});

// GET /api/queries/teacher — All queries (teacher inbox)
router.get('/teacher', authMiddleware, (req, res) => {
  const { status, subject } = req.query;
  let queries = find('queries', q => {
    if (status && q.status !== status) return false;
    if (subject && subject !== 'all' && q.subject !== subject) return false;
    return true;
  });
  queries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(queries.map(enrichQuery));
});

// GET /api/queries/:id — Get single query with all replies
router.get('/:id', authMiddleware, (req, res) => {
  const query = findOne('queries', q => q.id === req.params.id);
  if (!query) return res.status(404).json({ message: 'Query not found' });

  const replies = find('query_replies', r => r.query_id === query.id);
  replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // Enrich each reply with sender name
  const enrichedReplies = replies.map(r => {
    const sender = findOne('users', u => u.id === r.sender_id);
    return {
      ...r,
      sender_name: sender ? `${sender.first_name} ${sender.last_name}` : 'Unknown',
      sender_role: sender?.role || 'unknown',
    };
  });

  res.json({ ...enrichQuery(query), replies: enrichedReplies });
});

// POST /api/queries/:id/reply — Add a reply (student follow-up or teacher answer)
router.post('/:id/reply', authMiddleware, (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: 'Reply message is required' });

  const query = findOne('queries', q => q.id === req.params.id);
  if (!query) return res.status(404).json({ message: 'Query not found' });

  const reply = insert('query_replies', {
    query_id: req.params.id,
    sender_id: req.user.id,
    message: message.trim(),
    created_at: new Date().toISOString(),
  });

  // Auto-update status when teacher replies
  if (req.user.role === 'teacher') {
    update('queries', q => q.id === req.params.id, {
      status: 'answered',
      updated_at: new Date().toISOString(),
    });
  } else {
    // Student follow-up reopens if already answered
    if (query.status === 'answered') {
      update('queries', q => q.id === req.params.id, {
        status: 'pending',
        updated_at: new Date().toISOString(),
      });
    }
  }

  const sender = findOne('users', u => u.id === req.user.id);
  res.status(201).json({
    ...reply,
    sender_name: sender ? `${sender.first_name} ${sender.last_name}` : 'Unknown',
    sender_role: sender?.role || 'unknown',
  });
});

// PATCH /api/queries/:id/status — Teacher updates status
router.patch('/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'in_progress', 'answered', 'closed'];
  if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const query = update('queries', q => q.id === req.params.id, {
    status,
    updated_at: new Date().toISOString(),
  });
  if (!query) return res.status(404).json({ message: 'Query not found' });
  res.json(enrichQuery(query));
});

// DELETE /api/queries/:id — Student deletes own query
router.delete('/:id', authMiddleware, (req, res) => {
  const query = findOne('queries', q => q.id === req.params.id);
  if (!query) return res.status(404).json({ message: 'Not found' });
  if (query.student_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

  // Remove query + all replies
  remove('queries', q => q.id === req.params.id);
  remove('query_replies', r => r.query_id === req.params.id);
  res.status(204).end();
});

module.exports = router;
