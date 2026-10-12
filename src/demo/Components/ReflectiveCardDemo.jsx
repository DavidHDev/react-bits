import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import ReflectiveCard from '../../content/Components/ReflectiveCard/ReflectiveCard';
import { reflectiveCard } from '../../constants/code/Components/reflectiveCardCode';

const LOOK = {
  tint: '#ffffff',
  metalness: 1,
  roughness: 0.3,
  blurStrength: 6,
  grayscale: 1,
  warp: 0.6,
  warpScale: 1,
  shine: 1,
  bevel: 3,
  glare: 0.5
};

const DEFAULT_PROPS = {
  preset: 'steel',
  source: 'video',
  name: 'Alexander Doe',
  role: 'Senior Developer',
  ...LOOK,
  tiltStrength: 12,
  radius: 24,
  enableTilt: true,
  intro: true
};

const PRESETS = {
  steel: {},
  brushed: { roughness: 0.85, blurStrength: 8, shine: 1.2 },
  mirror: { roughness: 0, blurStrength: 1.5, warp: 0.3 },
  gold: { tint: '#f3cf8a', shine: 1.1 },
  rose: { tint: '#f1b9a4' },
  satin: { blurStrength: 14, roughness: 0.5, glare: 0.4 }
};

const PRESET_OPTIONS = [
  { value: 'steel', label: 'Steel' },
  { value: 'brushed', label: 'Brushed' },
  { value: 'mirror', label: 'Mirror' },
  { value: 'gold', label: 'Gold' },
  { value: 'rose', label: 'Rose' },
  { value: 'satin', label: 'Satin' }
];

const SOURCE_OPTIONS = [
  { value: 'video', label: 'Video' },
  { value: 'studio', label: 'Studio' },
  { value: 'camera', label: 'Camera' }
];

const VIDEOS = {
  light: '/assets/demo/reflection-day.mp4',
  dark: '/assets/demo/reflection-night.mp4'
};

const propData = [
  { name: 'name', type: 'string', default: "'Alexander Doe'", description: 'Name shown on the card.' },
  { name: 'role', type: 'string', default: "'Senior Developer'", description: 'Role shown under the name.' },
  { name: 'badge', type: 'string', default: "'Verified'", description: 'Label of the badge in the top left corner.' },
  {
    name: 'status',
    type: 'string',
    default: "'Active'",
    description: 'Label of the status chip in the top right corner.'
  },
  { name: 'statusColor', type: 'string', default: "'#22c55e'", description: 'Color of the status dot.' },
  { name: 'idLabel', type: 'string', default: "'ID number'", description: 'Small label above the ID number.' },
  { name: 'idValue', type: 'string', default: "'8901 2345 6789'", description: 'ID number shown in the footer.' },
  {
    name: 'children',
    type: 'ReactNode',
    default: '-',
    description: 'Custom content for the card. Replaces the badge, name and footer.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Dark graphite or light silver metal, with matching text.'
  },
  {
    name: 'videoSrc',
    type: 'string',
    default: '-',
    description: 'Looping video the card reflects when the camera is off. Without one it reflects a soft studio.'
  },
  {
    name: 'webcam',
    type: 'boolean',
    default: 'false',
    description: 'Reflects the camera feed, mirrored. Asks for camera access and falls back to the video.'
  },
  {
    name: 'onWebcamError',
    type: '(error: Error) => void',
    default: '-',
    description: 'Called when camera access is denied or unavailable.'
  },
  { name: 'tint', type: 'string', default: "'#ffffff'", description: 'Color of the metal. White gives plain steel.' },
  {
    name: 'metalness',
    type: 'number',
    default: '1',
    description: 'How strongly the surface mirrors the scene, from 0 to 1. At 0 the card turns matte.'
  },
  {
    name: 'roughness',
    type: 'number',
    default: '0.3',
    description: 'Brushed grain of the metal, from 0 to 1. Stretches reflections along the grain.'
  },
  { name: 'blurStrength', type: 'number', default: '6', description: 'Blur of the reflection, in px.' },
  {
    name: 'grayscale',
    type: 'number',
    default: '1',
    description: 'Removes color from the reflection, from 0 to 1. Lower it to see the scene in color.'
  },
  {
    name: 'warp',
    type: 'number',
    default: '0.6',
    description: 'Gentle bends in the surface that ripple the reflection.'
  },
  { name: 'warpScale', type: 'number', default: '1', description: 'Size of the bends.' },
  {
    name: 'shine',
    type: 'number',
    default: '1',
    description: 'Brightness of the light band that sweeps across the card as it tilts.'
  },
  {
    name: 'bevel',
    type: 'number',
    default: '3',
    description: 'Width of the polished edge that catches the light, in px.'
  },
  {
    name: 'glare',
    type: 'number',
    default: '0.5',
    description: 'Strength of the light that follows the cursor, from 0 to 1.'
  },
  { name: 'enableTilt', type: 'boolean', default: 'true', description: 'Tilts the card toward the cursor.' },
  { name: 'tiltStrength', type: 'number', default: '12', description: 'Largest tilt angle, in degrees.' },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Fades the card in and sweeps the light across it once.'
  },
  { name: 'width', type: 'number | string', default: '320', description: 'Width of the card. Numbers are in px.' },
  { name: 'height', type: 'number | string', default: '500', description: 'Height of the card. Numbers are in px.' },
  { name: 'radius', type: 'number', default: '24', description: 'Corner radius, in px.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the card.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the card.' }
];

const ReflectiveCardDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, source, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = useMemo(
    () => ({
      ...(source === 'camera' ? { webcam: true } : {}),
      ...(theme === 'light' ? { theme: 'light' } : {})
    }),
    [source, theme]
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'source']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={640} overflow="hidden">
            <ReflectiveCard
              key={key}
              theme={theme}
              videoSrc={source === 'studio' ? undefined : VIDEOS[theme]}
              webcam={source === 'camera'}
              onWebcamError={() => updateProp('source', 'video')}
              {...settings}
            />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Reflection"
              options={SOURCE_OPTIONS}
              value={source}
              onChange={value => updateProp('source', value)}
            />
            <PreviewColorPickerCustom
              title="Tint"
              color={settings.tint}
              onChange={value => updateProp('tint', value)}
            />
            <PreviewInput
              title="Name"
              value={settings.name}
              maxLength={28}
              onChange={value => updateProp('name', value)}
            />
            <PreviewInput
              title="Role"
              value={settings.role}
              maxLength={32}
              onChange={value => updateProp('role', value)}
            />
            <PreviewSlider
              title="Metalness"
              min={0}
              max={1}
              step={0.05}
              value={settings.metalness}
              onChange={value => updateProp('metalness', value)}
            />
            <PreviewSlider
              title="Roughness"
              min={0}
              max={1}
              step={0.05}
              value={settings.roughness}
              onChange={value => updateProp('roughness', value)}
            />
            <PreviewSlider
              title="Blur"
              min={0}
              max={20}
              step={0.5}
              value={settings.blurStrength}
              valueUnit="px"
              onChange={value => updateProp('blurStrength', value)}
            />
            <PreviewSlider
              title="Grayscale"
              min={0}
              max={1}
              step={0.05}
              value={settings.grayscale}
              onChange={value => updateProp('grayscale', value)}
            />
            <PreviewSlider
              title="Shine"
              min={0}
              max={2}
              step={0.05}
              value={settings.shine}
              onChange={value => updateProp('shine', value)}
            />
            <PreviewSlider
              title="Glare"
              min={0}
              max={1}
              step={0.05}
              value={settings.glare}
              onChange={value => updateProp('glare', value)}
            />
            <PreviewSlider
              title="Warp"
              min={0}
              max={2}
              step={0.05}
              value={settings.warp}
              onChange={value => updateProp('warp', value)}
            />
            <PreviewSlider
              title="Warp Scale"
              min={0.3}
              max={3}
              step={0.05}
              value={settings.warpScale}
              onChange={value => updateProp('warpScale', value)}
            />
            <PreviewSlider
              title="Bevel"
              min={0}
              max={12}
              step={0.5}
              value={settings.bevel}
              valueUnit="px"
              onChange={value => updateProp('bevel', value)}
            />
            <PreviewSlider
              title="Tilt Strength"
              min={0}
              max={25}
              step={1}
              value={settings.tiltStrength}
              valueUnit="°"
              onChange={value => updateProp('tiltStrength', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={40}
              step={1}
              value={settings.radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSwitch
              title="Tilt"
              isChecked={settings.enableTilt}
              onChange={value => updateProp('enableTilt', value)}
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
          <Dependencies dependencyList={['@hugeicons/react', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={reflectiveCard} componentName="ReflectiveCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default ReflectiveCardDemo;
