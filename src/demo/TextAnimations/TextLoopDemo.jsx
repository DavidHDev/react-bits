import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import Dependencies from '../../components/code/Dependencies';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PropTable from '../../components/common/Preview/PropTable';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import TextLoop from '../../content/TextAnimations/TextLoop/TextLoop';
import { textLoop } from '../../constants/code/TextAnimations/textLoopCode';

const LOOK = {
  textColor: '',
  ribbonColor: '#5227FF',
  crossInk: '',
  shape: 'wave',
  speed: 90,
  scrollBoost: 0,
  draggable: false,
  curviness: 90,
  tilt: 0,
  cross: false,
  crossAngle: 16,
  ribbon: true,
  ribbonWidth: 86,
  edgeFade: 0,
  fontSize: 46,
  fontWeight: 800,
  letterSpacing: 2,
  uppercase: true,
  outline: false,
  outlineWidth: 1.5
};

const PRESETS = {
  ribbon: { ...LOOK },
  tape: {
    ...LOOK,
    textColor: '#120f17',
    ribbonColor: '#ff5a36',
    shape: 'line',
    speed: 120,
    draggable: true,
    cross: true,
    crossAngle: 14,
    ribbonWidth: 76,
    fontSize: 40,
    letterSpacing: 1
  },
  orbit: {
    ...LOOK,
    shape: 'circle',
    speed: 60,
    draggable: true,
    curviness: 120,
    cross: true,
    crossAngle: 30,
    ribbon: false,
    fontSize: 32,
    fontWeight: 600,
    letterSpacing: 1,
    uppercase: false
  },
  drift: {
    ...LOOK,
    speed: 70,
    scrollBoost: 1.5,
    curviness: 130,
    ribbon: false,
    edgeFade: 0.8,
    fontSize: 64,
    fontWeight: 700,
    letterSpacing: -1,
    uppercase: false,
    outline: true,
    outlineWidth: 1.5
  }
};

const PRESET_OPTIONS = [
  { value: 'ribbon', label: 'Ribbon' },
  { value: 'tape', label: 'Tape' },
  { value: 'orbit', label: 'Orbit' },
  { value: 'drift', label: 'Drift' }
];

const DEFAULT_PROPS = {
  preset: 'ribbon',
  text: 'React ✦ Bits',
  separator: '✦',
  direction: 'forward',
  ...LOOK,
  pauseOnHover: true
};

const SHAPE_OPTIONS = [
  { value: 'wave', label: 'Wave' },
  { value: 'circle', label: 'Circle' },
  { value: 'infinity', label: 'Infinity' },
  { value: 'arch', label: 'Arch' },
  { value: 'line', label: 'Line' }
];

const DIRECTION_OPTIONS = [
  { value: 'forward', label: 'Forward' },
  { value: 'reverse', label: 'Reverse' }
];

