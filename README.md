# CineScope

A global cinema discovery app — browse movies, TV shows, and anime from around the world, powered by TMDB and Gemini AI.

## Features

- 🎬 Browse movies and TV shows by genre, region, and popularity
- 📺 Full anime discovery via Jikan/AniList integration
- 🔍 Universal search across all media types
- 🤖 AI-powered recommendations via Google Gemini
- 📋 Personal watchlist with sync
- 🌍 Regional cinema filters (19 regions worldwide)
- 🎨 Light / dark mode
- ⚡ Deployed on Vercel with serverless API routes

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Styling | CSS custom properties + fluid type scale |
| APIs | TMDB, Trakt, Jikan, Google Gemini |
| Deployment | Vercel (serverless functions) |

## Getting Started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

## Environment Variables

See `.env.example` for the full list of required keys.

## Deployment

This project is configured for one-click deployment on Vercel. Push to `master` and Vercel will build and deploy automatically.

## License

MIT
