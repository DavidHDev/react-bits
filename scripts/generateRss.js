import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { componentMetadata } from '../src/constants/Information.js';
import { CHANGELOG_DESCRIPTION, getChangelogEntries } from '../src/utils/changelog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = 'https://reactbits.dev';
const OUTPUT = path.join(__dirname, '../public/rss.xml');
const LIMIT = 100;

const escapeXml = value =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const toRfc822 = date => new Date(`${date}T12:00:00Z`).toUTCString();

const undated = Object.entries(componentMetadata)
  .filter(([, meta]) => !/^\d{4}-\d{2}-\d{2}$/.test(meta.added || ''))
  .map(([key]) => key);
if (undated.length) {
  console.warn(`[rss] Add an "added" date (YYYY-MM-DD) in Information.js for: ${undated.join(', ')}`);
}

const entries = getChangelogEntries().slice(0, LIMIT);

const TITLE_PREFIX = { launch: 'New category', added: 'New', updated: 'Updated' };

const describe = entry =>
  entry.type === 'launch'
    ? `${entry.note} Launched with ${entry.components.length} components: ${entry.components.map(component => component.name).join(', ')}.`
    : entry.note;

const items = entries
  .map(entry =>
    [
      '    <item>',
      `      <title>${escapeXml(`${TITLE_PREFIX[entry.type]}: ${entry.name}`)}</title>`,
      `      <link>${SITE}${entry.path}</link>`,
      `      <guid isPermaLink="false">reactbits:${escapeXml(entry.id)}</guid>`,
      `      <pubDate>${toRfc822(entry.date)}</pubDate>`,
      `      <category>${escapeXml(entry.category)}</category>`,
      `      <description>${escapeXml(describe(entry))}</description>`,
      '    </item>'
    ].join('\n')
  )
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>React Bits changelog</title>
    <link>${SITE}/get-started/changelog</link>
    <description>${escapeXml(CHANGELOG_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${toRfc822(entries[0]?.date ?? new Date().toISOString().slice(0, 10))}</lastBuildDate>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

fs.writeFileSync(OUTPUT, xml);
console.log(`RSS feed written with ${entries.length} entries to ${path.relative(process.cwd(), OUTPUT)}`);