const tint = (color, amount) => {
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(String(color || '').trim());
  if (!match) return color;
  const hex = match[1].length === 3 ? match[1].replace(/./g, ch => ch + ch) : match[1];
  return `#${[0, 2, 4]
    .map(i => parseInt(hex.slice(i, i + 2), 16))
    .map(v =>
      Math.round(v + (255 - v) * amount)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
};

const propData = [
  { name: 'text', type: 'string', default: '"React ✦ Bits"', description: 'The phrase repeated along the curve.' },
  {
    name: 'shape',
    type: '"wave" | "circle" | "infinity" | "arch" | "line"',
    default: '"wave"',
    description: 'Built-in curve the text flows along.'
  },
  {
    name: 'path',
    type: 'string',
    default: 'undefined',
    description: 'Custom SVG path data, drawn in a 1200x520 viewBox. Overrides shape when provided.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '90',
    description: 'Travel speed along the path, in units per second.'
  },
  {
    name: 'direction',
    type: '"forward" | "reverse"',
    default: '"forward"',
    description: 'Direction the text scrolls around the curve.'
  },
  { name: 'separator', type: 'string', default: '"✦"', description: 'Glyph placed between each repetition.' },
  {
    name: 'curviness',
    type: 'number',
    default: '90',
    description: 'Amplitude of the wave, or the radius of the closed shapes.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '0',
    description: 'Rotates the whole loop, in degrees. A slight tilt on a line turns it into a slanted banner.'
  },
  {
    name: 'cross',
    type: 'boolean',
    default: 'false',
    description:
      'Adds a second band crossing the first in an X and running the other way, with a soft shadow where the top band passes over it. Waves weave into a braid, arches into a lens and circles gain a tilted orbit.'
  },
  {
    name: 'crossColor',
    type: 'string',
    default: '-',
    description:
      'Color of the crossing band. Defaults to a pale tint of ribbonColor, and its text picks black or white for contrast. Without a ribbon it colors the crossing text, which is dimmed by default.'
  },
  {
    name: 'crossAngle',
    type: 'number',
    default: '16',
    description: 'Angle between the two bands, in degrees. The pair stays centered on tilt.'
  },
  {
    name: 'draggable',
    type: 'boolean',
    default: 'false',
    description:
      'Drag the loop to scrub it, or spin it on a circle. A throw keeps its momentum, then eases back to the normal speed.'
  },
  {
    name: 'scrollBoost',
    type: 'number',
    default: '0',
    description:
      'How strongly page scrolling pushes the loop. Scrolling down speeds it up, scrolling up slows or reverses it, and it eases back once scrolling stops. 0 turns it off.'
  },
  { name: 'fontSize', type: 'number', default: '46', description: 'Font size of the looping text.' },
  { name: 'fontWeight', type: 'number', default: '800', description: 'Font weight of the looping text.' },
  { name: 'letterSpacing', type: 'number', default: '2', description: 'Extra tracking between letters.' },
  { name: 'uppercase', type: 'boolean', default: 'true', description: 'Renders the phrase in uppercase.' },
  {
    name: 'outline',
    type: 'boolean',
    default: 'false',
    description: 'Draws the letters as outlines instead of solid fills.'
  },
  { name: 'outlineWidth', type: 'number', default: '1.5', description: 'Stroke width of the outlined letters.' },
  {
    name: 'color',
    type: 'string',
    default: '-',
    description: 'Fill color of the text. Defaults to white on the ribbon and to the surrounding text color without it.'
  },
  {
    name: 'ribbon',
    type: 'boolean',
    default: 'true',
    description: 'Draws a solid band behind the text along the path.'
  },
  { name: 'ribbonColor', type: 'string', default: '"#5227FF"', description: 'Color of the band behind the text.' },
  { name: 'ribbonWidth', type: 'number', default: '86', description: 'Thickness of the band behind the text.' },
  {
    name: 'edgeFade',
    type: 'number',
    default: '0',
    description: 'Fades the loop out toward the left and right edges, from 0 (hard edges) to 1 (wide, soft fade).'
  },
  {
    name: 'pauseOnHover',
    type: 'boolean',
    default: 'true',
    description: 'Eases the loop to a stop while the pointer is over it, and back up to speed when it leaves.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Additional CSS classes for the wrapper.' },
  { name: 'style', type: 'object', default: '{}', description: 'Inline styles for the wrapper.' }
];

const TextLoopDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, textColor, crossInk, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = useMemo(
    () => ({
      ...(textColor ? { color: textColor } : {}),
      ...(crossInk ? { crossColor: crossInk } : {})
    }),
    [textColor, crossInk]
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'textColor', 'crossInk']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            className="demo-container"
            p={0}
            minH={430}
            overflow="hidden"
            position="relative"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <TextLoop {...settings} color={textColor || undefined} crossColor={crossInk || undefined} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />

            <PreviewInput
              title="Text"
              value={settings.text}
              placeholder="Your phrase"
              maxLength={30}
              onChange={value => updateProp('text', value)}
            />

            <PreviewInput
              title="Separator"
              value={settings.separator}
              placeholder="✦"
              width={90}
              maxLength={3}
              onChange={value => updateProp('separator', value)}
            />

            <PreviewColorPickerCustom
              title="Text Color"
              color={textColor || (settings.ribbon ? '#ffffff' : ink)}
              onChange={value => updateProp('textColor', value)}
            />
            <PreviewColorPickerCustom
              title="Ribbon Color"
              color={settings.ribbonColor}
              onChange={value => updateProp('ribbonColor', value)}
            />
            <PreviewColorPickerCustom
              title="Cross Color"
              color={crossInk || (settings.ribbon ? tint(settings.ribbonColor, 0.62) : textColor || ink)}
              onChange={value => updateProp('crossInk', value)}
            />

            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings.shape}
              onChange={value => updateProp('shape', value)}
            />

            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.direction}
              onChange={value => updateProp('direction', value)}
            />

            <PreviewSlider
              title="Speed"
              min={10}
              max={260}
              step={5}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />

            <PreviewSlider
              title="Scroll Boost"
              min={0}
              max={3}
              step={0.1}
              value={settings.scrollBoost}
              onChange={value => updateProp('scrollBoost', value)}
            />

            <PreviewSwitch
              title="Draggable"
              isChecked={settings.draggable}
              onChange={value => updateProp('draggable', value)}
            />
            <PreviewSwitch
              title="Pause On Hover"
              isChecked={settings.pauseOnHover}
              onChange={value => updateProp('pauseOnHover', value)}
            />

            <PreviewSlider
              title="Curviness"
              min={0}
              max={160}
              step={2}
              value={settings.curviness}
              onChange={value => updateProp('curviness', value)}
            />

            <PreviewSlider
              title="Tilt"
              min={-20}
              max={20}
              step={1}
              value={settings.tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />

            <PreviewSwitch title="Cross" isChecked={settings.cross} onChange={value => updateProp('cross', value)} />

            <PreviewSlider
              title="Cross Angle"
              min={0}
              max={40}
              step={1}
              value={settings.crossAngle}
              valueUnit="°"
              isDisabled={!settings.cross}
              onChange={value => updateProp('crossAngle', value)}
            />

            <PreviewSwitch title="Ribbon" isChecked={settings.ribbon} onChange={value => updateProp('ribbon', value)} />

            <PreviewSlider
              title="Ribbon Width"
              min={0}
              max={160}
              step={2}
              value={settings.ribbonWidth}
              valueUnit="px"
              isDisabled={!settings.ribbon}
              onChange={value => updateProp('ribbonWidth', value)}
            />

            <PreviewSlider
              title="Edge Fade"
              min={0}
              max={1}
              step={0.05}
              value={settings.edgeFade}
              onChange={value => updateProp('edgeFade', value)}
            />

            <PreviewSlider
              title="Font Size"
              min={18}
              max={90}
              step={2}
              value={settings.fontSize}
              valueUnit="px"
              onChange={value => updateProp('fontSize', value)}
            />

            <PreviewSlider
              title="Font Weight"
              min={300}
              max={900}
              step={50}
              value={settings.fontWeight}
              onChange={value => updateProp('fontWeight', value)}
            />

            <PreviewSlider
              title="Letter Spacing"
              min={-2}
              max={14}
              step={0.5}
              value={settings.letterSpacing}
              valueUnit="px"
              onChange={value => updateProp('letterSpacing', value)}
            />

            <PreviewSwitch
              title="Uppercase"
              isChecked={settings.uppercase}
              onChange={value => updateProp('uppercase', value)}
            />

            <PreviewSwitch
              title="Outline"
              isChecked={settings.outline}
              onChange={value => updateProp('outline', value)}
            />

            <PreviewSlider
              title="Outline Width"
              min={0.5}
              max={4}
              step={0.1}
              value={settings.outlineWidth}
              valueUnit="px"
              isDisabled={!settings.outline}
              onChange={value => updateProp('outlineWidth', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={textLoop} componentName="TextLoop" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default TextLoopDemo;
