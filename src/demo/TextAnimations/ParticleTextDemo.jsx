import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';
import Customize from '../../components/common/Preview/Customize';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';

import ParticleText from '../../content/TextAnimations/ParticleText/ParticleText';
import { particleText } from '../../constants/code/TextAnimations/particleTextCode';

const LOOK = {
  highlightColor: '#ff5a36',
  intro: 'gather',
  gatherDuration: 1600,
  stagger: 420,
  scatter: 190,
  clickBurst: true,
  burstStrength: 1,
  pointerRepel: 42,
  repelRadius: 120,
  idleDrift: 0.8,
  shape: 'circle',
  highlightMode: 'motion',
  particleSize: 2.2,
  density: 4,
  glow: true
};

const PRESETS = {
  ember: { ...LOOK },
  rain: {
    ...LOOK,
    highlightColor: '#4f8dff',
    intro: 'rain',
    gatherDuration: 1900,
    stagger: 760,
    scatter: 120,
    burstStrength: 1.3,
    pointerRepel: 34,
    repelRadius: 110,
    idleDrift: 0,
    shape: 'line',
    particleSize: 1.7,
    density: 4,
    glow: false
  },
  vortex: {
    ...LOOK,
    highlightColor: '#8e8e98',
    intro: 'spiral',
    gatherDuration: 2600,
    stagger: 650,
    scatter: 240,
    burstStrength: 1.7,
    pointerRepel: 30,
    repelRadius: 150,
    idleDrift: 1.3,
    particleSize: 1.5,
    density: 2,
    glow: false
  },
  scan: {
    ...LOOK,
    highlightColor: '#22c55e',
    intro: 'scan',
    gatherDuration: 1800,
    stagger: 240,
    scatter: 120,
    burstStrength: 0.8,
    pointerRepel: 24,
    repelRadius: 90,
    idleDrift: 0,
    shape: 'square',
    particleSize: 3,
    density: 5,
    glow: false
  }
};

const PRESET_OPTIONS = [
  { value: 'ember', label: 'Ember' },
  { value: 'rain', label: 'Rain' },
  { value: 'vortex', label: 'Vortex' },
  { value: 'scan', label: 'Scan' }
];

const DEFAULT_PROPS = {
  preset: 'ember',
  text: 'Future Interfaces',
  color: 'currentColor',
  ...LOOK,
  trigger: 'mount',
  fontSize: 'clamp(3.5rem, 13vw, 9rem)',
  fontWeight: 800,
  fontFamily: 'inherit'
};

const introOptions = [
  { value: 'gather', label: 'Gather' },
  { value: 'rain', label: 'Rain' },
  { value: 'spiral', label: 'Spiral' },
  { value: 'scan', label: 'Scan' }
];

const shapeOptions = [
  { value: 'circle', label: 'Circle' },
  { value: 'square', label: 'Square' },
  { value: 'line', label: 'Line' }
];

const triggerOptions = [
  { value: 'mount', label: 'Mount' },
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' }
];

const highlightOptions = [
  { value: 'motion', label: 'Motion' },
  { value: 'gradient', label: 'Gradient' }
];

const weightOptions = [
  { value: 500, label: '500' },
  { value: 650, label: '650' },
  { value: 800, label: '800' },
  { value: 900, label: '900' }
];

const propData = [
  {
    name: 'text',
    type: 'string',
    default: '"React Bits"',
    description: 'The words sampled into particle targets.'
  },
  {
    name: 'color',
    type: 'string',
    default: '"currentColor"',
    description: 'Particle color at rest. Follows the surrounding text color by default.'
  },
  {
    name: 'highlightColor',
    type: 'string',
    default: '"#ff5a36"',
    description:
      'Color particles take on while they fly in or get pushed around. Also colors the glow and the scan line.'
  },
  {
    name: 'intro',
    type: '"gather" | "rain" | "spiral" | "scan"',
    default: '"gather"',
    description:
      'How the text forms. Gather pulls scattered particles together, rain drops them in from above, spiral swirls them into place, and scan assembles the text behind a sweeping line.'
  },
  {
    name: 'gatherDuration',
    type: 'number',
    default: '1600',
    description: 'Milliseconds for the intro to form the text.'
  },
  {
    name: 'stagger',
    type: 'number',
    default: '420',
    description: 'Maximum per-particle delay in milliseconds before it starts moving.'
  },
  {
    name: 'scatter',
    type: 'number',
    default: '180',
    description: 'How far particles begin from their final spots in the gather and spiral intros.'
  },
  {
    name: 'trigger',
    type: '"mount" | "hover" | "click"',
    default: '"mount"',
    description: 'When the intro plays again after the first formation: never, on hover, or on click.'
  },
  {
    name: 'clickBurst',
    type: 'boolean',
    default: 'true',
    description:
      'Clicking blows the particles away from the click point, then they spring back into the text. Off while trigger is click.'
  },
  {
    name: 'burstStrength',
    type: 'number',
    default: '1',
    description: 'How hard and how wide a click burst pushes.'
  },
  {
    name: 'pointerRepel',
    type: 'number',
    default: '40',
    description: 'Strength of the cursor pushback.'
  },
  {
    name: 'repelRadius',
    type: 'number',
    default: '120',
    description: 'Cursor influence radius in pixels.'
  },
  {
    name: 'idleDrift',
    type: 'number',
    default: '0.7',
    description: 'Subtle resting motion after the text has formed.'
  },
  {
    name: 'shape',
    type: '"circle" | "square" | "line"',
    default: '"circle"',
    description:
      'How each particle is drawn. Line draws short strokes that stretch along their motion and settle into an even hatch.'
  },
  {
    name: 'highlightMode',
    type: '"motion" | "gradient"',
    default: '"motion"',
    description:
      'Motion lights up particles while they are away from their spot and cools them as they land. Gradient blends the highlight across the text from left to right.'
  },
  {
    name: 'particleSize',
    type: 'number',
    default: '2',
    description: 'Rendered size of each particle in CSS pixels.'
  },
  {
    name: 'density',
    type: 'number',
    default: '4',
    description: 'Pixel sampling step for the offscreen glyph canvas. Lower values create more particles.'
  },
  {
    name: 'glow',
    type: 'boolean',
    default: 'true',
    description: 'Adds a soft bloom in the highlight color around highlighted particles.'
  },
  {
    name: 'fontSize',
    type: 'number | string',
    default: '"clamp(3rem, 12vw, 8rem)"',
    description: 'Canvas text size used for glyph sampling.'
  },
  {
    name: 'fontWeight',
    type: 'number | string',
    default: '800',
    description: 'Font weight used for sampling.'
  },
  {
    name: 'fontFamily',
    type: 'string',
    default: '"inherit"',
    description: 'Font family used for sampling. Inherit waits for the surrounding font before sampling.'
  },
  {
    name: 'className',
    type: 'string',
    default: '""',
    description: 'Optional wrapper class name.'
  },
  {
    name: 'style',
    type: 'React.CSSProperties',
    default: 'undefined',
    description: 'Optional inline styles for the wrapper.'
  }
];

const ParticleTextDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');
  const shown = value => (value === 'currentColor' ? ink : value);

  const replay = (name, value) => {
    updateProp(name, value);
    forceRerender();
  };

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
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={430} overflow="hidden">
            <RefreshButton onClick={forceRerender} />
            <ParticleText key={`${preset}-${key}`} {...settings} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />

            <PreviewColorPickerCustom
              title="Color"
              color={shown(settings.color)}
              onChange={val => updateProp('color', val)}
            />
            <PreviewColorPickerCustom
              title="Highlight Color"
              color={shown(settings.highlightColor)}
              onChange={val => updateProp('highlightColor', val)}
            />

            <PreviewSelect
              title="Intro"
              options={introOptions}
              value={settings.intro}
              onChange={val => replay('intro', val)}
            />

            <PreviewSelect
              title="Trigger"
              options={triggerOptions}
              value={settings.trigger}
              onChange={val => updateProp('trigger', val)}
            />

            <PreviewSlider
              title="Gather"
              min={500}
              max={3000}
              step={100}
              value={settings.gatherDuration}
              valueUnit="ms"
              onChange={val => updateProp('gatherDuration', val)}
            />

            <PreviewSlider
              title="Stagger"
              min={0}
              max={900}
              step={30}
              value={settings.stagger}
              valueUnit="ms"
              onChange={val => updateProp('stagger', val)}
            />

            <PreviewSlider
              title="Scatter"
              min={40}
              max={320}
              step={10}
              value={settings.scatter}
              valueUnit="px"
              onChange={val => updateProp('scatter', val)}
            />

            <PreviewSwitch
              title="Click Burst"
              isChecked={settings.clickBurst}
              isDisabled={settings.trigger === 'click'}
              onChange={checked => updateProp('clickBurst', checked)}
            />

            <PreviewSlider
              title="Burst Strength"
              min={0.2}
              max={2.5}
              step={0.1}
              value={settings.burstStrength}
              isDisabled={!settings.clickBurst || settings.trigger === 'click'}
              onChange={val => updateProp('burstStrength', val)}
            />

            <PreviewSlider
              title="Repel Strength"
              min={0}
              max={90}
              step={2}
              value={settings.pointerRepel}
              onChange={val => updateProp('pointerRepel', val)}
            />

            <PreviewSlider
              title="Repel Radius"
              min={40}
              max={220}
              step={5}
              value={settings.repelRadius}
              valueUnit="px"
              onChange={val => updateProp('repelRadius', val)}
            />

            <PreviewSlider
              title="Idle Drift"
              min={0}
              max={2}
              step={0.1}
              value={settings.idleDrift}
              valueUnit="px"
              onChange={val => updateProp('idleDrift', val)}
            />

            <PreviewSelect
              title="Shape"
              options={shapeOptions}
              value={settings.shape}
              onChange={val => updateProp('shape', val)}
            />

            <PreviewSelect
              title="Highlight"
              options={highlightOptions}
              value={settings.highlightMode}
              onChange={val => updateProp('highlightMode', val)}
            />

            <PreviewSelect
              title="Weight"
              options={weightOptions}
              value={settings.fontWeight}
              onChange={val => updateProp('fontWeight', val)}
            />

            <PreviewSlider
              title="Particle Size"
              min={1}
              max={4}
              step={0.1}
              value={settings.particleSize}
              valueUnit="px"
              onChange={val => updateProp('particleSize', val)}
            />

            <PreviewSlider
              title="Density"
              min={2}
              max={8}
              step={1}
              value={settings.density}
              onChange={val => updateProp('density', val)}
            />

            <PreviewSwitch title="Glow" isChecked={settings.glow} onChange={checked => updateProp('glow', checked)} />

            <PreviewInput
              title="Text"
              value={settings.text}
              placeholder="Your heading"
              maxLength={24}
              onChange={val => updateProp('text', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={particleText} componentName="ParticleText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ParticleTextDemo;
