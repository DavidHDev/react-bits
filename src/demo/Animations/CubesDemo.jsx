import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import { cubes } from '../../constants/code/Animations/cubesCode';
import Cubes from '../../content/Animations/Cubes/Cubes';

const LOOK = {
  gridSize: 10,
  gap: 0.18,
  edgeStyle: 'solid',
  edgeWidth: 1,
  faceOpacity: 1,
  shading: 0.6,
  maxAngle: 45,
  radius: 3,
  perspective: 0
};

const DEFAULT_PROPS = {
  preset: 'grid',
  faceColor: '#120f17',
  edgeColor: '#ffffff',
  rippleColor: '#ffffff',
  ...LOOK,
  speed: 1,
  bounce: 0.4,
  brush: 1,
  rippleSpeed: 1,
  autoAnimate: true,
  rippleOnClick: true,
  intro: true
};

const LIGHT = {
  faceColor: '#ffffff',
  edgeColor: '#18181b',
  rippleColor: '#18181b'
};

const PRESETS = {
  grid: LOOK,
  dashed: { ...LOOK, edgeStyle: 'dashed', gap: 0.3 },
  wire: { ...LOOK, faceOpacity: 0, gap: 0.24, maxAngle: 60 },
  dense: { ...LOOK, gridSize: 16, gap: 0.12, radius: 4.5 },
  depth: { ...LOOK, perspective: 0.7, maxAngle: 55, shading: 1, gap: 0.24 }
};

const PRESET_OPTIONS = [
  { value: 'grid', label: 'Grid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'wire', label: 'Wire' },
  { value: 'dense', label: 'Dense' },
  { value: 'depth', label: 'Depth' }
];

const EDGE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'none', label: 'None' }
];

const propData = [
  { name: 'gridSize', type: 'number', default: '10', description: 'Number of cubes on each side of the grid.' },
  { name: 'gap', type: 'number', default: '0.18', description: 'Space between cubes, as a fraction of a cell.' },
  {
    name: 'faceColor',
    type: 'string',
    default: "'#120F17'",
    description: 'Color of the cube faces. Match it to your page background for a clean cut-out look.'
  },
  { name: 'edgeColor', type: 'string', default: "'#ffffff'", description: 'Color of the cube outlines.' },
  { name: 'edgeWidth', type: 'number', default: '1', description: 'Width of the outlines in px.' },
  {
    name: 'edgeStyle',
    type: "'solid' | 'dashed' | 'dotted' | 'none'",
    default: "'solid'",
    description: 'How the cube outlines are drawn.'
  },
  {
    name: 'faceOpacity',
    type: 'number',
    default: '1',
    description: 'Opacity of the faces, from 0 for see-through wireframes to 1 for solid cubes.'
  },
  {
    name: 'shading',
    type: 'number',
    default: '0.6',
    description: 'How much the sides of turned cubes pick up light, so they read as solid 3D shapes.'
  },
  {
    name: 'maxAngle',
    type: 'number',
    default: '45',
    description: 'How far cubes turn to face the cursor, in degrees.'
  },
  { name: 'radius', type: 'number', default: '3', description: 'How far the cursor reaches, in cubes.' },
  { name: 'speed', type: 'number', default: '1', description: 'How quickly cubes respond.' },
  {
    name: 'bounce',
    type: 'number',
    default: '0.4',
    description: 'How much cubes overshoot and wobble as they settle, from 0 to 1.'
  },
  {
    name: 'brush',
    type: 'number',
    default: '1',
    description: 'How strongly fast cursor sweeps spin the cubes they pass over.'
  },
  {
    name: 'perspective',
    type: 'number',
    default: '0',
    description: 'Camera perspective, from 0 for a flat front view to 1 for strong depth.'
  },
  {
    name: 'autoAnimate',
    type: 'boolean',
    default: 'true',
    description: 'Drifts a gentle wave across the grid while the cursor is away.'
  },
  {
    name: 'rippleOnClick',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a ripple through the cubes that lights up their edges.'
  },
  { name: 'rippleColor', type: 'string', default: "'#ffffff'", description: 'Color the ripple lights the cubes with.' },
  { name: 'rippleSpeed', type: 'number', default: '1', description: 'Speed of the ripple.' },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Cubes tumble into place from the center on mount.' },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const CubesDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const light = useColorModeValue(true, false);
  const shown = { ...settings };
  if (light) {
    Object.entries(LIGHT).forEach(([name, value]) => {
      if (settings[name] === DEFAULT_PROPS[name]) shown[name] = value;
    });
  }

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps[name]]));
    updateProps({
      ...base,
      ...PRESETS[value],
      faceColor: settings.faceColor,
      edgeColor: settings.edgeColor,
      rippleColor: settings.rippleColor,
      preset: value
    });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset']}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={600} p={0} overflow="hidden">
            <Cubes key={key} {...shown} />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Face Color"
              color={shown.faceColor}
              onChange={value => updateProp('faceColor', value)}
            />
            <PreviewColorPickerCustom
              title="Edge Color"
              color={shown.edgeColor}
              onChange={value => updateProp('edgeColor', value)}
            />
            <PreviewColorPickerCustom
              title="Ripple Color"
              color={shown.rippleColor}
              onChange={value => updateProp('rippleColor', value)}
            />
            <PreviewSelect
              title="Edge Style"
              options={EDGE_OPTIONS}
              value={settings.edgeStyle}
              onChange={value => updateProp('edgeStyle', value)}
            />
            <PreviewSlider
              title="Grid Size"
              min={3}
              max={24}
              step={1}
              value={settings.gridSize}
              onChange={value => updateProp('gridSize', value)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={0.6}
              step={0.01}
              value={settings.gap}
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Edge Width"
              min={0}
              max={4}
              step={0.25}
              value={settings.edgeWidth}
              valueUnit="px"
              onChange={value => updateProp('edgeWidth', value)}
            />
            <PreviewSlider
              title="Face Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings.faceOpacity}
              onChange={value => updateProp('faceOpacity', value)}
            />
            <PreviewSlider
              title="Shading"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.shading}
              onChange={value => updateProp('shading', value)}
            />
            <PreviewSlider
              title="Max Angle"
              min={0}
              max={90}
              step={1}
              value={settings.maxAngle}
              valueUnit="°"
              onChange={value => updateProp('maxAngle', value)}
            />
            <PreviewSlider
              title="Radius"
              min={1}
              max={8}
              step={0.5}
              value={settings.radius}
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0.3}
              max={2.5}
              step={0.05}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={1}
              step={0.05}
              value={settings.bounce}
              onChange={value => updateProp('bounce', value)}
            />
            <PreviewSlider
              title="Brush"
              min={0}
              max={3}
              step={0.1}
              value={settings.brush}
              onChange={value => updateProp('brush', value)}
            />
            <PreviewSlider
              title="Perspective"
              min={0}
              max={1}
              step={0.05}
              value={settings.perspective}
              onChange={value => updateProp('perspective', value)}
            />
            <PreviewSlider
              title="Ripple Speed"
              min={0.3}
              max={3}
              step={0.1}
              value={settings.rippleSpeed}
              onChange={value => updateProp('rippleSpeed', value)}
            />
            <PreviewSwitch
              title="Auto Animate"
              isChecked={settings.autoAnimate}
              onChange={value => updateProp('autoAnimate', value)}
            />
            <PreviewSwitch
              title="Ripple On Click"
              isChecked={settings.rippleOnClick}
              onChange={value => updateProp('rippleOnClick', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings.intro} onChange={value => updateProp('intro', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={cubes} componentName="Cubes" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CubesDemo;
