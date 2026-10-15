import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorList from '../../components/common/Preview/PreviewColorList';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import Strands from '../../content/Animations/Strands/Strands';
import { strands } from '../../constants/code/Animations/strandsCode';

const SPECTRUM = ['#d95b56', '#ba5046', '#ffa24c', '#ffe0b3', '#93f1ff', '#3569fa', '#193d9b'];

const LOOK = {
  colors: SPECTRUM,
  count: 3,
  speed: 1,
  amplitude: 1,
  waviness: 1,
  energy: 0.65,
  thickness: 1,
  spread: 1,
  glow: 1,
  taper: 1,
  intensity: 1,
  saturation: 1,
  hueShift: 0,
  scale: 1,
  glass: true,
  glassSize: 1,
  refraction: 1,
  rim: 1,
  dispersion: 1,
  listening: false
};

const DEFAULT_PROPS = {
  preset: 'siri',
  ...LOOK,
  interactive: true,
  clickPulse: true,
  intro: true
};

const PRESETS = {
  siri: {},
  listening: { listening: true },
  calm: { energy: 0 },
  ribbon: { glass: false },
  aurora: { colors: ['#00e08a', '#3dffb0', '#00c2a8', '#c8fff0', '#7fe3ff', '#2f6bff', '#6a4dff'] },
  ember: { colors: ['#ff2a1f', '#ff5a2e', '#ff7a1a', '#ffe2a8', '#ffb37a', '#ff3d2e', '#c42a6a'] }
};

const PRESET_OPTIONS = [
  { value: 'siri', label: 'Siri' },
  { value: 'listening', label: 'Listening' },
  { value: 'calm', label: 'Calm' },
  { value: 'ribbon', label: 'Ribbon' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'ember', label: 'Ember' }
];

