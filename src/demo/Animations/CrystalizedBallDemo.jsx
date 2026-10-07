import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PropTable from '../../components/common/Preview/PropTable';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';
import { useColorModeValue } from '../../components/setup/color-mode';

import CrystalizedBall from '../../content/Animations/CrystalizedBall/CrystalizedBall';
import { crystalizedBall } from '../../constants/code/Animations/crystalizedBallCode';

const PRESETS = {
  plasma: {
    color: '#F25BD0',
    strands: 6,
    crackle: 0.85,
    flares: 0.65,
    glow: 0.9,
    sparks: 0.6,
    particleCount: 15000,
    fill: 0.5,
    motion: 'rise',
    particleShape: 'square',
    depth: 0.6,
    sway: 0.5,
    twinkle: 0.5,
    haze: 0.7,
    dustSpeed: 1
  },
  aurora: {
    color: '#5CFFC8',
    strands: 5,
    crackle: 0.6,
    flares: 0.5,
    glow: 0.8,
    sparks: 0.45,
    particleCount: 15000,
    fill: 0.5,
    motion: 'rise',
    particleShape: 'square',
    depth: 0.6,
    sway: 0.5,
    twinkle: 0.5,
    haze: 0.7,
    dustSpeed: 1
  },
  nebula: {
    color: '#9478FF',
    strands: 6,
    crackle: 1,
    flares: 0.5,
    glow: 0.9,
    sparks: 0.6,
    particleCount: 18000,
    fill: 0.45,
    motion: 'rise',
    particleShape: 'square',
    depth: 0.5,
    sway: 0.4,
    twinkle: 0.6,
    haze: 0.8,
    dustSpeed: 1.2
  },
  ember: {
    color: '#FF8A2A',
    strands: 5,
    crackle: 0.9,
    flares: 0.8,
    glow: 1,
    sparks: 0.8,
    particleCount: 12000,
    fill: 0.35,
    motion: 'rise',
    particleShape: 'round',
    depth: 0.7,
    sway: 0.3,
    twinkle: 0.7,
    haze: 0.9,
    dustSpeed: 1.6
  },
  frost: {
    color: '#BFE6FF',
    strands: 3,
    crackle: 0.3,
    flares: 0.3,
    glow: 0.6,
    sparks: 0.2,
    particleCount: 16000,
    fill: 0.6,
    motion: 'fall',
    particleShape: 'round',
    depth: 0.8,
    sway: 0.4,
    twinkle: 0.4,
    haze: 0.5,
    dustSpeed: 0.7
  },
  solar: {
    color: '#FFD36E',
    strands: 6,
    crackle: 0.7,
    flares: 1,
    glow: 1.1,
    sparks: 0.5,
    particleCount: 15000,
    fill: 0.55,
    motion: 'orbit',
    particleShape: 'square',
    depth: 0.6,
    sway: 0.7,
    twinkle: 0.5,
    haze: 0.8,
    dustSpeed: 1
  },
  eclipse: {
    color: '#FFFFFF',
    strands: 4,
    crackle: 0.5,
    flares: 0.4,
    glow: 0.7,
    sparks: 0.35,
    particleCount: 14000,
    fill: 0.5,
    motion: 'drift',
    particleShape: 'square',
    depth: 0.7,
    sway: 0.5,
    twinkle: 0.5,
    haze: 0.5,
    dustSpeed: 0.8
  },
  abyss: {
    color: '#3F7BFF',
    strands: 5,
    crackle: 0.55,
    flares: 0.6,
    glow: 0.9,
    sparks: 0.4,
    particleCount: 20000,
    fill: 0.8,
    motion: 'orbit',
    particleShape: 'round',
    depth: 0.8,
    sway: 0.8,
    twinkle: 0.5,
    haze: 0.6,
    dustSpeed: 0.9
  }
};

const PRESET_OPTIONS = [
  { label: 'Plasma', value: 'plasma' },
  { label: 'Aurora', value: 'aurora' },
  { label: 'Nebula', value: 'nebula' },
  { label: 'Ember', value: 'ember' },
  { label: 'Frost', value: 'frost' },
  { label: 'Solar', value: 'solar' },
  { label: 'Eclipse', value: 'eclipse' },
  { label: 'Abyss', value: 'abyss' }
];

