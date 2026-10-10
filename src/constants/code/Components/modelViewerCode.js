import code from '@content/Components/ModelViewer/ModelViewer.jsx?raw';
import tailwind from '@tailwind/Components/ModelViewer/ModelViewer.jsx?raw';
import tsCode from '@ts-default/Components/ModelViewer/ModelViewer.tsx?raw';
import tsTailwind from '@ts-tailwind/Components/ModelViewer/ModelViewer.tsx?raw';

export const modelViewer = {
  dependencies: `three @react-three/fiber @react-three/drei`,
  usage: `import ModelViewer from './ModelViewer';

<ModelViewer
  url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb"
  width={500}
  height={500}
  environment="studio"
  autoRotate
/>`,
  code,
  tailwind,
  tsCode,
  tsTailwind
};
