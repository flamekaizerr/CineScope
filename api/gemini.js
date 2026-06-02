/**
 * Vercel Serverless Proxy — Google Gemini AI
 * Keeps the Gemini API key server-side. The browser never sees it.
 *
 * Usage: POST /api/gemini  { body: { contents: [...] } }
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured on server' });
  }

  try {
    const model = req.body?.model || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: req.body?.contents || [],
        generationConfig: req.body?.generationConfig || {
          temperature: 0.8,
          maxOutputTokens: 2048,
        },
      }),
    });

    const data = await response.json();

    // No caching for AI responses — they should be fresh
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('[Gemini Proxy]', error.message);
    return res.status(500).json({ error: 'Failed to fetch from Gemini' });
  }
}
