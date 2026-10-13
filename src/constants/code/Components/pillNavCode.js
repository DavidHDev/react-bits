import code from '@content/Components/PillNav/PillNav.jsx?raw';
import css from '@content/Components/PillNav/PillNav.css?raw';
import tailwind from '@tailwind/Components/PillNav/PillNav.jsx?raw';
import tsCode from '@ts-default/Components/PillNav/PillNav.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/PillNav/PillNav.tsx?raw';

export const pillNav = {
  usage: `import PillNav from './PillNav';
import logo from './logo.svg';

<PillNav
  logo={logo}
  logoAlt="Company"
  items={[
    { label: 'Home', href: '/' },
    { label: 'Journal', href: '/journal' },
    { label: 'Photos', href: '/photos' },
    { label: 'About', href: '/about' }
  ]}
  activeHref="/"
  itemStyle="pill"
  hoverEffect="fill"
  indicator="dot"
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
