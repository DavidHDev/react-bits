import { Box, Flex, Text } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import ModelViewer from '../../content/Components/ModelViewer/ModelViewer';
import { modelViewer } from '../../constants/code/Components/modelViewerCode';

const MODELS = {
  sneaker: { url: '/assets/3d/sneaker.glb', startAngle: -35, tilt: 12 },
  watch: { url: '/assets/3d/watch.glb', startAngle: -20, tilt: 8 },
  sofa: { url: '/assets/3d/sofa.glb', startAngle: -30, tilt: 14 },
  sunglasses: { url: '/assets/3d/sunglasses.glb', startAngle: -25, tilt: 10 }
};

const MODEL_OPTIONS = [
  { value: 'sneaker', label: 'Sneaker' },
  { value: 'watch', label: 'Watch' },
  { value: 'sofa', label: 'Sofa' },
  { value: 'sunglasses', label: 'Sunglasses' }
];

const ENVIRONMENT_OPTIONS = [
  { value: 'studio', label: 'Studio' },
  { value: 'city', label: 'City' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'dawn', label: 'Dawn' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'lobby', label: 'Lobby' },
  { value: 'night', label: 'Night' },
  { value: 'park', label: 'Park' },
  { value: 'forest', label: 'Forest' },
  { value: 'none', label: 'None' }
];

const INTRO_OPTIONS = [
  { value: 'rise', label: 'Rise' },
  { value: 'spin', label: 'Spin' },
  { value: 'fade', label: 'Fade' },
  { value: 'none', label: 'None' }
];

const DEFAULT_PROPS = {
  model: 'sneaker',
  environment: 'studio',
  environmentIntensity: 1,
  exposure: 1,
  intro: 'rise',
  autoRotate: true,
  autoRotateSpeed: 0.4,
  autoRotateDelay: 2,
  dragRotate: true,
  turntable: false,
  zoom: true,
  hoverTilt: 0.15,
  float: 0.3,
  shadow: true,
  shadowOpacity: 0.45,
  fit: 0.8,
  offsetX: 0,
  offsetY: 0,
  startAngle: -35,
  tilt: 12,
  resetOnDoubleClick: true
};