const propData = [
  {
    name: 'colors',
    type: 'string[]',
    default: 'Siri palette',
    description:
      'Colors of the strands, in order: the red top edge of the bulge, orange, amber, the warm white core, cyan, blue and deep blue. Fewer colors are spread across these roles.'
  },
  {
    name: 'count',
    type: 'number',
    default: '3',
    description: 'How many strands show inside the bulge of light, from 1 to 3.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'How fast the light turns. 0 holds it still.' },
  {
    name: 'amplitude',
    type: 'number',
    default: '1',
    description: 'How tall the arch rises and how deeply the ribbon curves.'
  },
  { name: 'waviness', type: 'number', default: '1', description: 'How tightly the ribbon twists along its length.' },
  {
    name: 'energy',
    type: 'number',
    default: '0.65',
    description:
      'How lively the light is on its own, from 0 to 1. 0 rests as a calm white line, 1 keeps the ribbons fully open.'
  },
  {
    name: 'thickness',
    type: 'number',
    default: '1',
    description: 'How thick the edges of the light are, and the white core where the ribbon turns edge-on.'
  },
  { name: 'spread', type: 'number', default: '1', description: 'How wide the ribbon opens, fanning its colors out.' },
  { name: 'glow', type: 'number', default: '1', description: 'Strength of the soft glow around the light.' },
  {
    name: 'taper',
    type: 'number',
    default: '1',
    description: 'How quickly the light fades toward the sides of the orb.'
  },
  { name: 'intensity', type: 'number', default: '1', description: 'Overall brightness of the light.' },
  { name: 'saturation', type: 'number', default: '1', description: 'Color saturation of the light. 0 is greyscale.' },
  {
    name: 'hueShift',
    type: 'number',
    default: '0',
    description: 'Rotates the colors of the light around the color wheel, from 0 to 1.'
  },
  { name: 'scale', type: 'number', default: '1', description: 'Width of the light.' },
  {
    name: 'glass',
    type: 'boolean',
    default: 'true',
    description: 'Shows the glass orb. Turn it off for the light on its own.'
  },
  { name: 'glassSize', type: 'number', default: '1', description: 'Size of the glass orb.' },
  {
    name: 'refraction',
    type: 'number',
    default: '1',
    description: 'How strongly the edge of the glass bends the light, wrapping the colors around its rim.'
  },
  { name: 'rim', type: 'number', default: '1', description: 'Brightness of the glass rim and the light it catches.' },
  {
    name: 'dispersion',
    type: 'number',
    default: '1',
    description: 'Amount of rainbow color separation along the edge of the glass.'
  },
  {
    name: 'listening',
    type: 'boolean',
    default: 'false',
    description: 'Animates the orb as if it were hearing someone speak.'
  },
  {
    name: 'level',
    type: 'number',
    default: 'undefined',
    description:
      'Drives the orb from your own audio level, from 0 to 1, for example a microphone volume. Overrides listening.'
  },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description: 'The light tilts toward the cursor and stirs as it gets close.'
  },
  {
    name: 'clickPulse',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a burst of motion through the light.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'The orb fades in and the light unfolds from the center when it first appears.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description:
      'For light pages. The orb turns into frosted white glass and the strands use deeper colors with a warm core.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Overall opacity.' },
  {
    name: 'maxDevicePixelRatio',
    type: 'number',
    default: '2',
    description: 'Highest pixel ratio the canvas renders at.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const StrandsDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset']}
      computedProps={theme === 'light' ? { lightMode: true } : {}}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <Strands key={key} {...settings} lightMode={theme === 'light'} />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={settings.colors}
              max={8}
              onChange={value => updateProp('colors', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSlider
              title="Count"
              min={1}
              max={3}
              step={1}
              value={settings.count}
              onChange={value => updateProp('count', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Amplitude"
              min={0}
              max={2}
              step={0.05}
              value={settings.amplitude}
              onChange={value => updateProp('amplitude', value)}
            />
            <PreviewSlider
              title="Waviness"
              min={0.4}
              max={2.5}
              step={0.05}
              value={settings.waviness}
              onChange={value => updateProp('waviness', value)}
            />
            <PreviewSlider
              title="Energy"
              min={0}
              max={1}
              step={0.01}
              value={settings.energy}
              onChange={value => updateProp('energy', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={0.3}
              max={2.5}
              step={0.05}
              value={settings.thickness}
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Spread"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.spread}
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Taper"
              min={0.3}
              max={3}
              step={0.05}
              value={settings.taper}
              onChange={value => updateProp('taper', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0.2}
              max={2}
              step={0.05}
              value={settings.intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Saturation"
              min={0}
              max={2}
              step={0.05}
              value={settings.saturation}
              onChange={value => updateProp('saturation', value)}
            />
            <PreviewSlider
              title="Hue Shift"
              min={0}
              max={1}
              step={0.01}
              value={settings.hueShift}
              onChange={value => updateProp('hueShift', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.5}
              max={1.6}
              step={0.05}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Glass Size"
              min={0.5}
              max={1.15}
              step={0.01}
              value={settings.glassSize}
              isDisabled={!settings.glass}
              onChange={value => updateProp('glassSize', value)}
            />
            <PreviewSlider
              title="Refraction"
              min={0}
              max={2}
              step={0.05}
              value={settings.refraction}
              isDisabled={!settings.glass}
              onChange={value => updateProp('refraction', value)}
            />
            <PreviewSlider
              title="Rim"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.rim}
              isDisabled={!settings.glass}
              onChange={value => updateProp('rim', value)}
            />
            <PreviewSlider
              title="Dispersion"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.dispersion}
              isDisabled={!settings.glass}
              onChange={value => updateProp('dispersion', value)}
            />
            <PreviewSwitch title="Glass" isChecked={settings.glass} onChange={value => updateProp('glass', value)} />
            <PreviewSwitch
              title="Listening"
              isChecked={settings.listening}
              onChange={value => updateProp('listening', value)}
            />
            <PreviewSwitch
              title="Interactive"
              isChecked={settings.interactive}
              onChange={value => updateProp('interactive', value)}
            />
            <PreviewSwitch
              title="Click Pulse"
              isChecked={settings.clickPulse}
              onChange={value => updateProp('clickPulse', value)}
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
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={strands} componentName="Strands" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default StrandsDemo;
