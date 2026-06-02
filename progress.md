# CineScope Progress

## Fixed in this pass
- Public browsing works without Google login.
- Home, Movies, TV, Anime, Buzz, Search, Detail, Watchlist, For You, and Profile have guest-first paths.
- API traffic uses `/api/*` consistently in local dev and Vercel.
- Local watchlist, ratings, and profile stats persist in browser storage.
- Buzz/community sections fall back to TMDB data if Trakt is blocked.

## Later
- Fix Google sign-in and Google Drive sync.
- Verify OAuth redirect origins for local dev and the Vercel production domain.
- Re-enable cloud sync only after login is stable.
