const express = require('express');
const { find, findOne, insert, update } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const activities = find('planner_activities', a => a.student_id === req.user.id);
  activities.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
  res.json(activities);
});

router.post('/', authMiddleware, (req, res) => {
  const { title, description, scheduledDate, type } = req.body;
  const activity = insert('planner_activities', {
    student_id: req.user.id, type: type || 'custom', content_id: null,
    title, description: description || '', scheduled_date: scheduledDate,
    completed: false, completed_at: null, xp_reward: 10, is_auto_generated: false,
  });
  res.status(201).json(activity);
});

router.put('/:id/complete', authMiddleware, (req, res) => {
  const activity = update('planner_activities',
    a => a.id === req.params.id && a.student_id === req.user.id,
    { completed: true, completed_at: new Date().toISOString() });
  if (!activity) return res.status(404).json({ message: 'Activity not found' });

  const xp = activity.xp_reward || 10;
  const progress = findOne('progress', p => p.student_id === req.user.id);
  if (progress) {
    progress.total_xp = (progress.total_xp || 0) + xp;
    progress.last_activity_at = new Date().toISOString();
  }
  res.json({ ...activity, xp_awarded: xp });
});

module.exports = router;
