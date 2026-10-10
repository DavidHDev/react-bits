import code from '@content/Animations/TargetCursor/TargetCursor.jsx?raw';
import css from '@content/Animations/TargetCursor/TargetCursor.css?raw';
import tailwind from '@tailwind/Animations/TargetCursor/TargetCursor.jsx?raw';
import tsCode from '@ts-default/Animations/TargetCursor/TargetCursor.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/TargetCursor/TargetCursor.tsx?raw';

export const targetCursor = {
  usage: `import TargetCursor from './TargetCursor';

export default function App() {
  return (
    <div>
      <TargetCursor spinDuration={2} hideDefaultCursor parallaxOn />

      <h1>Hover over the elements below</h1>
      <button className="cursor-target" data-cursor-label="Open">Click me!</button>
      <div className="cursor-target">Hover target</div>
    </div>
  );
}`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
