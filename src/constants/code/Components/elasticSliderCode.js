import code from '@content/Components/ElasticSlider/ElasticSlider.jsx?raw';
import css from '@content/Components/ElasticSlider/ElasticSlider.css?raw';
import tailwind from '@tailwind/Components/ElasticSlider/ElasticSlider.jsx?raw';
import tsCode from '@ts-default/Components/ElasticSlider/ElasticSlider.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/ElasticSlider/ElasticSlider.tsx?raw';

export const elasticSlider = {
  dependencies: `@hugeicons/react @hugeicons/core-free-icons`,
  usage: `import { HugeiconsIcon } from '@hugeicons/react';
import { VolumeHighIcon, VolumeLowIcon } from '@hugeicons/core-free-icons';
import ElasticSlider from './ElasticSlider';

<ElasticSlider
  defaultValue={50}
  leftIcon={<HugeiconsIcon icon={VolumeLowIcon} size={20} />}
  rightIcon={<HugeiconsIcon icon={VolumeHighIcon} size={20} />}
  onChange={value => console.log(value)}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
