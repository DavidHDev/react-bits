import { Box, Flex } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import GhostCursor from '../../content/Animations/GhostCursor/GhostCursor';
import { ghostCursor } from '../../constants/code/Animations/ghostCursorCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/GhostCursor';

const DEFAULT_PROPS = {
  preset: 'phantom',
  ...LOOK,
  edgeIntensity: 0,
  fadeDelayMs: 1000,
  fadeDurationMs: 1500,
  clickPuff: true,
  intro: true
};

const LIGHT_SWAP = {
  '#b497cf': '#8b6fb3',
  '#7aa2ff': '#3b5bdb',
  '#ff8a3d': '#ea580c',
  '#e4e4e7': '#52525b',
  '#6ee7b7': '#059669'
};

const DARK_SWAP = Object.fromEntries(Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark]));

const propData = [
  { name: 'color', type: 'string', default: "'#B497CF'", description: 'Color of the smoke. Dense parts glow lighter.' },
  { name: 'size', type: 'number', default: '80', description: 'Size of the ghost, in px.' },
  {
    name: 'trailLength',
    type: 'number',
    default: '50',
    description: 'How long the smoke lingers behind the cursor, from 1 to 200.'
  },
  {
    name: 'inertia',
    type: 'number',
    default: '0.5',
    description: 'How far the ghost floats behind the cursor and glides on when the cursor leaves, from 0 to 0.99.'
  },
  {
    name: 'turbulence',
    type: 'number',
    default: '0.5',
    description: 'How much the smoke swirls and curls as it drifts, from 0 to 2.'
  },
  {
    name: 'drift',
    type: 'number',
    default: '0.3',
    description: 'How fast the smoke rises. Negative values let it sink.'
  },
  {
    name: 'detail',
    type: 'number',
    default: '1',
    description: 'How wispy the smoke is, from 0 for a soft glow to 1 for billowing wisps.'
  },
  { name: 'brightness', type: 'number', default: '1', description: 'Brightness of the smoke.' },
  { name: 'bloomStrength', type: 'number', default: '0.6', description: 'Strength of the soft glow around the smoke.' },
  { name: 'bloomRadius', type: 'number', default: '1', description: 'How far the glow spreads, from 0 to 3.' },
  {
    name: 'bloomThreshold',
    type: 'number',
    default: '0.025',
    description: 'How bright smoke has to be before it glows. Higher values keep the glow on the core.'
  },
  { name: 'grainIntensity', type: 'number', default: '0.05', description: 'Film grain over the smoke, from 0 to 1.' },
  {
    name: 'edgeIntensity',
    type: 'number',
    default: '0',
    description: 'Fades the smoke out toward the edges of the area, from 0 to 1.'
  },
  { name: 'clickPuff', type: 'boolean', default: 'true', description: 'Clicking releases a puff of smoke.' },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'The ghost floats across once when it first appears, before the cursor arrives.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Glowing smoke for dark pages, or soft ink smoke for light ones.'
  },
  {
    name: 'mixBlendMode',
    type: 'string',
    default: "'screen' (dark), 'normal' (light)",
    description: 'CSS blend mode for the canvas.'
  },
  {
    name: 'fadeDelayMs',
    type: 'number',
    default: '1000 (500 on touch)',
    description: 'Time after the cursor stops before the ghost starts to fade, in ms.'
  },
  {
    name: 'fadeDurationMs',
    type: 'number',
    default: '1500 (1000 on touch)',
    description: 'How long the fade takes, in ms.'
  },
  {
    name: 'maxDevicePixelRatio',
    type: 'number',
    default: '2',
    description: 'Highest pixel ratio the canvas renders at.'
  },
  {
    name: 'targetPixels',
    type: 'number',
    default: '600000 (300000 on touch)',
    description: 'Pixel budget for the smoke. Large areas render it at a lower resolution to stay fast.'
  },
  { name: 'zIndex', type: 'number', default: '10', description: 'Stacking order of the effect over your content.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const GhostCursorDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, color, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const picked = `#${String(color || LOOK.color)
    .replace(/^#/, '')
    .toLowerCase()}`;
  const swap = theme === 'light' ? LIGHT_SWAP : DARK_SWAP;
  const shown = swap[picked] ?? picked;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { defaults: defaultProps }), preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'color']}
      computedProps={{ color: shown, ...(theme === 'light' ? { theme: 'light' } : {}) }}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            h={500}
            p={0}
            overflow="hidden"
            style={{ cursor: 'crosshair' }}
          >
            <GhostCursor key={key} theme={theme} color={shown} {...settings} />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="ghost-cursor"
              currentProps={{ ...settings, color: shown }}
              defaultProps={{ ...LOOK, color: '#B497CF' }}
            />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom title="Color" color={shown} onChange={value => updateProp('color', value)} />
            <PreviewSlider
              title="Size"
              min={30}
              max={180}
              step={1}
              value={settings.size}
              valueUnit="px"
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Trail Length"
              min={5}
              max={150}
              step={1}
              value={settings.trailLength}
              onChange={value => updateProp('trailLength', value)}
            />
            <PreviewSlider
              title="Inertia"
              min={0}
              max={0.95}
              step={0.01}
              value={settings.inertia}
              onChange={value => updateProp('inertia', value)}
            />
            <PreviewSlider
              title="Turbulence"
              min={0}
              max={2}
              step={0.05}
              value={settings.turbulence}
              onChange={value => updateProp('turbulence', value)}
            />
            <PreviewSlider
              title="Drift"
              min={-1}
              max={1.5}
              step={0.05}
              value={settings.drift}
              onChange={value => updateProp('drift', value)}
            />
            <PreviewSlider
              title="Detail"
              min={0}
              max={1}
              step={0.05}
              value={settings.detail}
              onChange={value => updateProp('detail', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.2}
              max={2.5}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={2}
              step={0.05}
              value={settings.bloomStrength}
              onChange={value => updateProp('bloomStrength', value)}
            />
            <PreviewSlider
              title="Glow Size"
              min={0}
              max={3}
              step={0.05}
              value={settings.bloomRadius}
              onChange={value => updateProp('bloomRadius', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.4}
              step={0.01}
              value={settings.grainIntensity}
              onChange={value => updateProp('grainIntensity', value)}
            />
            <PreviewSlider
              title="Edge Fade"
              min={0}
              max={1}
              step={0.05}
              value={settings.edgeIntensity}
              onChange={value => updateProp('edgeIntensity', value)}
            />
            <PreviewSlider
              title="Fade Delay"
              min={0}
              max={3000}
              step={100}
              value={settings.fadeDelayMs}
              valueUnit="ms"
              onChange={value => updateProp('fadeDelayMs', value)}
            />
            <PreviewSlider
              title="Fade Duration"
              min={100}
              max={4000}
              step={100}
              value={settings.fadeDurationMs}
              valueUnit="ms"
              onChange={value => updateProp('fadeDurationMs', value)}
            />
            <PreviewSwitch
              title="Click Puff"
              isChecked={settings.clickPuff}
              onChange={value => updateProp('clickPuff', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings.intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={ghostCursor} componentName="GhostCursor" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GhostCursorDemo;
