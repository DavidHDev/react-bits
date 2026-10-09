import { useMemo } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';

import StarBorder from '../../content/Animations/StarBorder/StarBorder';
import { starBorder } from '../../constants/code/Animations/starBorderCode';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

const DEFAULT_PROPS = {
  preset: 'comet',
  color: '#ffffff',
  trailColor: '#ffffff',
  duration: 4,
  direction: 'clockwise',
  stars: 1,
  trailLength: 0.3,
  thickness: 1,
  radius: 12,
  glow: 0.6,
  sparkle: false,
  hover: 'lap',
  clickPulse: true
};

const PRESETS = {
  comet: {},
  twin: { stars: 2, duration: 5, trailLength: 0.25 },
  ember: { color: '#ffcf8a', trailColor: '#ff4d2e', trailLength: 0.45, glow: 0.8 },
  frost: { color: '#e0f7ff', trailColor: '#38bdf8', thickness: 1.5, radius: 24 },
  stardust: { sparkle: true, duration: 6, glow: 0.7 },
  quiet: { hover: 'brighten', duration: 7, trailLength: 0.2, glow: 0.35 },
  reveal: { hover: 'reveal', duration: 3, trailLength: 0.4 }
};

const PRESET_OPTIONS = [
  { value: 'comet', label: 'Comet' },
  { value: 'twin', label: 'Twin' },
  { value: 'ember', label: 'Ember' },
  { value: 'frost', label: 'Frost' },
  { value: 'stardust', label: 'Stardust' },
  { value: 'quiet', label: 'Quiet' },
  { value: 'reveal', label: 'Reveal' }
];

const LIGHT_SWAP = {
  '#ffffff': '#18181b',
  '#ffcf8a': '#c2410c',
  '#ff4d2e': '#fb923c',
  '#e0f7ff': '#0369a1'
};

const DIRECTION_OPTIONS = [
  { value: 'clockwise', label: 'Clockwise' },
  { value: 'counterclockwise', label: 'Counterclockwise' }
];

const HOVER_OPTIONS = [
  { value: 'lap', label: 'Lap' },
  { value: 'brighten', label: 'Brighten' },
  { value: 'reveal', label: 'Reveal' },
  { value: 'none', label: 'None' }
];

