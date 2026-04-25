const express = require('express');
const { findOne, find, uuidv4 } = require('../db/memory-store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// In-memory cache for synced content (keyed by notesId)
const syncCache = {};

// ── MOCK DATA GENERATOR ──
function generateMockPool(notesContent, title) {
  const lines = (notesContent || '').split('\n').filter(l => l.trim().length > 10);
  const concepts = lines
    .filter(l => l.trim().startsWith('- ') || l.trim().startsWith('### ') || l.trim().startsWith('## '))
    .map(l => l.replace(/^[-#\s*]+/, '').replace(/\*+/g, '').trim())
    .filter(l => l.length > 3)
    .slice(0, 12);

  if (concepts.length < 4) {
    concepts.push('Core Concept', 'Key Principle', 'Main Idea', 'Fundamental Theory');
  }

  const quiz = concepts.slice(0, 6).map((c, i) => ({
    id: `quiz-${uuidv4()}`,
    type: 'mcq',
    content: `Which of the following best describes "${c}"?`,
    options: [
      `It is a core concept in ${title}`,
      `It contradicts the main theory`,
      `It is unrelated to ${title}`,
      `None of the above`
    ],
    correctAnswer: `It is a core concept in ${title}`,
    explanation: `"${c}" is a key concept covered in this material.`,
    difficulty: i < 2 ? 'beginner' : i < 4 ? 'intermediate' : 'advanced',
    topicId: `t-${i % 3}`,
    hints: [`Think about the core themes of ${title}.`]
  }));

  const flashcards = concepts.slice(0, 6).map((c, i) => ({
    id: `fc-${uuidv4()}`,
    front: `Define: ${c}`,
    back: `${c} is a key concept in ${title} that relates to the fundamental principles discussed in the material.`,
    topic: `t-${i % 3}`
  }));

  const scenario = concepts.slice(0, 4).map((c, i) => ({
    id: `sc-${uuidv4()}`,
    type: 'story_scenario',
    scenario: `You are a researcher working on a project related to ${title}. Your team lead asks you to explain the role of "${c}" in your current experiment.`,
    content: `How would you explain the importance of "${c}" in this context?`,
    storyContext: `In a real-world laboratory setting, understanding ${c} is critical.`,
    characterDialogue: `"Can you walk me through how ${c} applies here?" asks the team lead.`,
    options: [
      `${c} provides the foundational framework for understanding this area`,
      `${c} is only relevant in theoretical contexts`,
      `${c} has been disproven by recent research`,
      `${c} is an advanced topic beyond our current scope`
    ],
    correctAnswer: `${c} provides the foundational framework for understanding this area`,
    explanation: `${c} is integral to the real-world application discussed here.`,
    difficulty: 'intermediate',
    topicId: `t-${i % 3}`,
    hints: [`Consider how ${c} applies practically.`]
  }));

  const challenge = concepts.slice(0, 8).map((c, i) => ({
    id: `ch-${uuidv4()}`,
    type: 'mcq',
    content: `Quick recall: What is ${c}?`,
    options: [
      `A key concept in ${title}`,
      `An unrelated term`,
      `A deprecated theory`,
      `A mathematical formula`
    ],
    correctAnswer: `A key concept in ${title}`,
    explanation: `${c} is indeed a key concept.`,
    difficulty: i < 3 ? 'beginner' : i < 6 ? 'intermediate' : 'advanced',
    topicId: `t-${i % 3}`,
    hints: [`Recall the basics of ${title}.`]
  }));

  const weak = concepts.slice(0, 4).map((c, i) => ({
    id: `wk-${uuidv4()}`,
    type: 'mcq',
    content: `Which statement about "${c}" is most accurate?`,
    options: [
      `It is essential for understanding ${title}`,
      `It only applies to advanced cases`,
      `It has no practical applications`,
      `It was recently introduced`
    ],
    correctAnswer: `It is essential for understanding ${title}`,
    explanation: `${c} is a foundational element of this topic.`,
    difficulty: 'intermediate',
    topicId: `t-${i % 3}`,
    hints: [`Review the foundational material.`]
  }));

  return { quiz, flashcards, scenario, challenge, weak };
}

// POST /api/practice/sync
// One-time content sync - generates all question types from notes
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { notesId } = req.body;
    if (!notesId) return res.status(400).json({ message: 'notesId is required' });

    // Check cache first
    if (syncCache[notesId]) {
      return res.json(syncCache[notesId]);
    }

    // Fetch notes content
    const notes = findOne('notes', n => n.id === notesId);
    if (!notes) return res.status(404).json({ message: 'Notes not found' });

    const useMock = process.env.MOCK_DATA === '1';

    let questions;
    
    if (useMock) {
      questions = generateMockPool(notes.content, notes.title);
    } else {
      // Use Featherless API for real generation
      const apiKey = process.env.FEATHERLESS_API_KEY;
      if (!apiKey) return res.status(500).json({ message: 'API key missing' });

      const systemPrompt = `You are an AI educational content generator. Given study material, generate a comprehensive question pool for multiple practice modes.

You MUST output a valid JSON object with exactly these keys:
- "quiz": Array of 6 MCQ objects for standard quiz mode
- "flashcards": Array of 6 flashcard objects for active recall
- "scenario": Array of 4 scenario-based question objects
- "challenge": Array of 8 quick-fire MCQ objects (mix of difficulties)
- "weak": Array of 4 targeted review MCQ objects

Each MCQ object format:
{"id":"unique","type":"mcq","content":"question text","options":["A","B","C","D"],"correctAnswer":"exact match to one option","explanation":"why","difficulty":"beginner|intermediate|advanced","topicId":"t-0","hints":["hint"]}

Each flashcard format:
{"id":"unique","front":"question","back":"answer","topic":"t-0"}

Each scenario format:
{"id":"unique","type":"story_scenario","scenario":"context story","content":"question","storyContext":"setting","characterDialogue":"dialogue","options":["A","B","C","D"],"correctAnswer":"exact match","explanation":"why","difficulty":"intermediate","topicId":"t-0","hints":["hint"]}

Output ONLY raw valid JSON. No markdown code blocks.`;

      const userPrompt = `Study Material:\n${notes.content.substring(0, 6000)}\n\nGenerate the complete question pool.`;

      try {
        const response = await fetch('https://api.featherless.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'Qwen/Qwen2.5-7B-Instruct',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 4000
          })
        });

        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        const contentText = data.choices[0].message.content;

        const match = contentText.match(/\{[\s\S]*\}/);
        const jsonStr = match ? match[0] : contentText;
        questions = JSON.parse(jsonStr);
      } catch (aiErr) {
        console.error('AI generation failed, falling back to mock:', aiErr.message);
        questions = generateMockPool(notes.content, notes.title);
      }
    }

    // Extract topic info from notes
    const topicLines = (notes.content || '').split('\n')
      .filter(l => l.trim().startsWith('## ') || l.trim().startsWith('### '))
      .map(l => l.replace(/^#+\s*/, '').replace(/\*+/g, '').trim())
      .filter(l => l.length > 2)
      .slice(0, 6);

    const topics = topicLines.map((name, i) => ({
      id: `t-${i}`,
      name,
      strength: Math.floor(Math.random() * 60) + 20
    }));

    const result = {
      setId: notesId,
      title: notes.title,
      topics,
      questions,
      syncedAt: new Date().toISOString()
    };

    // Cache the result
    syncCache[notesId] = result;

    res.json(result);
  } catch (err) {
    console.error('Practice sync error:', err);
    res.status(500).json({ message: 'Content sync failed' });
  }
});

