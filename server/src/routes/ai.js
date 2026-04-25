const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// In-memory store for document text contexts (mocking a vector DB)
const documentStore = {};

// POST /api/ai/upload-pdf
// Extracts text from uploaded PDF and stores it in context
router.post('/upload-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const data = await pdfParse(req.file.buffer);
    const docId = uuidv4();
    
    documentStore[docId] = {
      filename: req.file.originalname,
      text: data.text,
      uploadedAt: new Date().toISOString()
    };
    
    res.json({ 
      docId, 
      filename: req.file.originalname, 
      message: 'PDF processed successfully',
      pages: data.numpages
    });
  } catch (err) {
    console.error('PDF processing error:', err);
    res.status(500).json({ message: 'Failed to process PDF' });
  }
});

// POST /api/ai/chat
// Contextual chat using the uploaded document
router.post('/chat', async (req, res) => {
  try {
    const { message, docId } = req.body;
    
    let contextText = '';
    if (docId && documentStore[docId]) {
      contextText = documentStore[docId].text;
    }
    
    const apiKey = process.env.FEATHERLESS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Featherless API key is missing in .env' });
    }

    const systemPrompt = `You are a helpful AI learning assistant. Answer the user's question contextually using the provided document text. 
You MUST respond with a valid JSON object containing exactly these keys:
"answer": A clear, detailed explanation.
"keyPoints": An array of 2-3 brief string takeaways.
"example": A simple analogy or example.
Do not wrap the JSON in markdown code blocks. Just output raw valid JSON.`;

    const userPrompt = `Document Context:\n${contextText ? contextText.substring(0, 6000) : 'No document uploaded. Answer from general knowledge.'}\n\nQuestion: ${message}`;

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
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Featherless API Error:', errText);
      return res.status(response.status).json({ message: 'Featherless API request failed' });
    }

    const data = await response.json();
    const contentText = data.choices[0].message.content;
    
    let parsed;
    try {
      // Find JSON block if the model wrapped it in markdown
      const match = contentText.match(/\{[\s\S]*\}/);
      const jsonStr = match ? match[0] : contentText;
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON Parse Error:', e, 'Raw output:', contentText);
      // Fallback
      parsed = { answer: contentText, keyPoints: [], example: '' };
    }

    res.json({
      role: 'assistant',
      content: parsed.answer,
      structuredResponse: {
        answer: parsed.answer,
        keyPoints: Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0 ? parsed.keyPoints : undefined,
        example: parsed.example || undefined
      }
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ message: 'Chat generation failed' });
  }
});

// POST /api/ai/generate-tutor
// Generates an interactive tutor session (steps) from the uploaded document
router.post('/generate-tutor', async (req, res) => {
  try {
    const { docId } = req.body;
    let contextText = '';
    
    if (docId && documentStore[docId]) {
      contextText = documentStore[docId].text;
    } else {
      return res.status(400).json({ message: 'Valid document required' });
    }

    const apiKey = process.env.FEATHERLESS_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'API key missing' });

    const systemPrompt = `You are an AI Tutor creating an interactive lesson plan.
Based on the provided document text, extract the core concepts and create a step-by-step learning path.
You MUST output a valid JSON array of objects, where each object represents a step in the lesson.
There are two types of steps: "teach" and "ask". Alternate between teaching a concept and asking a question.

Each "teach" object must exactly match this format:
{
  "id": "unique-id",
  "type": "teach",
  "heading": "Concept Name",
  "content": "A short, engaging explanation of the concept (2-3 sentences max).",
  "keyPoints": ["Point 1", "Point 2"],
  "example": "A simple analogy."
}

Each "ask" object must exactly match this format:
{
  "id": "unique-id",
  "type": "ask",
  "content": "Let's check your understanding.",
  "question": {
    "type": "mcq",
    "text": "The question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The exact string of the correct option",
    "hint": "A helpful hint."
  }
}

Generate exactly 4 steps (Teach -> Ask -> Teach -> Ask).
Do NOT wrap the response in markdown code blocks. Just output raw valid JSON array.`;

    const userPrompt = `Document Context (first 6000 chars):\n${contextText.substring(0, 6000)}\n\nCreate the lesson plan array.`;

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
        temperature: 0.3
      })
    });

    if (!response.ok) throw new Error('Featherless API request failed');

    const data = await response.json();
    const contentText = data.choices[0].message.content;
    
    let parsed;
    try {
      const match = contentText.match(/\[[\s\S]*\]/);
      const jsonStr = match ? match[0] : contentText;
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON Parse Error in generate-tutor:', e);
      return res.status(500).json({ message: 'Failed to parse AI output into lesson plan' });
    }

    res.json({ steps: parsed });
  } catch (err) {
    console.error('Tutor generation error:', err);
    res.status(500).json({ message: 'Tutor generation failed' });
  }
});

// POST /api/ai/voice-chat
// Conversational AI for voice tutor — returns plain text answer for TTS
router.post('/voice-chat', async (req, res) => {
  try {
    const { message, history = [], context } = req.body;

    const apiKey = process.env.FEATHERLESS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Featherless API key missing' });
    }

    const contextBlock = context
      ? `\n\nThe student is currently studying the following notes — base your answers on this material:\n---\n${context.substring(0, 5000)}\n---\nIf the question relates to this content, answer from it directly. If it is unrelated, answer from your general knowledge.`
      : '';

    const systemPrompt = `You are Exceed, a knowledgeable AI tutor having a spoken conversation with a student.

Rules you MUST follow:
1. Answer DIRECTLY and ACCURATELY — do not make up facts.
2. Keep answers to 3-5 natural spoken sentences. No lists, no markdown, no bullet points.
3. Use simple, clear language suitable for text-to-speech — avoid symbols like *, #, >, etc.
4. If you don't know something, say so honestly and briefly.
5. Stay focused on what was asked — don't pad with unnecessary information.
6. Sound like a real teacher talking, not a textbook.${contextBlock}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.featherless.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages,
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Featherless voice-chat error:', errText);
      return res.status(response.status).json({ message: 'AI request failed' });
    }

    const data = await response.json();
    const answer = data.choices[0].message.content.trim()
      .replace(/\*\*/g, '').replace(/\*/g, '').replace(/#+/g, '').replace(/`/g, '');

    res.json({ answer });
  } catch (err) {
    console.error('voice-chat error:', err);
    res.status(500).json({ message: 'Voice chat failed' });
  }
});

// POST /api/ai/tts
// Convert text to speech using ElevenLabs
router.post('/tts', async (req, res) => {
  try {
    const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = req.body; // Default voice: Rachel
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ 
        message: 'ElevenLabs API key is missing. Please set ELEVENLABS_API_KEY in the backend .env file.',
        missingKey: true 
      });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.5 }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs Error:', errorText);
      return res.status(response.status).json({ message: 'ElevenLabs TTS failed' });
    }

    // Stream the audio buffer back to client
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ message: 'TTS generation failed' });
  }
});

module.exports = router;
