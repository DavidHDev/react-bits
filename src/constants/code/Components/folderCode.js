import code from '@content/Components/Folder/Folder.jsx?raw';
import css from '@content/Components/Folder/Folder.css?raw';
import tailwind from '@tailwind/Components/Folder/Folder.jsx?raw';
import tsCode from '@ts-default/Components/Folder/Folder.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/Folder/Folder.tsx?raw';

export const folder = {
  usage: `import Folder from './Folder'

const items = [
  { title: 'Brand guidelines' },
  { title: 'Launch plan' },
  { image: '/photos/pier.jpg', title: 'The pier' }
];

<Folder
  label="Projects"
  items={items}
  onItemClick={(item, index) => console.log(item, index)}
/>

<Folder mode="book" variant="glass" color="#7aa7ff" label="Photos" items={items} />`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
