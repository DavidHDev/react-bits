import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUpRight01Icon, Globe02Icon } from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import CodeExample from '../../components/code/CodeExample';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import CircularText from '../../content/TextAnimations/CircularText/CircularText';
import { circularText } from '../../constants/code/TextAnimations/circularTextCode';

const LOOK = {
  text: 'REACT*BITS*COMPONENTS*',
  color: '',
  ringColor: '',
  onHover: 'speedUp',
  direction: 'clockwise',
  spinDuration: 20,
  draggable: true,
  hoverTilt: 20,
  tilt: 0,
  center: 'arrow',
  size: 200,
  fontSize: 24,
  fontWeight: 900,
  letterSpacing: 0,
  startAngle: 0,
  repeat: 1,
  fill: true,
  ring: false
};

const PRESETS = {
  badge: { ...LOOK },
  stamp: {
    ...LOOK,
    text: 'made with care • since 2026 • ',
    color: '#e5484d',
    onHover: 'slowDown',
    direction: 'counterclockwise',
    spinDuration: 30,
    hoverTilt: 12,
    center: 'star',
    size: 220,
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: 0.02,
    repeat: 2,
    fill: false,
    ring: true
  },
  orbit: {
    ...LOOK,
    text: 'around the world • ',
    onHover: 'slowDown',
    spinDuration: 40,
    hoverTilt: 10,
    tilt: 58,
    center: 'globe',
    size: 300,
    fontSize: 19,
    fontWeight: 700,
    letterSpacing: 0.02,
    repeat: 3,
    fill: false
  },
  bonkers: {
    ...LOOK,
    text: 'spin me ',
    onHover: 'goBonkers',
    spinDuration: 8,
    hoverTilt: 30,
    center: 'none',
    size: 240,
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: 0.02,
    repeat: 4,
    fill: false
  }
};

const DEFAULT_PROPS = {
  preset: 'badge',
  ...LOOK
};

const PRESET_OPTIONS = [
  { value: 'badge', label: 'Badge' },
  { value: 'stamp', label: 'Stamp' },
  { value: 'orbit', label: 'Orbit' },
  { value: 'bonkers', label: 'Bonkers' }
];

const HOVER_OPTIONS = [
  { value: 'slowDown', label: 'Slow Down' },
  { value: 'speedUp', label: 'Speed Up' },
  { value: 'pause', label: 'Pause' },
  { value: 'goBonkers', label: 'Go Bonkers' }
];

const DIRECTION_OPTIONS = [
  { value: 'clockwise', label: 'Clockwise' },
  { value: 'counterclockwise', label: 'Counterclockwise' }
];

const CENTER_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'arrow', label: 'Arrow' },
  { value: 'star', label: 'Star' },
  { value: 'globe', label: 'Globe' }
];

const renderCenter = (center, size) => {
  if (center === 'arrow') return <HugeiconsIcon icon={ArrowUpRight01Icon} size={size * 0.3} strokeWidth={1.6} />;
  if (center === 'star') {
    return (
      <svg width={size * 0.22} height={size * 0.22} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.6l2.83 5.95 6.53.8-4.8 4.5 1.24 6.47L12 17.13l-5.8 3.19 1.24-6.47-4.8-4.5 6.53-.8z" />
      </svg>
    );
  }
  if (center === 'globe') return <HugeiconsIcon icon={Globe02Icon} size={size * 0.22} strokeWidth={1.4} />;
  return null;
};

