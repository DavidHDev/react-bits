import code from '@content/Components/PillNav/PillNav.jsx?raw';
import css from '@content/Components/PillNav/PillNav.css?raw';
import tailwind from '@tailwind/Components/PillNav/PillNav.jsx?raw';
import tsCode from '@ts-default/Components/PillNav/PillNav.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/PillNav/PillNav.tsx?raw';

export const pillNav = {
  dependencies: `gsap`,
  usage: `import PillNav from './PillNav';
import logo from '/path/to/logo.svg';

<PillNav
  logo={logo}
  logoAlt="Company Logo"
  items={[
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Contact', href: '/contact' }
  ]}
  activeHref="/"
  className="custom-nav"
  ease="power2.easeOut"
  baseColor="#000000"
  pillColor="#ffffff"
  hoveredPillTextColor="#ffffff"
  pillTextColor="#000000"
  onMobileMenuClick
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
