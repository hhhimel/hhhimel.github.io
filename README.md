# Field Log — Himel Ahmed's portfolio & daily log

Built with [Astro](https://astro.build) + MDX + Tailwind v4. Zero client-side
JS by default; content lives as plain Markdown/MDX files.

## Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:4321/portfolio/` (the `/portfolio/` base path matches
the GitHub Pages config below — change it if you rename the repo).

## Writing a new log entry (daily post)

Add a new file to `src/content/blog/`, e.g. `src/content/blog/2026-09-15-some-title.mdx`:

```mdx
---
title: "Your title"
date: 2026-09-15
summary: "One sentence for the log feed and RSS."
tags: ["genetics", "web-dev"]
---

Write in Markdown/MDX here. Push to `main` and GitHub Actions deploys it
automatically — that's the whole workflow for a daily post.
```

Set `draft: true` in the frontmatter to keep a post out of the feed until
it's ready.

## Adding a project ("specimen")

Add a file to `src/content/projects/`:

```yaml
---
title: "Project name"
summary: "One sentence."
stack: ["Tech", "Tech"]
liveUrl: "https://..."   # optional
codeUrl: "https://github.com/..."  # optional
order: 3
---
```

## Before you deploy

Config is already set for `hhhimel.github.io` as a **user page** (site
lives at the root, no base path). This only works if you name the GitHub
repo **exactly** `hhhimel.github.io`.

If you'd rather use a different repo name (e.g. `portfolio`), add a `base`
line to `astro.config.mjs`:

```js
export default defineConfig({
  site: 'https://hhhimel.github.io',
  base: '/portfolio',   // <- add this line
  ...
});
```

Still to fill in once you have them:
- LinkedIn / ResearchGate links in `src/pages/about.astro`
- Real `liveUrl` for CampusAssist in `src/content/projects/campusassist.md`
  (currently a placeholder) and confirm the `codeUrl` repo names match your
  actual GitHub repos

## Deploying to GitHub Pages (free)

1. Create a GitHub repo named `hhhimel.github.io` (or update `base` per above).
2. Push this project to it.
3. In the repo settings → **Pages**, set **Source** to "GitHub Actions".
4. Push to `main` — `.github/workflows/deploy.yml` builds and deploys
   automatically. Your site goes live at `https://hhhimel.github.io`.

## Optional: adding full-text search

This scaffold doesn't include a search index yet since it needs at least a
few posts to be worth it. When you're ready:

```bash
npm install -D pagefind
```

Add `npx pagefind --site dist` as a post-build step in the GitHub Actions
workflow (after `npm run build`), then drop in Pagefind's UI script on your
pages. See https://pagefind.app for the exact snippet.

## Optional: comments via GitHub Discussions

[Giscus](https://giscus.app) turns GitHub Discussions into a comment widget —
free, and fits a GitHub-hosted site well. Generate your embed snippet at
giscus.app and drop it into `PostLayout.astro` under the post content.
