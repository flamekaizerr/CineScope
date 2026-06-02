/**
 * Vercel Serverless Proxy — Trakt API
 * Keeps the Trakt Client ID server-side. The browser never sees it.
 *
 * Usage: /api/trakt?path=/movies/trending
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const clientId = process.env.TRAKT_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'Trakt Client ID not configured on server' });
  }

  const { path, ...queryParams } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing "path" query parameter' });
  }

  try {
    const url = new URL(`https://api.trakt.tv${path}`);
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': clientId,
      },
    });

    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('[Trakt Proxy]', error.message);
    return res.status(500).json({ error: 'Failed to fetch from Trakt' });
  }
}