const propData = [
  { name: 'url', type: 'string', default: '-', description: 'URL of the model. Supports glb, gltf, fbx and obj.' },
  { name: 'width', type: 'number | string', default: '400', description: 'Width of the viewer.' },
  { name: 'height', type: 'number | string', default: '400', description: 'Height of the viewer.' },
  {
    name: 'environment',
    type: 'string',
    default: "'studio'",
    description:
      "Lighting environment: studio, city, sunset, dawn, warehouse, apartment, lobby, night, park, forest or 'none'."
  },
  {
    name: 'environmentIntensity',
    type: 'number',
    default: '1',
    description: 'Strength of the environment lighting and reflections.'
  },
  { name: 'exposure', type: 'number', default: '1', description: 'Overall brightness of the render.' },
  {
    name: 'intro',
    type: "'rise' | 'spin' | 'fade' | 'none'",
    default: "'rise'",
    description: 'How the model appears once it has loaded.'
  },
  { name: 'autoRotate', type: 'boolean', default: 'true', description: 'Slowly turns the model while idle.' },
  { name: 'autoRotateSpeed', type: 'number', default: '0.4', description: 'Speed of the idle rotation.' },
  {
    name: 'autoRotateDelay',
    type: 'number',
    default: '2',
    description: 'Seconds after you let go before the idle rotation eases back in.'
  },
  {
    name: 'dragRotate',
    type: 'boolean',
    default: 'true',
    description: 'Drag to turn the model, with momentum when you let go.'
  },
  {
    name: 'turntable',
    type: 'boolean',
    default: 'false',
    description: 'Limits dragging to left and right, like a product turntable.'
  },
  {
    name: 'zoom',
    type: 'boolean',
    default: 'true',
    description: 'Pinch or hold Ctrl or Cmd and scroll to zoom. Plain scrolling still scrolls the page.'
  },
  { name: 'minZoom', type: 'number', default: '0.7', description: 'How far out you can zoom.' },
  { name: 'maxZoom', type: 'number', default: '2', description: 'How far in you can zoom.' },
  {
    name: 'hoverTilt',
    type: 'number',
    default: '0.15',
    description: 'How much the model leans toward the cursor. 0 turns it off.'
  },
  { name: 'float', type: 'number', default: '0.3', description: 'Gentle floating above the shadow. 0 turns it off.' },
  { name: 'shadow', type: 'boolean', default: 'true', description: 'Soft contact shadow under the model.' },
  { name: 'shadowOpacity', type: 'number', default: '0.45', description: 'Darkness of the shadow.' },
  {
    name: 'fit',
    type: 'number',
    default: '0.8',
    description: 'How much of the viewer the model fills. It is framed automatically.'
  },
  { name: 'offsetX', type: 'number', default: '0', description: 'Moves the model sideways, from -1 to 1.' },
  { name: 'offsetY', type: 'number', default: '0', description: 'Moves the model up or down, from -1 to 1.' },
  { name: 'startAngle', type: 'number', default: '-30', description: 'Starting angle around the model, in degrees.' },
  { name: 'tilt', type: 'number', default: '10', description: 'Starting tilt toward the viewer, in degrees.' },
  {
    name: 'resetOnDoubleClick',
    type: 'boolean',
    default: 'true',
    description: 'Double click to return to the starting view.'
  },
  { name: 'onModelLoaded', type: '() => void', default: '-', description: 'Called once the model has loaded.' },
  {
    name: 'ref',
    type: 'Ref',
    default: '-',
    description: 'Exposes capture(type?), which returns the current frame as an image data URL.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const ModelViewerDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { model, ...settings } = props;
  const url = (MODELS[model] ?? MODELS.sneaker).url;

  const selectModel = value => {
    const preset = MODELS[value] ?? MODELS.sneaker;
    updateProps({ model: value, startAngle: preset.startAngle, tilt: preset.tilt });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['model']}
      computedProps={{ url }}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <ModelViewer key={`${key}-${model}`} url={url} width="100%" height="100%" {...settings} />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <Text fontSize="12px" color="var(--text-dimmed)">
              Models by Shopify and Eric Chadwick, CC BY 4.0, from the Khronos glTF Sample Assets.
            </Text>
          </Flex>

          <Customize>
            <PreviewSelect title="Model" options={MODEL_OPTIONS} value={model} onChange={selectModel} />
            <PreviewSelect
              title="Environment"
              options={ENVIRONMENT_OPTIONS}
              value={settings.environment}
              onChange={value => updateProp('environment', value)}
            />
            <PreviewSelect
              title="Intro"
              options={INTRO_OPTIONS}
              value={settings.intro}
              onChange={value => updateProp('intro', value)}
            />
            <PreviewSlider
              title="Environment Intensity"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.environmentIntensity}
              onChange={value => updateProp('environmentIntensity', value)}
            />
            <PreviewSlider
              title="Exposure"
              min={0.3}
              max={2}
              step={0.05}
              value={settings.exposure}
              onChange={value => updateProp('exposure', value)}
            />
            <PreviewSlider
              title="Auto Rotate Speed"
              min={-2}
              max={2}
              step={0.05}
              value={settings.autoRotateSpeed}
              onChange={value => updateProp('autoRotateSpeed', value)}
            />
            <PreviewSlider
              title="Auto Rotate Delay"
              min={0}
              max={6}
              step={0.1}
              value={settings.autoRotateDelay}
              valueUnit="s"
              onChange={value => updateProp('autoRotateDelay', value)}
            />
            <PreviewSlider
              title="Hover Tilt"
              min={0}
              max={0.6}
              step={0.01}
              value={settings.hoverTilt}
              onChange={value => updateProp('hoverTilt', value)}
            />
            <PreviewSlider
              title="Float"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.float}
              onChange={value => updateProp('float', value)}
            />
            <PreviewSlider
              title="Shadow Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings.shadowOpacity}
              onChange={value => updateProp('shadowOpacity', value)}
            />
            <PreviewSlider
              title="Fit"
              min={0.3}
              max={1.2}
              step={0.01}
              value={settings.fit}
              onChange={value => updateProp('fit', value)}
            />
            <PreviewSlider
              title="Offset X"
              min={-1}
              max={1}
              step={0.01}
              value={settings.offsetX}
              onChange={value => updateProp('offsetX', value)}
            />
            <PreviewSlider
              title="Offset Y"
              min={-1}
              max={1}
              step={0.01}
              value={settings.offsetY}
              onChange={value => updateProp('offsetY', value)}
            />
            <PreviewSlider
              title="Start Angle"
              min={-180}
              max={180}
              step={1}
              value={settings.startAngle}
              valueUnit="°"
              onChange={value => updateProp('startAngle', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={-45}
              max={45}
              step={1}
              value={settings.tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSwitch
              title="Auto Rotate"
              isChecked={settings.autoRotate}
              onChange={value => updateProp('autoRotate', value)}
            />
            <PreviewSwitch
              title="Drag Rotate"
              isChecked={settings.dragRotate}
              onChange={value => updateProp('dragRotate', value)}
            />
            <PreviewSwitch
              title="Turntable"
              isChecked={settings.turntable}
              onChange={value => updateProp('turntable', value)}
            />
            <PreviewSwitch title="Zoom" isChecked={settings.zoom} onChange={value => updateProp('zoom', value)} />
            <PreviewSwitch title="Shadow" isChecked={settings.shadow} onChange={value => updateProp('shadow', value)} />
            <PreviewSwitch
              title="Reset On Double Click"
              isChecked={settings.resetOnDoubleClick}
              onChange={value => updateProp('resetOnDoubleClick', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['three', '@react-three/fiber', '@react-three/drei']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={modelViewer} componentName="ModelViewer" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ModelViewerDemo;
