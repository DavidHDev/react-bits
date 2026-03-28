import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://reactbits.dev';

const toSlug = name => name.toLowerCase().replace(/\s+/g, '-');
const categoriesPath = path.join(__dirname, '../src/constants/Categories.js');
const categoriesContent = fs.readFileSync(categoriesPath, 'utf-8');
const categoriesMatch = categoriesContent.match(/export const CATEGORIES\s*=\s*(\[[\s\S]*?\n\];)/);
if (!categoriesMatch) {
  throw new Error('Could not parse CATEGORIES from Categories.js');
}

const CATEGORIES = eval(categoriesMatch[1]);
const toolsPagePath = path.join(__dirname, '../src/pages/ToolsPage.jsx');
const toolsPageContent = fs.readFileSync(toolsPagePath, 'utf-8');
const toolIdMatches = toolsPageContent.matchAll(/id:\s*['"]([^'"]+)['"]/g);
const toolIds = [...toolIdMatches].map(m => m[1]);

const staticPages = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/showcase', priority: '0.8', changefreq: 'weekly' },
  { loc: '/sponsors', priority: '0.5', changefreq: 'monthly' },
  { loc: '/favorites', priority: '0.5', changefreq: 'monthly' }
];

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];

  let urls = [];

  staticPages.forEach(page => {
    urls.push({
      loc: `${BASE_URL}${page.loc}`,
      lastmod: today,
      changefreq: page.changefreq,
      priority: page.priority
    });
  });

  toolIds.forEach(toolId => {
    urls.push({
      loc: `${BASE_URL}/tools/${toolId}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.8'
    });
  });

  CATEGORIES.forEach(({ name, subcategories }) => {
    const categorySlug = toSlug(name);
    subcategories.forEach(subcategory => {
      if (subcategory === 'Index') return;
      urls.push({
        loc: `${BASE_URL}/${categorySlug}/${toSlug(subcategory)}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '0.7'
      });
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf-8');

  console.log(`✓ Sitemap generated with ${urls.length} URLs`);
  console.log(`  Output: ${outputPath}`);
}

generateSitemap();
