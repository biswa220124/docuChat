/**
 * TF-IDF Cosine Similarity — pure JS, no external deps.
 * Replaces the old keyword-count scoring in chat.js.
 */

function tokenize(text) {
  return text.toLowerCase().match(/\b[a-z]{2,}\b/g) || [];
}

function buildTF(tokens) {
  const freq = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  const total = tokens.length || 1;
  const tf = {};
  for (const t in freq) tf[t] = freq[t] / total;
  return tf;
}

function buildIDF(chunks) {
  const N = chunks.length;
  const docFreq = {};
  for (const chunk of chunks) {
    const unique = new Set(tokenize(chunk));
    for (const t of unique) docFreq[t] = (docFreq[t] || 0) + 1;
  }
  const idf = {};
  for (const t in docFreq) idf[t] = Math.log((N + 1) / (docFreq[t] + 1)) + 1;
  return idf;
}

function tfidfVector(tokens, idf) {
  const tf = buildTF(tokens);
  const vec = {};
  for (const t in tf) vec[t] = tf[t] * (idf[t] || 1);
  return vec;
}

function cosineSim(a, b) {
  let dot = 0, magA = 0, magB = 0;
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of allKeys) {
    const av = a[k] || 0, bv = b[k] || 0;
    dot += av * bv;
    magA += av * av;
    magB += bv * bv;
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

/**
 * Rank chunks by TF-IDF cosine similarity to the query.
 * Returns the top-k most relevant chunks.
 */
function rankChunks(query, chunks, topK = 6) {
  if (!chunks.length) return [];
  const idf = buildIDF(chunks);
  const qVec = tfidfVector(tokenize(query), idf);
  const scored = chunks.map(text => ({
    text,
    score: cosineSim(qVec, tfidfVector(tokenize(text), idf)),
  }));
  scored.sort((a, b) => b.score - a.score);
  // If all scores are zero (no overlap at all), fallback to first topK
  const top = scored.slice(0, topK);
  if (top.every(s => s.score === 0)) return chunks.slice(0, topK).map(t => ({ text: t, score: 0 }));
  return top;
}

module.exports = { rankChunks };
