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

import Plasma from '../../content/Backgrounds/Plasma/Plasma';
import { plasma } from '../../constants/code/Backgrounds/plasmaCode';

const SHAPE = {
  speed: 1,
  twist: 1,
  wave: 1,
  softness: 0.5,
  shine: 1
};

const DEFAULT_PROPS = {
  preset: 'silver',
  color: '#a6a3b8',
  ...SHAPE,
  direction: 'forward',
  scale: 1,
  brightness: 1,
  grain: 0.04,
  quality: 0.75,
  fade: 0,
  opacity: 1,
  mouseInteractive: true,
  intro: true,
  lightMode: false
};

const PRESETS = {
  silver: { ...SHAPE, color: '#a6a3b8' },
  copper: { ...SHAPE, color: '#ff8a5c' },
  ocean: { ...SHAPE, color: '#4f7cff' },
  jade: { ...SHAPE, color: '#2fbf8f' },
  vortex: { ...SHAPE, color: '#a6a3b8', twist: 1.8, speed: 1.3, softness: 0.3, shine: 1.4 }
};

const PRESET_OPTIONS = [
  { value: 'silver', label: 'Silver' },
  { value: 'copper', label: 'Copper' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'jade', label: 'Jade' },
  { value: 'vortex', label: 'Vortex' }
];

const DIRECTION_OPTIONS = [
  { value: 'forward', label: 'Forward' },
  { value: 'reverse', label: 'Reverse' },
  { value: 'pingpong', label: 'Ping Pong' }
];

const propData = [
  {
    name: 'color',
    type: 'string',
    default: "'#a6a3b8'",
    description: 'Color of the plasma. Highlights are derived from it.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'Animation speed.' },
  {
    name: 'direction',
    type: "'forward' | 'reverse' | 'pingpong'",
    default: "'forward'",
    description: 'Which way the plasma flows. Ping pong eases back and forth.'
  },
  { name: 'scale', type: 'number', default: '1', description: 'Zoom of the plasma. Higher values zoom in.' },
  { name: 'twist', type: 'number', default: '1', description: 'How tightly the plasma spirals.' },
  { name: 'wave', type: 'number', default: '1', description: 'How much the plasma ripples as it flows.' },
  {
    name: 'softness',
    type: 'number',
    default: '0.5',
    description: 'How soft the folds of light are, from 0 for crisp to 1 for misty.'
  },
  { name: 'shine', type: 'number', default: '1', description: 'Strength of the bright highlights along the folds.' },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness.' },
  { name: 'grain', type: 'number', default: '0.04', description: 'Strength of the film grain.' },
  {
    name: 'quality',
    type: 'number',
    default: '0.75',
    description: 'Render resolution, from 0.25 to 1. Lower values run faster on slow devices.'
  },
  {
    name: 'mouseInteractive',
    type: 'boolean',
    default: 'true',
    description: 'Turns the plasma in 3D to follow the cursor and brightens it nearby.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Fades the plasma in as it twists into place.' },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the plasma as tinted satin for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

const PlasmaDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
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
            <Plasma key={key} {...settings} />
            <BackgroundContent headline="Minimal plasma waves that soothe the eyes" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="plasma" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={settings.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.direction}
              onChange={value => updateProp('direction', value)}
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
              title="Scale"
              min={0.5}
              max={2}
              step={0.05}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Twist"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.twist}
              onChange={value => updateProp('twist', value)}
            />
            <PreviewSlider
              title="Wave"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.wave}
              onChange={value => updateProp('wave', value)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.05}
              value={settings.softness}
              onChange={value => updateProp('softness', value)}
            />
            <PreviewSlider
              title="Shine"
              min={0}
              max={3}
              step={0.05}
              value={settings.shine}
              onChange={value => updateProp('shine', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.3}
              max={2}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.15}
              step={0.01}
              value={settings.grain}
              onChange={value => updateProp('grain', value)}
            />
            <PreviewSlider
              title="Quality"
              min={0.25}
              max={1}
              step={0.05}
              value={settings.quality}
              onChange={value => updateProp('quality', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={settings.fade}
              onChange={value => updateProp('fade', value)}
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
              title="Mouse Interactive"
              isChecked={settings.mouseInteractive}
              onChange={value => updateProp('mouseInteractive', value)}
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
          <CodeExample codeObject={plasma} componentName="Plasma" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PlasmaDemo;
