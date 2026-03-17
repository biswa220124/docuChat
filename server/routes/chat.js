const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const Chat = require('../models/Chat');
const { chatWithContext } = require('../utils/gemini');

// POST /api/chat — ask a question against selected documents
router.post('/', auth, async (req, res) => {
  try {
    const { documentIds, question } = req.body;

    if (!documentIds || !documentIds.length || !question) {
      return res
        .status(400)
        .json({ message: 'documentIds and question are required' });
    }

    // Fetch all chunks from the selected documents belonging to this user
    console.log('Searching for docs mapping to:', documentIds, 'for user:', req.user.id);
    const documents = await Document.find({
      _id: { $in: documentIds },
      userId: req.user.id,
    });
    console.log('Found docs:', documents.length);

    if (!documents.length) {
      return res.status(404).json({ message: 'No matching documents found' });
    }

    // Collect all chunks
    const allChunks = [];
    for (const doc of documents) {
      for (const chunk of doc.chunks) {
        allChunks.push(chunk.text);
      }
    }

    // Simple keyword relevance scoring
    const questionWords = question
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2); // ignore tiny words

    const scored = allChunks.map((text) => {
      const lower = text.toLowerCase();
      let score = 0;
      for (const word of questionWords) {
        if (lower.includes(word)) score++;
      }
      return { text, score };
    });

    // Pick top 5 chunks by score (fallback to first 5 if all score 0)
    scored.sort((a, b) => b.score - a.score);
    const top5 = scored.slice(0, 5).map((s) => s.text);

    // Call Gemini
    const answer = await chatWithContext(question, top5);

    // Save Q&A
    const chat = new Chat({
      userId: req.user.id,
      documentIds,
      question,
      answer,
    });
    await chat.save();

    res.json({ answer, sourceChunks: top5 });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ message: 'Failed to generate answer' });
  }
});

// GET /api/chat/history — last 20 chats for the logged-in user
router.get('/history', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('question answer documentIds createdAt');
    res.json(chats);
  } catch (err) {
    console.error('History error:', err.message);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

module.exports = router;
