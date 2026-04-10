const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const auth = require('../middleware/auth');
const Document = require('../models/Document');

// Multer config — memory storage, 10 MB limit, PDF only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// Split text into chunks of ~500 chars with 100-char overlap
function splitIntoChunks(text, chunkSize = 500, overlap = 100) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push({
      text: text.slice(start, end),
      chunkIndex: chunks.length,
    });
    start += chunkSize - overlap;
  }

  return chunks;
}

// POST /api/documents/upload — upload & parse a PDF
router.post('/upload', auth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file provided' });
    }

    // Extract text from PDF buffer
    const pdfData = await pdfParse(req.file.buffer);
    const fullText = pdfData.text;

    if (!fullText || fullText.trim().length === 0) {
      return res.status(400).json({ message: 'Could not extract text from PDF' });
    }

    // Chunk the text
    const chunks = splitIntoChunks(fullText);

    // Save to MongoDB
    const document = new Document({
      userId: req.user.id,
      filename: req.file.originalname,
      originalName: req.file.originalname,
      chunks,
    });

    await document.save();

    res.status(201).json({
      documentId: document._id,
      filename: document.originalName,
      chunkCount: chunks.length,
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ message: 'Failed to process PDF' });
  }
});

// GET /api/documents — list all docs for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id })
      .select('originalName createdAt chunks')
      .sort({ createdAt: -1 });

    const result = documents.map((doc) => ({
      id: doc._id,
      originalName: doc.originalName,
      createdAt: doc.createdAt,
      chunkCount: doc.chunks.length,
    }));

    res.json(result);
  } catch (err) {
    console.error('List documents error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/documents/:id — delete a document if it belongs to the user
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await document.deleteOne();
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/documents/:id — rename a document
router.patch('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    if (document.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    document.originalName = name.trim();
    await document.save();
    res.json({ message: 'Renamed', originalName: document.originalName });
  } catch (err) {
    console.error('Rename error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
