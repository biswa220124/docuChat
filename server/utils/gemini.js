const OpenAI = require('openai');

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Generate a response using OpenRouter, grounded in the provided context chunks.
 */
async function chatWithContext(question, contextChunks) {
  const prompt =
    "Answer the question based only on the following context. If the answer is not in the context, say 'I could not find this in the uploaded documents.'\n\nContext:\n" +
    contextChunks.join('\n---\n') +
    '\n\nQuestion: ' +
    question;

  const completion = await openai.chat.completions.create({
    model: 'google/gemini-2.0-flash-001',
    messages: [{ role: 'user', content: prompt }],
  });

  return completion.choices[0].message.content;
}

/**
 * Get an embedding array for the given text (placeholder — not used in current chat flow).
 */
async function getEmbedding(text) {
  return [];
}

module.exports = { getEmbedding, chatWithContext };
