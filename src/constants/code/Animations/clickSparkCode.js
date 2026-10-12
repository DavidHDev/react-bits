import code from '@content/Animations/ClickSpark/ClickSpark.jsx?raw';
import tailwind from '@tailwind/Animations/ClickSpark/ClickSpark.jsx?raw';
import tsCode from '@ts-default/Animations/ClickSpark/ClickSpark.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/ClickSpark/ClickSpark.tsx?raw';

export const clickSpark = {
  usage: `import ClickSpark from './ClickSpark';

<ClickSpark
  sparkColor="#fff"
  shape="line"
  sparkCount={8}
  sparkSize={14}
  sparkRadius={30}
  duration={500}
>
  {/* Your content here */}
</ClickSpark>`,
  code,
  tailwind,
  tsCode,
  tsTailwind
};
