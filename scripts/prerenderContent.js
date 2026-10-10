import { CATEGORY_SEO } from '../src/utils/seo.js';
import { TOOLS } from '../src/constants/Tools.js';
import { SHOWCASE_ITEMS } from '../src/constants/Showcase.js';
import { getChangelogEntries } from '../src/utils/changelog.js';

export const escapeHtml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const link = (href, label) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
const paragraph = text => `<p>${escapeHtml(text)}</p>`;
const grid = entries =>
  `<ul class="rb-static-grid">${entries.map(item => `<li>${link(item.path, item.name)}${item.description ? paragraph(item.description) : ''}</li>`).join('')}</ul>`;
const categories = () =>
  grid(Object.values(CATEGORY_SEO).map(page => ({ name: page.heading, path: page.path, description: page.intro })));

const pageBody = page => {
  if (page.kind === 'home')
    return `<h2>Explore the library</h2>${categories()}
    <h2>Install the source you need</h2>${paragraph('Choose JavaScript or TypeScript, with plain CSS or Tailwind. Copy the source or install a component with the CLI.')}
    ${link('/get-started/installation', 'Installation guide')}`;
  if (page.kind === 'catalog')
    return grid(page.items.map(item => ({ name: item.name, path: item.path, description: item.meta.description })));
  if (page.kind === 'component')
    return `
    <nav aria-label="Component category">${link(page.category.path, page.category.name)}</nav>
    ${page.previewImage ? `<img src="${escapeHtml(page.previewImage)}" alt="${escapeHtml(page.imageAlt)}" width="1200" height="630" />` : ''}
    <h2>Use ${escapeHtml(page.heading)} in your project</h2>
    ${paragraph('Choose JavaScript or TypeScript and plain CSS or Tailwind. Enable JavaScript for the interactive preview, customization controls and source tabs.')}
    ${page.installCommand ? `<pre><code>${escapeHtml(page.installCommand)}</code></pre>` : ''}
    ${link('/get-started/installation', 'How to install React Bits components')}
    <h2>Related components</h2>${grid(page.related)}`;
  if (page.kind === 'tool')
    return paragraph(
      'Enable JavaScript to use the interactive editor. Your editor settings can be adjusted in the browser.'
    );
  switch (page.canonicalPath) {
    case '/tools':
      return grid(TOOLS.map(tool => ({ name: tool.label, path: tool.path, description: tool.description })));
    case '/get-started/installation':
      return `<h2>With the CLI</h2><pre><code>npx shadcn@latest add @react-bits/SplitText-TS-TW</code></pre>
        ${paragraph('Swap SplitText for your chosen component. The ending picks the variant: JS or TS, then CSS or TW. Import the installed component and render it in your React app.')}
        <h2>By hand</h2>${paragraph('Open a component’s Code tab, choose your language and styling, copy the files into your project and install the dependencies listed there.')}
        ${link('/text-animations/split-text', 'Try the Split Text example')}`;
    case '/get-started/changelog':
      return `<ol>${getChangelogEntries()
        .map(
          entry =>
            `<li><time datetime="${escapeHtml(entry.date)}">${escapeHtml(entry.date)}</time> ${link(entry.path, entry.name)}${paragraph(entry.note)}</li>`
        )
        .join('')}</ol>`;
    case '/get-started/introduction':
      return `<h2>Choose a component</h2>${paragraph('Browse by category or search for the interaction you need.')}${categories()}
        <h2>Make it yours</h2>${paragraph('Tune the preview and send settings to your usage code.')}
        <h2>Add it to your project</h2>${paragraph('Copy the source or install your chosen variant with the CLI.')}${link('/get-started/installation', 'Installation guide')}`;
    case '/get-started/mcp':
      return `<h2>Registry configuration</h2><pre><code>${escapeHtml(JSON.stringify({ registries: { '@react-bits': 'https://reactbits.dev/r/{name}.json' } }, null, 2))}</code></pre>
        ${paragraph('Add the registry to components.json. Follow the shadcn MCP setup for your coding client.')}
        ${link('https://ui.shadcn.com/docs/mcp', 'shadcn MCP documentation')}`;
    case '/showcase':
      return grid(SHOWCASE_ITEMS.map(item => ({ name: item.name, path: item.url, description: item.using })));
    case '/pro':
      return `<h2>Explore React Bits Pro</h2>${link('https://pro.reactbits.dev', 'Explore components, blocks, templates and plans')}`;
    case '/favorites':
      return paragraph('Enable JavaScript to view the components saved on this browser.');
    case '/sponsors':
      return `${link('https://github.com/sponsors/DavidHDev', 'Support React Bits on GitHub')}`;
    default:
      return '';
  }
};

export const renderContent = page => `<div class="rb-static" data-prerendered="true">
  <header>${link('/', 'React Bits')}<nav aria-label="Main navigation">
    ${link('/get-started/index', 'Components')}${link('/get-started/installation', 'Installation')}${link('/tools', 'Tools')}${link('/pro', 'Pro')}
  </nav></header>
  <main><h1>${escapeHtml(page.heading)}</h1>${paragraph(page.intro ?? page.description)}${pageBody(page)}</main>
  <footer>${link('/get-started/index', 'Browse all components')} · ${link('https://github.com/DavidHDev/react-bits', 'Source on GitHub')}</footer>
</div>`;