const MOTION_OPTIONS = [
  { label: 'Rise', value: 'rise' },
  { label: 'Fall', value: 'fall' },
  { label: 'Drift', value: 'drift' },
  { label: 'Orbit', value: 'orbit' }
];

const SHAPE_OPTIONS = [
  { label: 'Square', value: 'square' },
  { label: 'Round', value: 'round' }
];

const DEFAULT_PROPS = {
  preset: 'plasma',
  ...PRESETS.plasma,
  size: 0.7,
  speed: 1,
  interactive: true,
  hoverStrength: 0.7,
  intro: true,
  paused: false
};

const CrystalizedBallDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const theme = useColorModeValue('light', 'dark');

  const choosePreset = value => {
    updateProps({ preset: value, ...(PRESETS[value] || PRESETS.plasma) });
  };

  const propData = useMemo(
    () => [
      {
        name: 'preset',
        type: "'plasma' | 'aurora' | 'nebula' | 'ember' | 'frost' | 'solar' | 'eclipse' | 'abyss'",
        default: "'plasma'",
        description:
          'A complete starting look, color included. Any prop marked from preset overrides the preset value when you pass it.'
      },
      {
        name: 'color',
        type: 'string',
        default: 'from preset',
        description:
          'The one color of the ball. The white-hot rim, its glow and flares, the dust tones, sparks and haze are all derived from it.'
      },
      {
        name: 'theme',
        type: "'dark' | 'light'",
        default: "'dark'",
        description:
          'The background the ball sits on. Dark renders it as emitted light. Light draws it in crisp ink with a white-hot rim core.'
      },
      {
        name: 'size',
        type: 'number',
        default: '0.7',
        description: 'Diameter of the ball as a fraction of the smaller side of the container.'
      },
      {
        name: 'strands',
        type: 'number',
        default: 'from preset',
        description: 'Number of electric strands braided around the rim, from 1 to 8.'
      },
      {
        name: 'crackle',
        type: 'number',
        default: 'from preset',
        description: 'How far the strands bend and jitter. Low values hum quietly, high values crackle.'
      },
      {
        name: 'flares',
        type: 'number',
        default: 'from preset',
        description: 'How far the glow licks outward from the rim in slow, travelling flares.'
      },
      {
        name: 'glow',
        type: 'number',
        default: 'from preset',
        description: 'Strength of the halo around the rim.'
      },
      {
        name: 'sparks',
        type: 'number',
        default: 'from preset',
        description: 'How often small arcs discharge along the inside of the rim. 0 turns them off.'
      },
      {
        name: 'particleCount',
        type: 'number',
        default: 'from preset',
        description: 'Number of dust particles in the ball, up to 40000.'
      },
      {
        name: 'fill',
        type: 'number',
        default: 'from preset',
        description: 'How full the ball is. Low values pool the dust at the bottom, high values float it up to the top.'
      },
      {
        name: 'motion',
        type: "'rise' | 'fall' | 'drift' | 'orbit'",
        default: 'from preset',
        description:
          'How the dust moves. Rise floats like embers, fall drifts down like snow, drift wanders and orbit loops in small circles.'
      },
      {
        name: 'particleShape',
        type: "'square' | 'round'",
        default: 'from preset',
        description: 'Crisp square pixels or soft round dots.'
      },
      {
        name: 'depth',
        type: 'number',
        default: 'from preset',
        description: 'Strength of the depth cues. Dust at the back of the ball gets smaller and dimmer.'
      },
      {
        name: 'sway',
        type: 'number',
        default: 'from preset',
        description: 'How much the dust turns back and forth inside the glass, showing its depth.'
      },
      {
        name: 'twinkle',
        type: 'number',
        default: 'from preset',
        description: 'How much the dust sparkles on and off.'
      },
      {
        name: 'haze',
        type: 'number',
        default: 'from preset',
        description: 'Strength of the glow that pools under the dust and along the inside of the glass.'
      },
      {
        name: 'speed',
        type: 'number',
        default: '1',
        description: 'Animation speed of the rim, flares and sparks.'
      },
      {
        name: 'dustSpeed',
        type: 'number',
        default: 'from preset',
        description: 'Animation speed of the dust.'
      },
      {
        name: 'interactive',
        type: 'boolean',
        default: 'true',
        description:
          'Lets the cursor touch the ball. The rim heats up and flares toward it, the dust swirls in its wake and turns toward it, and a click shakes the ball.'
      },
      {
        name: 'hoverStrength',
        type: 'number',
        default: '0.7',
        description: 'How strongly the ball reacts to the cursor, from 0 to 1.'
      },
      {
        name: 'intro',
        type: 'boolean',
        default: 'true',
        description: 'On mount the rim powers up and the dust lights up from the bottom of the ball.'
      },
      {
        name: 'paused',
        type: 'boolean',
        default: 'false',
        description: 'Freezes the animation. The dust can still be stirred.'
      },
      { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root element.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root element.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <CrystalizedBall key={key} {...props} theme={theme} />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props.preset} onChange={choosePreset} />
            <PreviewSelect
              title="Motion"
              options={MOTION_OPTIONS}
              value={props.motion}
              onChange={value => updateProp('motion', value)}
            />
            <PreviewSelect
              title="Particle Shape"
              options={SHAPE_OPTIONS}
              value={props.particleShape}
              onChange={value => updateProp('particleShape', value)}
            />

            <PreviewColorPickerCustom
              title="Color"
              color={props.color}
              onChange={value => updateProp('color', value)}
            />

            <PreviewSlider
              title="Size"
              min={0.25}
              max={1}
              step={0.01}
              value={props.size}
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1.5}
              step={0.05}
              value={props.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Haze"
              min={0}
              max={1.5}
              step={0.05}
              value={props.haze}
              onChange={value => updateProp('haze', value)}
            />

            <PreviewSlider
              title="Strands"
              min={1}
              max={8}
              step={1}
              value={props.strands}
              onChange={value => updateProp('strands', value)}
            />
            <PreviewSlider
              title="Crackle"
              min={0}
              max={1}
              step={0.05}
              value={props.crackle}
              onChange={value => updateProp('crackle', value)}
            />
            <PreviewSlider
              title="Flares"
              min={0}
              max={1}
              step={0.05}
              value={props.flares}
              onChange={value => updateProp('flares', value)}
            />
            <PreviewSlider
              title="Sparks"
              min={0}
              max={1}
              step={0.05}
              value={props.sparks}
              onChange={value => updateProp('sparks', value)}
            />

            <PreviewSlider
              title="Particles"
              min={0}
              max={40000}
              step={500}
              value={props.particleCount}
              onChange={value => updateProp('particleCount', value)}
            />
            <PreviewSlider
              title="Fill"
              min={0}
              max={1}
              step={0.05}
              value={props.fill}
              onChange={value => updateProp('fill', value)}
            />
            <PreviewSlider
              title="Depth"
              min={0}
              max={1}
              step={0.05}
              value={props.depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Twinkle"
              min={0}
              max={1}
              step={0.05}
              value={props.twinkle}
              onChange={value => updateProp('twinkle', value)}
            />

            <PreviewSlider
              title="Speed"
              min={0}
              max={2}
              step={0.05}
              value={props.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Dust Speed"
              min={0}
              max={2}
              step={0.05}
              value={props.dustSpeed}
              onChange={value => updateProp('dustSpeed', value)}
            />
            <PreviewSlider
              title="Sway"
              min={0}
              max={1}
              step={0.05}
              value={props.sway}
              onChange={value => updateProp('sway', value)}
            />

            <PreviewSwitch
              title="Interactive"
              isChecked={props.interactive}
              onChange={value => updateProp('interactive', value)}
            />
            <PreviewSlider
              title="Hover Strength"
              min={0}
              max={1}
              step={0.05}
              value={props.hoverStrength}
              isDisabled={!props.interactive}
              onChange={value => updateProp('hoverStrength', value)}
            />
            <PreviewSwitch title="Intro" isChecked={props.intro} onChange={value => updateProp('intro', value)} />
            <PreviewSwitch title="Paused" isChecked={props.paused} onChange={value => updateProp('paused', value)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={crystalizedBall} componentName="CrystalizedBall" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CrystalizedBallDemo;
