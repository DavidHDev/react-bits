import fs from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { SITE_URL } from '../src/utils/seo.js';
import { getSeoRoutes } from './seoRoutes.js';
import { escapeHtml } from './prerenderContent.js';

export const getLastModified = (metadata, today = new Date().toISOString().slice(0, 10)) => {
  const dates = [metadata?.added, ...(metadata?.updates ?? []).map(update => update.date)];
  return dates
    .filter(
      date =>
        typeof date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        !Number.isNaN(Date.parse(date)) &&
        new Date(date).toISOString().slice(0, 10) === date &&
        date <= today
    )
    .sort()
    .at(-1);
};

export const generateSitemap = () => {
  const pages = getSeoRoutes().filter(page => !page.robots?.includes('noindex'));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(page => {
    const lastmod = getLastModified(page.item?.meta);
    return `  <url>\n    <loc>${escapeHtml(`${SITE_URL}${page.path}`)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
  })
  .join('\n')}
</urlset>\n`;
  fs.writeFileSync(fileURLToPath(new URL('../public/sitemap.xml', import.meta.url)), xml);
  console.log(`Sitemap: ${pages.length} canonical public pages; lastmod uses recorded component release/update dates.`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) generateSitemap();
