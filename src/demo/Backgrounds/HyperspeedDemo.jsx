import { useMemo } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import useComponentProps from '../../hooks/useComponentProps';
import { useColorModeValue } from '../../components/setup/color-mode';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import PropTable from '../../components/common/Preview/PropTable';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorList from '../../components/common/Preview/PreviewColorList';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import Customize from '../../components/common/Preview/Customize';

import BackgroundContent from '../../components/common/Preview/BackgroundContent';

import Hyperspeed from '../../content/Backgrounds/Hyperspeed/Hyperspeed';
import { hyperspeed } from '../../constants/code/Backgrounds/hyperspeedCode';

const DEFAULT_PROPS = {
  preset: 'cyberpunk',
  tailColors: ['#d856bf', '#6750a2', '#c247ac'],
  headColors: ['#03b3c3', '#0e5ea5', '#324555'],
  poleColors: ['#03b3c3'],
  roadColor: '#08080a',
  lineColor: '#25252d',
  curve: 'winding',
  curvature: 1,
  speed: 1,
  boost: 3,
  fov: 90,
  boostFov: 130,
  lanes: 3,
  roadWidth: 10,
  medianWidth: 2,
  density: 40,
  trailLength: 1,
  lightSize: 1,
  poles: 20,
  dust: 100,
  glow: 0.6,
  reflections: 0.5,
  roadOpacity: 0.1,
  steer: 0.35,
  interactive: true
};

const PRESETS = {
  cyberpunk: {},
  night: {
    tailColors: ['#ff2d55', '#ff5a36', '#e8174a'],
    headColors: ['#eef4ff', '#9cc8ff', '#ffffff'],
    poleColors: ['#ffb547']
  },
  akira: {
    curve: 'hills',
    roadWidth: 9,
    density: 50,
    poles: 50,
    tailColors: ['#ff102a', '#eb383e', '#ff102a'],
    headColors: ['#dadafa', '#bebae3', '#8f97e4'],
    poleColors: ['#dadafa']
  },
  golden: {
    curve: 'gentle',
    roadWidth: 9,
    density: 30,
    poles: 50,
    tailColors: ['#7d0d1b', '#a90519', '#ff102a'],
    headColors: ['#f1eece', '#e6e2b1', '#dfd98a'],
    poleColors: ['#f1eece']
  },
  split: {
    curve: 'racing',
    lanes: 2,
    medianWidth: 5,
    density: 70,
    poles: 50,
    tailColors: ['#ff5f73', '#e74d60', '#ff102a'],
    headColors: ['#a4e3e6', '#80d1d4', '#53c2c6'],
    poleColors: ['#a4e3e6']
  },
  highway: {
    roadWidth: 9,
    density: 50,
    poles: 50,
    tailColors: ['#dc5b20', '#dca320', '#dc2020'],
    headColors: ['#334bf7', '#e5e6ed', '#bfc6f3'],
    poleColors: ['#c5e8eb']
  },
  deep: {
    curve: 'deep',
    roadWidth: 18,
    density: 50,
    poles: 50,
    tailColors: ['#ff322f', '#a33010', '#a81508'],
    headColors: ['#fdfdf0', '#f3dea0', '#e2bb88'],
    poleColors: ['#fdfdf0']
  }
};

const PRESET_OPTIONS = [
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'night', label: 'Night Drive' },
  { value: 'akira', label: 'Akira' },
  { value: 'golden', label: 'Golden' },
  { value: 'split', label: 'Split' },
  { value: 'highway', label: 'Highway' },
  { value: 'deep', label: 'Deep' }
];

const CURVE_OPTIONS = [
  { value: 'straight', label: 'Straight' },
  { value: 'gentle', label: 'Gentle' },
  { value: 'winding', label: 'Winding' },
  { value: 'hills', label: 'Hills' },
  { value: 'racing', label: 'Racing' },
  { value: 'deep', label: 'Deep' }
];

const HyperspeedDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(key => [key, defaultProps[key]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const propData = useMemo(
    () => [
      {
        name: 'tailColors',
        type: 'string[]',
        default: '-',
        description: 'Colors of the lights moving away on the left road. Defaults to magentas and violet.'
      },
      {
        name: 'headColors',
        type: 'string[]',
        default: '-',
        description: 'Colors of the oncoming lights on the right road. Defaults to cyan and deep blues.'
      },
      {
        name: 'poleColors',
        type: 'string[]',
        default: '-',
        description: 'Colors of the light poles along both shoulders.'
      },
      {
        name: 'curve',
        type: "'straight' | 'gentle' | 'winding' | 'hills' | 'racing' | 'deep'",
        default: "'winding'",
        description: 'Shape of the road. Switching between curves morphs the road smoothly.'
      },
      { name: 'curvature', type: 'number', default: '1', description: 'How strongly the road bends. 0 is straight.' },
      {
        name: 'speed',
        type: 'number',
        default: '1',
        description: 'Cruising speed of the traffic, poles and road markings.'
      },
      {
        name: 'boost',
        type: 'number',
        default: '3',
        description:
          'Speed multiplier while the pointer is held down. The lights stretch into longer trails as it kicks in.'
      },
      { name: 'fov', type: 'number', default: '90', description: 'Camera field of view in degrees.' },
      {
        name: 'boostFov',
        type: 'number',
        default: '130',
        description: 'Field of view while boosting. The camera springs between the two for a punchy warp.'
      },
      { name: 'lanes', type: 'number', default: '3', description: 'Lanes on each side of the road.' },
      { name: 'roadWidth', type: 'number', default: '10', description: 'Width of each side of the road.' },
      { name: 'medianWidth', type: 'number', default: '2', description: 'Width of the strip between the two sides.' },
      { name: 'density', type: 'number', default: '40', description: 'Cars on each side of the road, up to 160.' },
      { name: 'trailLength', type: 'number', default: '1', description: 'Length of the light trails.' },
      { name: 'lightSize', type: 'number', default: '1', description: 'Thickness of the light trails.' },
      {
        name: 'poles',
        type: 'number',
        default: '20',
        description: 'Light poles on each shoulder, up to 80. 0 removes them.'
      },
      { name: 'poleHeight', type: 'number', default: '1', description: 'Height of the light poles.' },
      {
        name: 'dust',
        type: 'number',
        default: '100',
        description: 'Speed streaks flying past in the air, up to 1500. They stretch into warp lines while boosting.'
      },
      {
        name: 'glow',
        type: 'number',
        default: '0.6',
        description: 'Soft bloom around every light. Dense traffic glows brighter. 0 turns it off.'
      },
      {
        name: 'reflections',
        type: 'number',
        default: '0.5',
        description: 'How much the lights reflect on the road, like wet asphalt at night.'
      },
      {
        name: 'roadOpacity',
        type: 'number',
        default: '0.1',
        description:
          'Opacity of the road and its markings. Lower it to let your page show through under the traffic. Reflections fade with it.'
      },
      {
        name: 'steer',
        type: 'number',
        default: '0.35',
        description: 'How far the camera drifts and turns toward the pointer.'
      },
      {
        name: 'roadColor',
        type: 'string',
        default: '-',
        description:
          'Color of the asphalt. The median strip takes a slightly lighter shade. Follows the theme when not set.'
      },
      {
        name: 'lineColor',
        type: 'string',
        default: '-',
        description: 'Color of the lane markings. Follows the theme when not set.'
      },
      {
        name: 'background',
        type: 'string',
        default: '-',
        description:
          'Color behind the road, which the road fades into. Leave it unset to keep the canvas transparent so your page shows through.'
      },
      {
        name: 'theme',
        type: "'dark' | 'light'",
        default: "'dark'",
        description: 'Dark renders glowing light trails. Light renders crisp colored trails on a pale road.'
      },
      {
        name: 'interactive',
        type: 'boolean',
        default: 'true',
        description: 'Click and hold to boost, and let the camera follow the pointer.'
      },
      {
        name: 'boosting',
        type: 'boolean',
        default: 'false',
        description: 'Turns the boost on from your own code, for example while something loads.'
      },
      { name: 'onBoostStart', type: '() => void', default: '-', description: 'Called when the user starts boosting.' },
      { name: 'onBoostEnd', type: '() => void', default: '-', description: 'Called when the user lets go.' },
      { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
    ],
    []
  );

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
          <Box position="relative" className="demo-container" overflow="hidden" h={500} p={0} mb={4}>
            <Hyperspeed {...settings} theme={theme} />

            <BackgroundContent pillText="New Background" headline="Click & hold to see the real magic of hyperspeed!" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="hyperspeed" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />

            <PreviewColorList
              title="Tail Lights"
              colors={props.tailColors}
              min={1}
              onChange={value => updateProp('tailColors', value)}
            />

            <PreviewColorList
              title="Headlights"
              colors={props.headColors}
              min={1}
              onChange={value => updateProp('headColors', value)}
            />

            <PreviewColorList
              title="Poles"
              colors={props.poleColors}
              min={1}
              onChange={value => updateProp('poleColors', value)}
            />

            <PreviewColorPickerCustom
              title="Road Color"
              color={props.roadColor}
              onChange={value => updateProp('roadColor', value)}
            />

            <PreviewColorPickerCustom
              title="Line Color"
              color={props.lineColor}
              onChange={value => updateProp('lineColor', value)}
            />

            <PreviewSelect
              title="Curve"
              options={CURVE_OPTIONS}
              value={props.curve}
              onChange={value => updateProp('curve', value)}
            />

            <PreviewSlider
              title="Curvature"
              min={0}
              max={2}
              step={0.05}
              value={props.curvature}
              onChange={value => updateProp('curvature', value)}
            />

            <PreviewSlider
              title="Speed"
              min={0.1}
              max={3}
              step={0.05}
              value={props.speed}
              onChange={value => updateProp('speed', value)}
            />

            <PreviewSlider
              title="Boost"
              min={1}
              max={8}
              step={0.5}
              value={props.boost}
              onChange={value => updateProp('boost', value)}
              valueUnit="×"
            />

            <PreviewSlider
              title="FOV"
              min={50}
              max={130}
              step={1}
              value={props.fov}
              onChange={value => updateProp('fov', value)}
              valueUnit="°"
            />

            <PreviewSlider
              title="Boost FOV"
              min={50}
              max={160}
              step={1}
              value={props.boostFov}
              onChange={value => updateProp('boostFov', value)}
              valueUnit="°"
            />

            <PreviewSlider
              title="Lanes"
              min={1}
              max={6}
              step={1}
              value={props.lanes}
              onChange={value => updateProp('lanes', value)}
            />

            <PreviewSlider
              title="Road Width"
              min={4}
              max={20}
              step={0.5}
              value={props.roadWidth}
              onChange={value => updateProp('roadWidth', value)}
            />

            <PreviewSlider
              title="Median"
              min={0}
              max={8}
              step={0.5}
              value={props.medianWidth}
              onChange={value => updateProp('medianWidth', value)}
            />

            <PreviewSlider
              title="Density"
              min={0}
              max={160}
              step={1}
              value={props.density}
              onChange={value => updateProp('density', value)}
            />

            <PreviewSlider
              title="Trail Length"
              min={0.2}
              max={3}
              step={0.05}
              value={props.trailLength}
              onChange={value => updateProp('trailLength', value)}
            />

            <PreviewSlider
              title="Light Size"
              min={0.3}
              max={3}
              step={0.05}
              value={props.lightSize}
              onChange={value => updateProp('lightSize', value)}
            />

            <PreviewSlider
              title="Poles"
              min={0}
              max={80}
              step={1}
              value={props.poles}
              onChange={value => updateProp('poles', value)}
            />

            <PreviewSlider
              title="Dust"
              min={0}
              max={1500}
              step={10}
              value={props.dust}
              onChange={value => updateProp('dust', value)}
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
              title="Reflections"
              min={0}
              max={1.5}
              step={0.05}
              value={props.reflections}
              onChange={value => updateProp('reflections', value)}
            />

            <PreviewSlider
              title="Road Opacity"
              min={0}
              max={1}
              step={0.05}
              value={props.roadOpacity}
              onChange={value => updateProp('roadOpacity', value)}
            />

            <PreviewSlider
              title="Steer"
              min={0}
              max={1}
              step={0.05}
              value={props.steer}
              onChange={value => updateProp('steer', value)}
            />

            <PreviewSwitch
              title="Interactive"
              isChecked={props.interactive}
              onChange={value => updateProp('interactive', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['three']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={hyperspeed} componentName="Hyperspeed" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default HyperspeedDemo;
