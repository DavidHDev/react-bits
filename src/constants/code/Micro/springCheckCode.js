import code from '@content/Micro/SpringCheck/SpringCheck.jsx?raw';
import css from '@content/Micro/SpringCheck/SpringCheck.css?raw';
import tailwind from '@tailwind/Micro/SpringCheck/SpringCheck.jsx?raw';
import tsCode from '@ts-default/Micro/SpringCheck/SpringCheck.tsx?raw';
import tsTailwind from '@ts-tailwind/Micro/SpringCheck/SpringCheck.tsx?raw';

export const springCheck = {
  dependencies: `motion @hugeicons/core-free-icons`,
  usage: `import SpringCheck from './SpringCheck';

<SpringCheck
  label="Ship the build"
  defaultChecked={false}
  onChange={checked => console.log(checked)}
  color="#ffffff"
  fillColor="#ffffff"
  checkColor="#0b0b0f"
  boxSize={28}
  boxRadius={9}
  fontSize={18}
  bounce={0.2}
  strikeLag={0.12}
  doneOpacity={0.42}
  strike="left"
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
