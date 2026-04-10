const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const Document = require('../models/Document');
const Chat     = require('../models/Chat');
const { streamChatWithContext } = require('../utils/gemini');
const { rankChunks }           = require('../utils/tfidf');

/* ── In-memory rate limiter (no extra package needed) ──────────────────────
   Each user is allowed MAX_REQUESTS per WINDOW_MS.                          */
const WINDOW_MS    = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20;        // per user per minute
const rateBucket   = new Map(); // userId → { count, resetAt }

function rateLimit(req, res, next) {
  const userId = req.user?.id;
  if (!userId) return next();

  const now    = Date.now();
  const bucket = rateBucket.get(userId);

  if (!bucket || now > bucket.resetAt) {
    rateBucket.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (bucket.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      message: `Too many requests. Please wait ${retryAfter}s before trying again.`,
    });
  }

  bucket.count++;
  return next();
}

/* ── Simple in-memory response cache ───────────────────────────────────────
   Caches (userId + docIds + question) → answer string for CACHE_TTL ms.    */
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache     = new Map(); // key → { answer, sourceChunks, expiresAt }

function makeCacheKey(userId, documentIds, question) {
  const sortedIds = [...documentIds].sort().join(',');
  return `${userId}:${sortedIds}:${question.trim().toLowerCase()}`;
}

/* ─────────────────────────────────────────────────────────────────────────── */

// POST /api/chat  — streaming SSE response
router.post('/', auth, rateLimit, async (req, res) => {
  try {
    const { documentIds, question } = req.body;

    if (!documentIds?.length || !question) {
      return res.status(400).json({ message: 'documentIds and question are required' });
    }

    // ── Cache hit ──
    const cacheKey = makeCacheKey(req.user.id, documentIds, question);
    const cached   = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      console.log('Cache hit for:', question.slice(0, 40));
      // Even for cached hits, send via SSE so the frontend typewriter still works
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
      // Send full text in one shot (already computed)
      res.write(`data: ${JSON.stringify({ token: cached.answer })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, fullText: cached.answer, sourceChunks: cached.sourceChunks, cached: true })}\n\n`);
      return res.end();
    }

    // ── Fetch docs ──
    const documents = await Document.find({ _id: { $in: documentIds }, userId: req.user.id });
    if (!documents.length) {
      return res.status(404).json({ message: 'No matching documents found' });
    }

    // ── Collect all chunks from selected docs ──
    const allChunks = documents.flatMap(doc => doc.chunks.map(c => c.text));

    // ── TF-IDF ranking — pick top 6 most relevant chunks ──
    const rankedChunks = rankChunks(question, allChunks, 6);
    const topChunks    = rankedChunks.map(r => r.text);

    console.log(`[Chat] User ${req.user.id} | ${rankedChunks.length} chunks selected (TF-IDF) from ${allChunks.length} total`);

    // ── Stream response via SSE ──
    // streamChatWithContext takes over the res object
    const fullText = await streamChatWithContext(question, topChunks, res);

    // ── Persist chat + cache after stream completes ──
    if (fullText) {
      // Save to DB (async, don't await — don't block the response)
      Chat.create({ userId: req.user.id, documentIds, question, answer: fullText }).catch(console.error);

      // Store in cache
      cache.set(cacheKey, {
        answer: fullText,
        sourceChunks: topChunks,
        expiresAt: Date.now() + CACHE_TTL,
      });
    }
  } catch (err) {
    console.error('Chat error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate answer' });
    }
  }
});

// GET /api/chat/history
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
