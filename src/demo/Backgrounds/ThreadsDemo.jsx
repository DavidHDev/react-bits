import { useMemo } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import Threads from '../../content/Backgrounds/Threads/Threads';
import { threads } from '../../constants/code/Backgrounds/threadsCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/Threads';

const propData = [
  {
    name: 'color',
    type: 'string | number[]',
    default: '[1, 1, 1]',
    description: 'Color of the threads. Any CSS color, or an RGB array from 0 to 1.'
  },
  {
    name: 'accentColor',
    type: 'string | number[]',
    default: '-',
    description: 'Color the outer threads blend toward. Leave it out for a single color.'
  },
  { name: 'lineCount', type: 'number', default: '90', description: 'Number of threads.' },
  { name: 'thickness', type: 'number', default: '0.6', description: 'Width of the threads.' },
  {
    name: 'softness',
    type: 'number',
    default: '1.3',
    description: 'How much the threads soften as they separate. 0 keeps every thread crisp.'
  },
  { name: 'amplitude', type: 'number', default: '1.7', description: 'Height of the waves.' },
  {
    name: 'distance',
    type: 'number',
    default: '0.4',
    description: 'Spacing between the threads. 0 starts them all from a single line.'
  },
  { name: 'waves', type: 'number', default: '1.05', description: 'How many waves run along each thread.' },
  { name: 'speed', type: 'number', default: '0.6', description: 'Animation speed. 0 holds the threads still.' },
  {
    name: 'split',
    type: 'number',
    default: '0.04',
    description: 'Where the first thread leaves the bundle, from 0 at the start to 1 at the end.'
  },
  {
    name: 'fray',
    type: 'number',
    default: '0.5',
    description: 'How gradually the other threads peel away after the first one.'
  },
  { name: 'angle', type: 'number', default: '25', description: 'Direction of the threads in degrees.' },
  {
    name: 'taper',
    type: 'number',
    default: '0.85',
    description: 'How much the outer threads fade away, from 0 for all equally bright to 1.'
  },
  { name: 'brightness', type: 'number', default: '1.4', description: 'Brightness of the threads, from 0.25 to 2.' },
  {
    name: 'parting',
    type: 'number',
    default: '0',
    description: 'How far the threads move aside around the cursor, from 0 to 1.'
  },
  {
    name: 'enableMouseInteraction',
    type: 'boolean',
    default: 'false',
    description:
      'Lets the cursor steer the waves: moving sideways shifts them and moving up and down changes their height.'
  },
  {
    name: 'fade',
    type: 'number',
    default: '0',
    description: 'Fades the edges into the page, from 0 to 1.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  { name: 'seed', type: 'number', default: '0', description: 'Changes the wave pattern.' },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const ThreadsDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, accentColor, ...settings } = props;
  const accent = accentColor || undefined;

  const computedProps = useMemo(() => (accent ? { accentColor: accent } : {}), [accent]);

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { defaults: defaultProps }), preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'accentColor']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} overflow="hidden" p={0}>
            <Threads {...settings} {...(accent ? { accentColor: accent } : {})} />

            <BackgroundContent pillText="New Background" headline="Not to be confused with the Threads app by Meta!" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="threads"
              currentProps={{ ...settings, ...(accent ? { accentColor: accent } : {}) }}
              defaultProps={DEFAULT_PROPS}
            />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={props.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Accent"
              color={accentColor || props.color}
              onChange={value => updateProp('accentColor', value)}
            />
            <PreviewSlider
              title="Line Count"
              min={4}
              max={120}
              step={1}
              value={props.lineCount}
              onChange={value => updateProp('lineCount', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={0.2}
              max={4}
              step={0.1}
              value={props.thickness}
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={3}
              step={0.1}
              value={props.softness}
              onChange={value => updateProp('softness', value)}
            />
            <PreviewSlider
              title="Amplitude"
              min={0}
              max={4}
              step={0.1}
              value={props.amplitude}
              onChange={value => updateProp('amplitude', value)}
            />
            <PreviewSlider
              title="Distance"
              min={0}
              max={2}
              step={0.05}
              value={props.distance}
              onChange={value => updateProp('distance', value)}
            />
            <PreviewSlider
              title="Waves"
              min={0.2}
              max={3}
              step={0.05}
              value={props.waves}
              onChange={value => updateProp('waves', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={props.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Split"
              min={0}
              max={0.6}
              step={0.01}
              value={props.split}
              onChange={value => updateProp('split', value)}
            />
            <PreviewSlider
              title="Fray"
              min={0}
              max={1}
              step={0.05}
              value={props.fray}
              onChange={value => updateProp('fray', value)}
            />
            <PreviewSlider
              title="Angle"
              min={-90}
              max={90}
              step={1}
              value={props.angle}
              valueUnit="°"
              onChange={value => updateProp('angle', value)}
            />
            <PreviewSlider
              title="Taper"
              min={0}
              max={1}
              step={0.05}
              value={props.taper}
              onChange={value => updateProp('taper', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.25}
              max={2}
              step={0.05}
              value={props.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Parting"
              min={0}
              max={1}
              step={0.05}
              value={props.parting}
              onChange={value => updateProp('parting', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={props.fade}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.05}
              value={props.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSlider
              title="Seed"
              min={0}
              max={20}
              step={1}
              value={props.seed}
              onChange={value => updateProp('seed', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={props.enableMouseInteraction}
              onChange={value => updateProp('enableMouseInteraction', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={threads} componentName="Threads" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ThreadsDemo;
