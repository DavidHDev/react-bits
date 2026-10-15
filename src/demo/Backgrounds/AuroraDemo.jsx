import { Box, Flex } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import Aurora from '../../content/Backgrounds/Aurora/Aurora';
import { aurora } from '../../constants/code/Backgrounds/auroraCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/Aurora';

const DIRECTION_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' }
];

const propData = [
  {
    name: 'colorStops',
    type: 'string[]',
    default: "['#5227FF', '#7cff67', '#5227FF']",
    description: 'Two to five colors that blend across the aurora from left to right.'
  },
  { name: 'amplitude', type: 'number', default: '1', description: 'How tall the waves along the edge are.' },
  { name: 'blend', type: 'number', default: '0.5', description: 'How softly the edge fades out, from 0 to 1.' },
  {
    name: 'height',
    type: 'number',
    default: '0.45',
    description: 'How far the aurora reaches into the container, from 0 to 1.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'Speed of the flowing motion.' },
  {
    name: 'scale',
    type: 'number',
    default: '1',
    description: 'Size of the waves. Lower values make broader, calmer shapes.'
  },
  {
    name: 'glow',
    type: 'number',
    default: '0.6',
    description: 'How far the light spills softly past the edge.'
  },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness of the light.' },
  {
    name: 'layers',
    type: 'number',
    default: '1',
    description: 'Number of curtains, from 1 to 3. Extra ones glow fainter behind for depth.'
  },
  {
    name: 'direction',
    type: "'top' | 'bottom'",
    default: "'top'",
    description: 'Whether the aurora hangs from the top or rises from the bottom.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'The light gently reaches toward the cursor.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Fades the aurora in as it unfurls on mount.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the aurora as soft pastel light for white backgrounds.'
  },
  {
    name: 'time',
    type: 'number',
    default: '-',
    description: 'Drives the animation from your own clock, for example scroll progress, instead of real time.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const AuroraDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { defaults: defaultProps }), preset: value });
  };

  const setColor = (index, value) => {
    const next = [...settings.colorStops];
    next[index] = value;
    updateProp('colorStops', next);
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
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <Aurora key={key} {...settings} />
            <BackgroundContent headline="Bring the Arctic to you, with one line of code" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="aurora" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            {['Color 1', 'Color 2', 'Color 3'].map((title, index) => (
              <PreviewColorPickerCustom
                key={title}
                title={title}
                color={settings.colorStops[index] ?? settings.colorStops[0]}
                onChange={value => setColor(index, value)}
              />
            ))}
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.direction}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewSlider
              title="Height"
              min={0.1}
              max={0.9}
              step={0.01}
              value={settings.height}
              onChange={value => updateProp('height', value)}
            />
            <PreviewSlider
              title="Amplitude"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.amplitude}
              onChange={value => updateProp('amplitude', value)}
            />
            <PreviewSlider
              title="Blend"
              min={0}
              max={1}
              step={0.01}
              value={settings.blend}
              onChange={value => updateProp('blend', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={2}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.3}
              max={3}
              step={0.05}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.2}
              max={2}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Layers"
              min={1}
              max={3}
              step={1}
              value={settings.layers}
              onChange={value => updateProp('layers', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings.intro} onChange={value => updateProp('intro', value)} />
            <PreviewSwitch
              title="Light Mode"
              isChecked={settings.lightMode}
              onChange={value => updateProp('lightMode', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={aurora} componentName="Aurora" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default AuroraDemo;
