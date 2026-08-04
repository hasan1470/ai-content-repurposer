# Recast AI

Recast AI turns an article or video transcript into five editable, channel-ready assets and a seven-day publishing plan.

## What works

- Server-side OpenAI generation with structured output
- Automatic private local fallback when AI is unavailable
- LinkedIn, X, newsletter, summary, and Instagram assets
- Editable outputs and calendar ideas
- Copy, text export, and CSV calendar export
- `.txt` and `.md` import with drag-and-drop
- Create, update, search, open, and delete browser-local projects
- Configurable tone, audience, and generation mode
- Honest device-local activity metrics
- Responsive desktop and mobile interface

## Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Add an OpenAI API key to `.env.local` to enable model-powered generation:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-luna
```

The key is used only by the server route and is never sent to the browser. Without a key, every workflow remains usable through the private local drafting engine.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vinext development server |
| `npm run build` | Create the Cloudflare production build |
| `npm run test` | Build and verify rendered application HTML |
| `npm run lint` | Run ESLint |

## Data and privacy

Saved projects, preferences, and activity totals stay in browser storage. Local generation never uploads source material. In AI mode, source material is sent from the server to the configured OpenAI model to create the requested content suite.