const propData = [
  {
    name: 'text',
    type: 'string',
    default: "''",
    description: 'The text laid out around the ring. End it with a separator for a seamless loop.'
  },
  {
    name: 'spinDuration',
    type: 'number',
    default: '20',
    description: 'Seconds for one full turn. 0 keeps the ring still until it is dragged.'
  },
  {
    name: 'onHover',
    type: "'slowDown' | 'speedUp' | 'pause' | 'goBonkers'",
    default: "'speedUp'",
    description:
      'What happens while the pointer is over the ring. It eases into the new speed and back out, and goBonkers also shrinks it a little.'
  },
  {
    name: 'direction',
    type: "'clockwise' | 'counterclockwise'",
    default: "'clockwise'",
    description: 'Which way the ring turns.'
  },
  {
    name: 'draggable',
    type: 'boolean',
    default: 'false',
    description: 'Lets people grab the ring and fling it. It coasts with inertia, then eases back to its cruise speed.'
  },
  {
    name: 'hoverTilt',
    type: 'number',
    default: '0',
    description: 'How far the ring tilts in 3D toward the pointer, in degrees. 0 turns the tilt off.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '0',
    description:
      'Leans the ring back in perspective, in degrees, so it orbits around the center content like a planet ring.'
  },
  { name: 'size', type: 'number', default: '200', description: 'Diameter of the ring, in px.' },
  { name: 'fontSize', type: 'number', default: '24', description: 'Size of the letters, in px.' },
  { name: 'fontWeight', type: 'number', default: '900', description: 'Weight of the letters.' },
  {
    name: 'letterSpacing',
    type: 'number',
    default: '0',
    description: 'Extra space between letters, in em. Applies when fill is off.'
  },
  {
    name: 'color',
    type: 'string',
    default: "''",
    description: 'Color of the letters and center content. Leave empty to follow the surrounding text color.'
  },
  {
    name: 'startAngle',
    type: 'number',
    default: '0',
    description: 'Where the first letter sits, in degrees clockwise from the top.'
  },
  {
    name: 'fill',
    type: 'boolean',
    default: 'true',
    description:
      'Spreads the letters evenly around the whole ring. Turn it off to keep natural letter spacing and leave a gap.'
  },
  {
    name: 'repeat',
    type: 'number',
    default: '1',
    description: 'How many times the text repeats around the ring. With fill off, each copy gets its own gap.'
  },
  { name: 'ring', type: 'boolean', default: 'false', description: 'Draws a thin circle just inside the letters.' },
  {
    name: 'ringColor',
    type: 'string',
    default: "''",
    description: 'Color of the inner circle. Leave empty to match the letters.'
  },
  {
    name: 'children',
    type: 'ReactNode',
    default: '-',
    description: 'Content shown in the middle of the ring, such as an icon or a short label. It tilts with the ring.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the ring.' }
];

const CircularTextDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, center, color, ringColor, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = useMemo(
    () => ({ ...(color ? { color } : {}), ...(ringColor ? { ringColor } : {}) }),
    [color, ringColor]
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'center', 'color', 'ringColor']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} overflow="hidden">
            <CircularText {...settings} color={color} ringColor={ringColor}>
              {renderCenter(center, settings.size)}
            </CircularText>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={color || ink}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Ring Color"
              color={ringColor || color || ink}
              onChange={value => updateProps({ ringColor: value, ring: true })}
            />
            <PreviewSelect
              title="On Hover"
              options={HOVER_OPTIONS}
              value={settings.onHover}
              onChange={value => updateProp('onHover', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.direction}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewSlider
              title="Spin Duration"
              min={0}
              max={60}
              step={1}
              value={settings.spinDuration}
              valueUnit="s"
              onChange={value => updateProp('spinDuration', value)}
            />
            <PreviewSwitch
              title="Draggable"
              isChecked={settings.draggable}
              onChange={value => updateProp('draggable', value)}
            />
            <PreviewSlider
              title="Hover Tilt"
              min={0}
              max={40}
              step={1}
              value={settings.hoverTilt}
              valueUnit="°"
              onChange={value => updateProp('hoverTilt', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={75}
              step={1}
              value={settings.tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewInput
              title="Text"
              value={settings.text}
              placeholder="Enter text..."
              maxLength={64}
              onChange={value => updateProp('text', value)}
            />
            <PreviewSelect
              title="Center"
              options={CENTER_OPTIONS}
              value={center}
              onChange={value => updateProp('center', value)}
            />
            <PreviewSlider
              title="Size"
              min={120}
              max={360}
              step={10}
              value={settings.size}
              valueUnit="px"
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Font Size"
              min={10}
              max={40}
              step={1}
              value={settings.fontSize}
              valueUnit="px"
              onChange={value => updateProp('fontSize', value)}
            />
            <PreviewSlider
              title="Font Weight"
              min={300}
              max={900}
              step={100}
              value={settings.fontWeight}
              onChange={value => updateProp('fontWeight', value)}
            />
            <PreviewSlider
              title="Letter Spacing"
              min={-0.05}
              max={0.3}
              step={0.01}
              value={settings.letterSpacing}
              valueUnit="em"
              isDisabled={settings.fill}
              onChange={value => updateProp('letterSpacing', value)}
            />
            <PreviewSlider
              title="Start Angle"
              min={-180}
              max={180}
              step={5}
              value={settings.startAngle}
              valueUnit="°"
              onChange={value => updateProp('startAngle', value)}
            />
            <PreviewSlider
              title="Repeat"
              min={1}
              max={5}
              step={1}
              value={settings.repeat}
              onChange={value => updateProp('repeat', value)}
            />
            <PreviewSwitch title="Fill" isChecked={settings.fill} onChange={value => updateProp('fill', value)} />
            <PreviewSwitch title="Ring" isChecked={settings.ring} onChange={value => updateProp('ring', value)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={circularText} componentName="CircularText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CircularTextDemo;
