# Imptech Consolidated — Web Messenger

Static web messenger that runs on GitHub Pages.

Features:
- Multi-user chat (display-name based)
- Media uploads (images/videos) stored in-browser
- AI responses via OpenAI (paste key at runtime)
- Persistence via localStorage

To host:
1. Push files to GitHub repo.
2. Enable GitHub Pages (main branch, / root).
3. Open site URL and paste your OpenAI key using "Set OpenAI Key".

Security note: For production, run a backend proxy to keep the OpenAI API key secret. See optional server code in README (not included here).
