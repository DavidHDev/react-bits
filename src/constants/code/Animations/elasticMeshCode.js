import code from '@content/Animations/ElasticMesh/ElasticMesh.jsx?raw';
import css from '@content/Animations/ElasticMesh/ElasticMesh.css?raw';
import tailwind from '@tailwind/Animations/ElasticMesh/ElasticMesh.jsx?raw';
import tsCode from '@ts-default/Animations/ElasticMesh/ElasticMesh.tsx?raw';
import tsTailwind from '@ts-tailwind/Animations/ElasticMesh/ElasticMesh.tsx?raw';

export const elasticMesh = {
  usage: `import ElasticMesh from './ElasticMesh';

<div style={{ width: '100%', height: '500px', position: 'relative' }}>
  <ElasticMesh
    text="Squish"
    material="balloon"
    color="#3b5bff"
    inflate={1}
    stiffness={0.5}
    wobble={0.6}
    theme="dark"
  />
</div>

<div style={{ width: '100%', height: '500px', position: 'relative' }}>
  <ElasticMesh src="/logo.svg" material="chrome" imageColors={false} />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
};
