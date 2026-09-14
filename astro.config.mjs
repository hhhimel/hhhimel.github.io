// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// ─────────────────────────────────────────────────────────────
// GitHub Pages settings — this assumes you'll create a repo named
// exactly "hhhimel.github.io" (a user page), which serves at the
// root with no base path. If you'd rather use a different repo
// name (e.g. "portfolio"), set base: "/portfolio" below and it'll
// serve at hhhimel.github.io/portfolio/ instead.
// ─────────────────────────────────────────────────────────────
export default defineConfig({
  site: 'https://hhhimel.github.io',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
