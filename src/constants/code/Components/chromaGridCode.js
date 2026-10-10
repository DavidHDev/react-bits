import code from '@content/Components/ChromaGrid/ChromaGrid.jsx?raw';
import css from '@content/Components/ChromaGrid/ChromaGrid.css?raw';
import tailwind from '@tailwind/Components/ChromaGrid/ChromaGrid.jsx?raw';
import tsCode from '@ts-default/Components/ChromaGrid/ChromaGrid.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/ChromaGrid/ChromaGrid.tsx?raw';

export const chromaGrid = {
  usage: `import ChromaGrid from './ChromaGrid'

const items = [
  {
    image: '/photos/field.jpg',
    title: 'Canola Field',
    subtitle: 'Midday',
    accent: '#ffd23f'
  },
  {
    image: '/photos/pier.jpg',
    title: 'The Pier',
    subtitle: 'Clear sky',
    accent: '#3fb8ff',
    url: 'https://example.com'
  }
];

<ChromaGrid items={items} columns={3} radius={260} />`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