// GET /api/practice/pool/:notesId
// Get cached question pool
router.get('/pool/:notesId', authMiddleware, (req, res) => {
  const pool = syncCache[req.params.notesId];
  if (!pool) return res.status(404).json({ message: 'No synced content found. Please sync first.' });
  res.json(pool);
});

// POST /api/practice/results
// Store practice session results
router.post('/results', authMiddleware, (req, res) => {
  try {
    const { mode, notesId, score, streak, totalQuestions, correctAnswers, topicPerformance } = req.body;
    
    // Update weak topics based on performance
    if (topicPerformance && syncCache[notesId]) {
      topicPerformance.forEach(tp => {
        const topic = syncCache[notesId].topics.find(t => t.id === tp.topicId);
        if (topic) {
          // Adjust strength based on accuracy
          const delta = tp.correct ? 5 : -8;
          topic.strength = Math.max(0, Math.min(100, topic.strength + delta));
        }
      });
    }

    // Update progress
    const progress = findOne('progress', p => p.student_id === req.user.id);
    if (progress) {
      const xpAwarded = Math.round(score / 10) * 5;
      progress.total_xp = (progress.total_xp || 0) + xpAwarded;
      progress.quizzes_completed = (progress.quizzes_completed || 0) + 1;
      progress.level = Math.floor(progress.total_xp / 500) + 1;
      progress.last_activity_at = new Date().toISOString();
    }

    res.json({ success: true, message: 'Results recorded' });
  } catch (err) {
    console.error('Results save error:', err);
    res.status(500).json({ message: 'Failed to save results' });
  }
});

// DELETE /api/practice/cache/:notesId
// Clear cached content (regenerate)
router.delete('/cache/:notesId', authMiddleware, (req, res) => {
  delete syncCache[req.params.notesId];
  res.json({ message: 'Cache cleared. Content will regenerate on next sync.' });
});

module.exports = router;
