/**
 * Vercel Serverless Proxy — TMDB API
 * Keeps the TMDB API key server-side. The browser never sees it.
 *
 * Usage: /api/tmdb?path=/trending/all/day&page=1
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB API key not configured on server' });
  }

  const { path, ...queryParams } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing "path" query parameter' });
  }

  try {
    const url = new URL(`https://api.themoviedb.org/3${path}`);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('language', 'en-US');

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url.toString());
    const data = await response.json();

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('[TMDB Proxy]', error.message);
    return res.status(500).json({ error: 'Failed to fetch from TMDB' });
  }
}
