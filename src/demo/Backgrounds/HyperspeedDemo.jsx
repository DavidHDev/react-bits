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
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/Hyperspeed';

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
    updateProps({ ...presetProps(value, { defaults: defaultProps }), preset: value });
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

            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />

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
