import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://breedhealth.org',
  output: 'static',
  integrations: [
    sitemap({
      entryLimit: 5000,
      serialize(item) {
        const path = item.url.replace('https://breedhealth.org', '');
        if (path === '/') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }
        // Directory pages and breed hubs
        if (/^\/(breeds|conditions|diet|compare|guides)\/$/.test(path) || /^\/breeds\/[^/]+\/$/.test(path)) {
          return { ...item, priority: 0.8, changefreq: 'weekly' };
        }
        return { ...item, priority: 0.6, changefreq: 'monthly' };
      },
    }),
    preact(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
