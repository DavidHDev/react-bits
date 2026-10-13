import code from '@content/Animations/LogoLoop/LogoLoop.jsx?raw';
import css from '@content/Animations/LogoLoop/LogoLoop.css?raw';
import tailwind from '@tailwind/Animations/LogoLoop/LogoLoop.jsx?raw';
import tsCode from '@ts-default/Animations/LogoLoop/LogoLoop.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/LogoLoop/LogoLoop.tsx?raw';

export const logoLoop = {
  usage: `import LogoLoop from './LogoLoop';
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss } from 'react-icons/si';

const techLogos = [
  { node: <SiReact />, title: "React", href: "https://react.dev", hoverColor: "#61dafb" },
  { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
  { node: <SiTypescript />, title: "TypeScript", href: "https://www.typescriptlang.org", hoverColor: "#3178c6" },
  { node: <SiTailwindcss />, title: "Tailwind CSS", href: "https://tailwindcss.com", hoverColor: "#38bdf8" },
];

const imageLogos = [
  { src: "/logos/company1.png", alt: "Company 1", href: "https://company1.com" },
  { src: "/logos/company2.png", alt: "Company 2", href: "https://company2.com" },
  { src: "/logos/company3.png", alt: "Company 3", href: "https://company3.com" },
];

function App() {
  return (
    <div style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
      <LogoLoop
        logos={techLogos}
        speed={100}
        direction="left"
        logoHeight={48}
        gap={56}
        hoverSpeed={0}
        scaleOnHover
        ariaLabel="Technology partners"
      />

      <LogoLoop
        logos={techLogos}
        layout="orbit"
        bend={0.6}
        magnify={0.6}
        labels="hover"
        muted={0.5}
      />

      <LogoLoop logos={imageLogos} direction="up" focus={0.5} step />
    </div>
  );
}`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
