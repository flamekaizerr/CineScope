/**
 * @file Gemini AI service for CineScope.
 * Routes through /api/gemini serverless proxy in production to keep keys safe.
 */

import config from '../config/api.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Send a prompt to the Gemini API and return the text response.
 * Uses proxy in production, direct in local dev (if configured).
 * @param {string} prompt - full prompt text
 * @returns {Promise<string>} raw text response from the model
 */
async function geminiGenerate(prompt) {
  const contents = [{ parts: [{ text: prompt }] }];
  const generationConfig = {
    temperature: 0.8,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 4096,
  };

  let response;

  if (config.useDirectApi) {
    // Direct mode — key in URL (local dev only)
    const url = `${config.gemini.baseUrl}/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig }),
    });
  } else {
    // Proxy mode — key stays server-side
    response = await fetch(config.gemini.proxyPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.gemini.model,
        contents,
        generationConfig,
      }),
    });
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody?.error?.message || errorBody?.error || `Gemini request failed (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text;
}

/**
 * Attempt to parse a JSON block out of Gemini's response text.
 * Gemini sometimes wraps JSON in markdown code fences.
 * @param {string} text
 * @returns {any}
 */
function parseJsonFromResponse(text) {
  // Strip markdown code fences if present
  let cleaned = text.trim();

  // Match ```json ... ``` or ``` ... ```
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get AI-powered personalised recommendations based on a user profile.
 *
 * @param {object} userProfile
 * @param {Array<{title: string, type: string, rating?: number}>} [userProfile.watchHistory]
 * @param {Record<string, number>} [userProfile.ratings]
 * @param {string[]} [userProfile.favoriteGenres]
 * @param {string[]} [userProfile.dislikedGenres]
 * @param {string[]} [userProfile.preferredThemes]
 * @returns {Promise<Array<{title: string, type: string, year: number|string, reason: string, confidence: number}>>}
 */
export async function getRecommendations(userProfile = {}) {
  try {
    const {
      watchHistory = [],
      ratings = {},
      favoriteGenres = [],
      dislikedGenres = [],
      preferredThemes = [],
      watchlist = [],
    } = userProfile;

    // Build a richly detailed prompt
    const historyBlock = watchHistory.length
      ? watchHistory
          .slice(0, 40) // cap to keep prompt reasonable
          .map((item) => {
            const r = ratings[item.title] ?? item.rating;
            return `- "${item.title}" (${item.type})${r ? ` — rated ${r}/10` : ''}`;
          })
          .join('\n')
      : 'No watch history available yet.';

    const watchlistBlock = watchlist.length
      ? watchlist
          .slice(0, 40)
          .map((item) => `- "${item.title}" (${item.media_type || item.type})`)
          .join('\n')
      : 'No watchlist available yet.';

    const prompt = `You are a highly knowledgeable entertainment recommendation engine.
A user wants personalised movie, TV show, and anime recommendations.

=== USER PROFILE ===
Favorite genres: ${favoriteGenres.length ? favoriteGenres.join(', ') : 'Not specified'}
Disliked genres: ${dislikedGenres.length ? dislikedGenres.join(', ') : 'None'}
Preferred themes/moods: ${preferredThemes.length ? preferredThemes.join(', ') : 'Not specified'}

Watch history (with optional user ratings):
${historyBlock}

Watchlist (items they plan to watch):
${watchlistBlock}

=== INSTRUCTIONS ===
Based on the profile above, suggest 10 titles the user would love. Include a mix of movies, TV shows, and anime.
Do NOT recommend anything already in their watch history or watchlist.
For each recommendation provide:
- title (string)
- type ("movie", "tv", or "anime")
- year (number)
- reason (1-2 sentence explanation of why this fits the user)
- confidence (0-100 integer indicating how well this matches the user)

Respond with ONLY a valid JSON array. No extra text. Example format:
[
  { "title": "Inception", "type": "movie", "year": 2010, "reason": "...", "confidence": 92 }
]`;

    const rawText = await geminiGenerate(prompt);
    const parsed = parseJsonFromResponse(rawText);

    if (!Array.isArray(parsed)) {
      console.warn('[Gemini] Unexpected response shape, expected array');
      return [];
    }

    // Normalise and validate each recommendation
    return parsed
      .filter((item) => item && item.title)
      .map((item) => ({
        title: String(item.title),
        type: ['movie', 'tv', 'anime'].includes(item.type) ? item.type : 'movie',
        year: item.year ?? '',
        reason: item.reason ?? '',
        confidence: typeof item.confidence === 'number'
          ? Math.min(100, Math.max(0, Math.round(item.confidence)))
          : 50,
      }));
  } catch (error) {
    console.error('[Gemini] getRecommendations failed:', error.message);
    return [];
  }
}

/**
 * Get AI-generated insight about a specific title — why it's popular,
 * what makes it special, and who it's for.
 *
 * @param {string} title - the title name
 * @param {'movie'|'tv'|'anime'} [type='movie']
 * @returns {Promise<{summary: string, highlights: string[], audience: string, similarTitles: string[]}|null>}
 */
export async function getContentInsight(title, type = 'movie') {
  try {
    const prompt = `You are an entertainment expert. Provide a concise insight about the ${type} "${title}".

Answer these questions in your analysis:
1. A 2-3 sentence summary of why this title is notable or popular.
2. 3-5 bullet-point highlights (what makes it special, critical acclaim, cultural impact).
3. A one-sentence description of the ideal audience for this title.
4. 3-5 similar titles that fans of "${title}" would also enjoy.

Respond with ONLY valid JSON in this exact format:
{
  "summary": "...",
  "highlights": ["...", "..."],
  "audience": "...",
  "similarTitles": ["...", "..."]
}`;

    const rawText = await geminiGenerate(prompt);
    const parsed = parseJsonFromResponse(rawText);

    return {
      summary: parsed.summary ?? '',
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      audience: parsed.audience ?? '',
      similarTitles: Array.isArray(parsed.similarTitles)
        ? parsed.similarTitles
        : [],
    };
  } catch (error) {
    console.error('[Gemini] getContentInsight failed:', error.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

const geminiService = {
  getRecommendations,
  getContentInsight,
};

export default geminiService;
