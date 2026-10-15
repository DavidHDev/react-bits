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
import { useColorModeValue } from '../../components/setup/color-mode';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import Orb from '../../content/Backgrounds/Orb/Orb';
import { orb } from '../../constants/code/Backgrounds/orbCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/Orb';

const propData = [
  {
    name: 'colors',
    type: 'string[]',
    default: "['#9c43fe', '#4cc2e9', '#101499']",
    description: 'Two colors that swirl around the ring, then the deep color of the glow behind it.'
  },
  { name: 'hue', type: 'number', default: '0', description: 'Shifts the hue of every color, in degrees.' },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'#000000'",
    description: 'Color the orb sits on. Light colors switch it to a soft, filled style.'
  },
  { name: 'size', type: 'number', default: '1', description: 'Size of the orb relative to the container.' },
  { name: 'glow', type: 'number', default: '1', description: 'How soft and wide the glow around the ring is.' },
  {
    name: 'bleed',
    type: 'number',
    default: '1',
    description: 'How far the glow bleeds into the inside of the orb. 0 keeps a tight ring.'
  },
  { name: 'wobble', type: 'number', default: '1', description: 'How much the ring breathes and warps at rest.' },
  { name: 'highlight', type: 'number', default: '1', description: 'Brightness of the light that orbits the ring.' },
  {
    name: 'trail',
    type: 'number',
    default: '1',
    description: 'Length of the glowing tail behind the orbiting light. 0 removes it.'
  },
  {
    name: 'tiltX',
    type: 'number',
    default: '0',
    description: 'Tilts the ring back in perspective, in degrees. Positive values push the top away.'
  },
  {
    name: 'tiltY',
    type: 'number',
    default: '0',
    description: 'Turns the ring sideways in perspective, in degrees.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '1',
    description: 'Speed of the swirl, the orbiting light and the breathing.'
  },
  {
    name: 'hoverIntensity',
    type: 'number',
    default: '1',
    description: 'How far the ring reaches toward the cursor and how brightly it lights up there.'
  },
  {
    name: 'rotateOnHover',
    type: 'boolean',
    default: 'true',
    description: 'Slowly turns the orb while it is hovered.'
  },
  {
    name: 'forceHoverState',
    type: 'boolean',
    default: 'false',
    description: 'Keeps the hover effect on without hovering.'
  },
  {
    name: 'followCursor',
    type: 'boolean',
    default: 'true',
    description: 'The orbiting light swings toward the cursor while the orb is hovered.'
  },
  { name: 'clickPulse', type: 'boolean', default: 'true', description: 'Clicking the orb makes it pulse and swirl.' },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Powers the orb on with a spring and a swirl.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const OrbDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const theme = useColorModeValue('light', 'dark');

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { light: theme === 'light', defaults: defaultProps }), preset: value });
  };

  const setColor = (index, value) => {
    const next = [...settings.colors];
    next[index] = value;
    updateProp('colors', next);
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
            <Orb key={key} {...settings} />
            <BackgroundContent headline="Move closer and the orb reaches for you." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="orb" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Primary Color"
              color={settings.colors[0]}
              onChange={value => setColor(0, value)}
            />
            <PreviewColorPickerCustom
              title="Secondary Color"
              color={settings.colors[1]}
              onChange={value => setColor(1, value)}
            />
            <PreviewColorPickerCustom
              title="Depth Color"
              color={settings.colors[2]}
              onChange={value => setColor(2, value)}
            />
            <PreviewSlider
              title="Hue Shift"
              min={0}
              max={360}
              step={1}
              value={settings.hue}
              valueUnit="°"
              onChange={value => updateProp('hue', value)}
            />
            <PreviewSlider
              title="Size"
              min={0.4}
              max={1.6}
              step={0.01}
              value={settings.size}
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0.3}
              max={3}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Bleed"
              min={0}
              max={3}
              step={0.05}
              value={settings.bleed}
              onChange={value => updateProp('bleed', value)}
            />
            <PreviewSlider
              title="Wobble"
              min={0}
              max={3}
              step={0.05}
              value={settings.wobble}
              onChange={value => updateProp('wobble', value)}
            />
            <PreviewSlider
              title="Highlight"
              min={0}
              max={3}
              step={0.05}
              value={settings.highlight}
              onChange={value => updateProp('highlight', value)}
            />
            <PreviewSlider
              title="Trail"
              min={0}
              max={4}
              step={0.05}
              value={settings.trail}
              onChange={value => updateProp('trail', value)}
            />
            <PreviewSlider
              title="Tilt X"
              min={-70}
              max={70}
              step={1}
              value={settings.tiltX}
              valueUnit="°"
              onChange={value => updateProp('tiltX', value)}
            />
            <PreviewSlider
              title="Tilt Y"
              min={-70}
              max={70}
              step={1}
              value={settings.tiltY}
              valueUnit="°"
              onChange={value => updateProp('tiltY', value)}
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
              title="Hover Intensity"
              min={0}
              max={3}
              step={0.05}
              value={settings.hoverIntensity}
              onChange={value => updateProp('hoverIntensity', value)}
            />
            <PreviewColorPickerCustom
              title="Background Color"
              color={settings.backgroundColor}
              onChange={value => updateProp('backgroundColor', value)}
            />
            <PreviewSwitch
              title="Rotate On Hover"
              isChecked={settings.rotateOnHover}
              onChange={value => updateProp('rotateOnHover', value)}
            />
            <PreviewSwitch
              title="Force Hover State"
              isChecked={settings.forceHoverState}
              onChange={value => updateProp('forceHoverState', value)}
            />
            <PreviewSwitch
              title="Follow Cursor"
              isChecked={settings.followCursor}
              onChange={value => updateProp('followCursor', value)}
            />
            <PreviewSwitch
              title="Click Pulse"
              isChecked={settings.clickPulse}
              onChange={value => updateProp('clickPulse', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings.intro} onChange={value => updateProp('intro', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={orb} componentName="Orb" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default OrbDemo;
