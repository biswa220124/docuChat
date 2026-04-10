const OpenAI = require('openai');

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'DocuChat',
  },
});

const PRIMARY_MODEL  = 'google/gemini-2.0-flash-001';
const FALLBACK_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

function buildPrompt(question, contextChunks) {
  return (
    "You are a helpful document assistant. Answer the question based ONLY on the following context from the user's uploaded document. " +
    "If the answer is not found in the context, say 'I could not find this in the uploaded documents.' " +
    "Be concise and accurate.\n\nContext:\n" +
    contextChunks.join('\n---\n') +
    '\n\nQuestion: ' +
    question
  );
}

/**
 * Non-streaming: returns the full answer string.
 */
async function chatWithContext(question, contextChunks) {
  const prompt = buildPrompt(question, contextChunks);
  for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
      });
      return completion.choices[0].message.content;
    } catch (err) {
      console.error(`Model ${model} failed:`, err?.message);
    }
  }
  throw new Error('All models failed');
}

/**
 * Streaming: pipes token chunks straight into an Express response.
 * Caller must NOT have sent res.json() yet — this takes over the response.
 *
 * Protocol: Server-Sent Events (SSE)
 *   data: <token text>\n\n
 *   data: [DONE]\n\n
 */
async function streamChatWithContext(question, contextChunks, res) {
  const prompt = buildPrompt(question, contextChunks);

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if present
  res.flushHeaders?.();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    try {
      const stream = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      });

      let fullText = '';
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        if (token) {
          fullText += token;
          send({ token });
        }
      }
      send({ done: true, fullText });
      res.end();
      return fullText;
    } catch (err) {
      console.error(`Streaming model ${model} failed:`, err?.message);
      // try fallback
    }
  }

  // If both fail, send error event
  send({ error: 'Failed to generate response. Please try again.' });
  res.end();
}

module.exports = { chatWithContext, streamChatWithContext };
