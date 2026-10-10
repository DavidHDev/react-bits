import { useMemo } from 'react';
import { Box, Text } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PropTable from '../../components/common/Preview/PropTable';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import useComponentProps from '../../hooks/useComponentProps';
import { useColorModeValue } from '../../components/setup/color-mode';

import GlowCursor from '../../content/Animations/GlowCursor/GlowCursor';
import { glowCursor } from '../../constants/code/Animations/glowCursorCode';

const COMET = {
  color: '#5f8bff',
  secondaryColor: '',
  intensity: 1.3,
  trailWidth: 3,
  linger: 1.4,
  glow: 1.2,
  hotspot: 0.8,
  followSpeed: 0.6,
  grain: 0
};

const DEFAULT_PROPS = {
  preset: 'comet',
  ...COMET,
  clickBurst: true,
  quality: 'high',
  enabled: true
};

const PRESETS = {
  comet: COMET,
  ember: { ...COMET, color: '#ffb347', secondaryColor: '#ff3b1a', linger: 1.1 },
  aurora: { ...COMET, color: '#5effc4', secondaryColor: '#2a8cff', linger: 2.4, glow: 1.5 },
  smoke: {
    ...COMET,
    color: '#ffffff',
    secondaryColor: '#9a9aa8',
    linger: 2.6,
    intensity: 0.9,
    hotspot: 0.4,
    glow: 0.6
  },
  ion: { ...COMET, color: '#7ff3ff', secondaryColor: '#3a5bff', trailWidth: 2, linger: 1, intensity: 1.6 },
  silk: { ...COMET, trailWidth: 7, linger: 2, glow: 1.6, hotspot: 0.4 }
};

const PRESET_OPTIONS = [
  { value: 'comet', label: 'Comet' },
  { value: 'ember', label: 'Ember' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'smoke', label: 'Smoke' },
  { value: 'ion', label: 'Ion' },
  { value: 'silk', label: 'Silk' }
];

const QUALITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

const propData = [
  { name: 'color', type: 'string', default: "'#5f8bff'", description: 'Color of the light where it is freshly drawn.' },
  {
    name: 'secondaryColor',
    type: 'string',
    default: '-',
    description: 'Color the light cools to as it drifts. Leave it out for a deeper shade of the main color.'
  },
  { name: 'intensity', type: 'number', default: '1.3', description: 'Brightness of the light.' },
  {
    name: 'trailWidth',
    type: 'number',
    default: '3',
    description: 'Thickness of the light where it is drawn, in pixels.'
  },
  { name: 'linger', type: 'number', default: '1.4', description: 'Seconds the light stays visible before it fades.' },
  { name: 'glow', type: 'number', default: '1.2', description: 'Strength of the soft glow around the light.' },
  { name: 'hotspot', type: 'number', default: '0.8', description: 'Strength of the white-hot core near the cursor.' },
  {
    name: 'followSpeed',
    type: 'number',
    default: '0.6',
    description: 'How tightly the light follows the cursor, from 0 to 1.'
  },
  { name: 'grain', type: 'number', default: '0', description: 'Amount of film grain in the light.' },
  { name: 'clickBurst', type: 'boolean', default: 'true', description: 'Releases a burst of light when you click.' },
  {
    name: 'quality',
    type: "'low' | 'medium' | 'high'",
    default: "'high'",
    description: 'Resolution of the simulation. Lower it for weaker devices.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Use light on light backgrounds for an ink-like look.'
  },
  {
    name: 'blendMode',
    type: 'string',
    default: 'auto',
    description: 'CSS blend mode of the canvas. Defaults to screen in dark and normal in light.'
  },
  { name: 'maxDevicePixelRatio', type: 'number', default: '2', description: 'Maximum pixel density of the canvas.' },
  {
    name: 'enabled',
    type: 'boolean',
    default: 'true',
    description: 'Stops drawing new light while keeping what is already there.'
  },
  { name: 'children', type: 'ReactNode', default: '-', description: 'Content rendered above the light.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const GlowCursorDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, secondaryColor, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const secondary = secondaryColor || undefined;

  const computedProps = useMemo(() => (secondary ? { secondaryColor: secondary } : {}), [secondary]);

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(key => [key, defaultProps[key]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'secondaryColor']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <Text
              position="absolute"
              bottom={5}
              left="50%"
              transform="translateX(-50%)"
              fontSize="sm"
              color="var(--text-dimmed)"
              userSelect="none"
              pointerEvents="none"
            >
              Move and click
            </Text>
            <GlowCursor {...settings} {...computedProps} theme={theme} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={props.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Cooling Color"
              color={secondaryColor || props.color}
              onChange={value => updateProp('secondaryColor', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0.3}
              max={3}
              step={0.05}
              value={props.intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Trail Width"
              min={1}
              max={14}
              step={0.5}
              value={props.trailWidth}
              valueUnit="px"
              onChange={value => updateProp('trailWidth', value)}
            />
            <PreviewSlider
              title="Linger"
              min={0.3}
              max={5}
              step={0.1}
              value={props.linger}
              valueUnit="s"
              onChange={value => updateProp('linger', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={3}
              step={0.05}
              value={props.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Hotspot"
              min={0}
              max={2}
              step={0.05}
              value={props.hotspot}
              onChange={value => updateProp('hotspot', value)}
            />
            <PreviewSlider
              title="Follow Speed"
              min={0}
              max={1}
              step={0.05}
              value={props.followSpeed}
              onChange={value => updateProp('followSpeed', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.3}
              step={0.01}
              value={props.grain}
              onChange={value => updateProp('grain', value)}
            />
            <PreviewSelect
              title="Quality"
              options={QUALITY_OPTIONS}
              value={props.quality}
              onChange={value => updateProp('quality', value)}
            />
            <PreviewSwitch
              title="Click Burst"
              isChecked={props.clickBurst}
              onChange={value => updateProp('clickBurst', value)}
            />
            <PreviewSwitch title="Enabled" isChecked={props.enabled} onChange={value => updateProp('enabled', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={glowCursor} componentName="GlowCursor" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GlowCursorDemo;