const StarBorderDemo = () => {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, color, trailColor, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');
  const light = theme === 'light';
  const swap = value => (light ? (LIGHT_SWAP[value] ?? value) : value);
  const shownColor = swap(color);
  const shownTrail = trailColor === DEFAULT_PROPS.trailColor ? shownColor : swap(trailColor);

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(key => [key, DEFAULT_PROPS[key]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = useMemo(
    () => ({ color: shownColor, trailColor: shownTrail, ...(light ? { theme: 'light' } : {}) }),
    [shownColor, shownTrail, light]
  );

  const shared = { ...settings, color: shownColor, trailColor: shownTrail, theme };

  const propData = useMemo(
    () => [
      {
        name: 'as',
        type: 'ElementType',
        default: "'button'",
        description: 'Element or component to render, for example a, div or a router Link.'
      },
      {
        name: 'color',
        type: 'string',
        default: '-',
        description: 'Color of the star and its glow. Defaults to white on dark and ink on light.'
      },
      {
        name: 'trailColor',
        type: 'string',
        default: '-',
        description: 'Color the trail fades into behind the star. Defaults to color.'
      },
      {
        name: 'duration',
        type: 'number',
        default: '4',
        description: 'Seconds for one lap around the border. The star keeps the same pace on any shape.'
      },
      {
        name: 'direction',
        type: "'clockwise' | 'counterclockwise'",
        default: "'clockwise'",
        description: 'Which way the star travels.'
      },
      {
        name: 'stars',
        type: 'number',
        default: '1',
        description: 'Stars spaced evenly around the border, up to 6.'
      },
      {
        name: 'trailLength',
        type: 'number',
        default: '0.3',
        description: 'Length of the trail as a share of the border. Trails stretch when the star speeds up.'
      },
      { name: 'thickness', type: 'number', default: '1', description: 'Border width in pixels.' },
      {
        name: 'radius',
        type: 'number',
        default: '12',
        description: 'Corner radius in pixels. Values past half the height give a pill.'
      },
      {
        name: 'glow',
        type: 'number',
        default: '0.6',
        description: 'Bloom around the star and its trail, from 0 to 1. Light spills onto the surface and the page.'
      },
      {
        name: 'sparkle',
        type: 'boolean',
        default: 'false',
        description: 'Puts a small twinkling glint at the front of each trail and lets it shed fine stardust.'
      },
      {
        name: 'hover',
        type: "'lap' | 'brighten' | 'reveal' | 'none'",
        default: "'lap'",
        description:
          'What happens on hover and keyboard focus. Lap sends the star once around the border, brighten makes the light shine stronger, and reveal keeps it hidden until then.'
      },
      {
        name: 'clickPulse',
        type: 'boolean',
        default: 'true',
        description: 'Sends light racing around the border from the point you press.'
      },
      {
        name: 'theme',
        type: "'dark' | 'light'",
        default: "'dark'",
        description: 'Picks the default surface, text, border and star colors.'
      },
      {
        name: 'backgroundColor',
        type: 'string',
        default: '-',
        description: 'Surface color. Follows the theme when not set.'
      },
      { name: 'textColor', type: 'string', default: '-', description: 'Text color. Follows the theme when not set.' },
      {
        name: 'borderColor',
        type: 'string',
        default: '-',
        description: 'Color of the resting border the star travels on. Follows the theme when not set.'
      },
      {
        name: 'className',
        type: 'string',
        default: "''",
        description: 'Extra classes for the root, for example to change padding or font.'
      },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root.' }
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
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400}>
            <Flex align="center" justify="center" w="100%" h="100%">
              <StarBorder
                {...shared}
                backgroundColor="var(--bg-elevated)"
                borderColor="var(--border-primary)"
                style={{ height: 48, padding: '0 22px', fontSize: 15 }}
              >
                Get started
                <HugeiconsIcon icon={ArrowRight02Icon} size={17} strokeWidth={1.8} />
              </StarBorder>
            </Flex>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />

            <PreviewColorPickerCustom title="Color" color={shownColor} onChange={value => updateProp('color', value)} />

            <PreviewColorPickerCustom
              title="Trail Color"
              color={shownTrail}
              onChange={value => updateProp('trailColor', value)}
            />

            <PreviewSlider
              title="Duration"
              min={1}
              max={12}
              step={0.5}
              value={props.duration}
              valueUnit="s"
              onChange={value => updateProp('duration', value)}
            />

            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={props.direction}
              onChange={value => updateProp('direction', value)}
            />

            <PreviewSlider
              title="Stars"
              min={1}
              max={6}
              step={1}
              value={props.stars}
              onChange={value => updateProp('stars', value)}
            />

            <PreviewSlider
              title="Trail Length"
              min={0.05}
              max={0.8}
              step={0.05}
              value={props.trailLength}
              onChange={value => updateProp('trailLength', value)}
            />

            <PreviewSlider
              title="Thickness"
              min={0.5}
              max={4}
              step={0.5}
              value={props.thickness}
              valueUnit="px"
              onChange={value => updateProp('thickness', value)}
            />

            <PreviewSlider
              title="Radius"
              min={0}
              max={30}
              step={1}
              value={props.radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />

            <PreviewSlider
              title="Glow"
              min={0}
              max={1}
              step={0.05}
              value={props.glow}
              onChange={value => updateProp('glow', value)}
            />

            <PreviewSelect
              title="Hover"
              options={HOVER_OPTIONS}
              value={props.hover}
              onChange={value => updateProp('hover', value)}
            />

            <PreviewSwitch title="Sparkle" isChecked={props.sparkle} onChange={value => updateProp('sparkle', value)} />

            <PreviewSwitch
              title="Click Pulse"
              isChecked={props.clickPulse}
              onChange={value => updateProp('clickPulse', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={starBorder} componentName="StarBorder" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default StarBorderDemo;
