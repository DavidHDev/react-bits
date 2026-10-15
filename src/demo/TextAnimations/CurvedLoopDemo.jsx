import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import { curvedLoop } from '../../constants/code/TextAnimations/curvedLoopCode';
import CurvedLoop from '../../content/TextAnimations/CurvedLoop/CurvedLoop';

const LOOK = {
  marqueeText: 'Be ✦ Creative ✦ With ✦ React ✦ Bits ✦',
  shape: 'arc',
  separator: '',
  separatorColor: '',
  direction: 'left',
  speed: 2,
  scrollBoost: 0,
  curveAmount: 400,
  fontSize: 96,
  fontWeight: 700,
  letterSpacing: 0,
  edgeFade: 0,
  outline: false
};

const PRESETS = {
  arc: { ...LOOK },
  wave: {
    ...LOOK,
    marqueeText: 'Ride the wave',
    shape: 'wave',
    separator: '—',
    direction: 'right',
    speed: 1.5,
    curveAmount: 360,
    fontSize: 84,
    fontWeight: 500,
    edgeFade: 0.3
  },
  circle: {
    ...LOOK,
    marqueeText: 'Around and around',
    shape: 'circle',
    separator: '•',
    direction: 'right',
    speed: 1.2,
    fontSize: 80,
    fontWeight: 800
  },
  outline: {
    ...LOOK,
    marqueeText: 'Scroll faster',
    shape: 'line',
    separator: '/',
    separatorColor: '#ff5a1f',
    speed: 1,
    scrollBoost: 2,
    fontSize: 136,
    fontWeight: 800,
    letterSpacing: -2,
    edgeFade: 0.4,
    outline: true
  }
};

const DEFAULT_PROPS = {
  preset: 'arc',
  ...LOOK,
  color: '',
  interactive: true,
  pauseOnHover: false
};

const PRESET_OPTIONS = [
  { value: 'arc', label: 'Arc' },
  { value: 'wave', label: 'Wave' },
  { value: 'circle', label: 'Circle' },
  { value: 'outline', label: 'Outline' }
];

const SHAPE_OPTIONS = [
  { value: 'arc', label: 'Arc' },
  { value: 'wave', label: 'Wave' },
  { value: 'circle', label: 'Circle' },
  { value: 'line', label: 'Line' }
];

const SEPARATOR_OPTIONS = [
  { value: '', label: 'None' },
  { value: '✦', label: 'Star' },
  { value: '•', label: 'Dot' },
  { value: '/', label: 'Slash' },
  { value: '—', label: 'Dash' }
];

const DIRECTION_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const propData = [
  {
    name: 'marqueeText',
    type: 'string',
    default: "''",
    description: 'The text that loops along the path. Repeats are joined with a space.'
  },
  {
    name: 'shape',
    type: "'arc' | 'wave' | 'circle' | 'line'",
    default: "'arc'",
    description:
      'The path the text travels on. Circle closes the loop into a ring that always fits a whole number of repeats.'
  },
  {
    name: 'color',
    type: 'string',
    default: "'currentColor'",
    description:
      'Color of the text, or of its outline when outline is on. Follows the surrounding text color by default.'
  },
  {
    name: 'separator',
    type: 'string',
    default: "''",
    description: 'A mark placed between repeats, such as ✦ or /. Leave empty to join repeats with a space.'
  },
  {
    name: 'separatorColor',
    type: 'string',
    default: '-',
    description: 'Paints the separator in its own solid color. Matches the text when left unset.'
  },
  {
    name: 'direction',
    type: "'left' | 'right'",
    default: "'left'",
    description:
      'Which way the text travels. On a circle, right turns clockwise. A drag flips it to the way it was thrown.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '2',
    description: 'How fast the text travels along the path. 0 keeps it still until dragged or scrolled.'
  },
  {
    name: 'scrollBoost',
    type: 'number',
    default: '0',
    description: 'How much page scrolling speeds the loop up for a moment before it eases back. 0 turns it off.'
  },
  {
    name: 'curveAmount',
    type: 'number',
    default: '400',
    description:
      'How far the path bends. On the arc it is the dip at the middle (negative arches up), on the wave it sets the wave height.'
  },
  {
    name: 'fontSize',
    type: 'number',
    default: '96',
    description: 'Letter size in px for a 1440px wide loop. The whole loop scales with its container.'
  },
  {
    name: 'fontWeight',
    type: 'number | string',
    default: '700',
    description: 'Weight of the letters.'
  },
  {
    name: 'letterSpacing',
    type: 'number',
    default: '0',
    description: 'Extra space between letters in px, measured like fontSize.'
  },
  {
    name: 'edgeFade',
    type: 'number',
    default: '0',
    description: 'How much of each side fades out, from 0 to 1. At 1 only the middle stays fully visible.'
  },
  {
    name: 'outline',
    type: 'boolean',
    default: 'false',
    description: 'Draws the letters as outlines instead of solid text.'
  },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description:
      'Lets people drag the text and fling it. Rings follow the pointer around. It glides back to its normal speed afterwards.'
  },
  {
    name: 'pauseOnHover',
    type: 'boolean',
    default: 'false',
    description: 'Eases the text to a stop while the pointer is over it.'
  },
  {
    name: 'className',
    type: 'string',
    default: '-',
    description: 'Extra class names for the text, for example to change its font.'
  }
];

const CurvedLoopDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, color, separatorColor, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');
  const bends = settings.shape === 'arc' || settings.shape === 'wave';

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = useMemo(
    () => ({ color: color || undefined, separatorColor: separatorColor || undefined }),
    [color, separatorColor]
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
          <Box position="relative" className="demo-container" h={400} overflow="hidden" p={0}>
            <CurvedLoop {...settings} color={color || 'currentColor'} separatorColor={separatorColor || undefined} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewInput
              title="Marquee Text"
              value={settings.marqueeText}
              placeholder="Enter text..."
              maxLength={80}
              onChange={value => updateProp('marqueeText', value)}
            />
            <PreviewColorPickerCustom
              title="Color"
              color={color || ink}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Separator Color"
              color={separatorColor || color || ink}
              onChange={value => updateProp('separatorColor', value)}
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
              max={10}
              step={0.1}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Scroll Boost"
              min={0}
              max={4}
              step={0.1}
              value={settings.scrollBoost}
              onChange={value => updateProp('scrollBoost', value)}
            />
            <PreviewSwitch
              title="Draggable"
              isChecked={settings.interactive}
              onChange={value => updateProp('interactive', value)}
            />
            <PreviewSwitch
              title="Pause On Hover"
              isChecked={settings.pauseOnHover}
              onChange={value => updateProp('pauseOnHover', value)}
            />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings.shape}
              onChange={value => updateProp('shape', value)}
            />
            <PreviewSelect
              title="Separator"
              options={SEPARATOR_OPTIONS}
              value={settings.separator}
              onChange={value => updateProp('separator', value)}
            />
            <PreviewSlider
              title="Curve Amount"
              min={-400}
              max={400}
              step={10}
              value={settings.curveAmount}
              valueUnit="px"
              isDisabled={!bends}
              onChange={value => updateProp('curveAmount', value)}
            />
            <PreviewSlider
              title="Font Size"
              min={48}
              max={160}
              step={2}
              value={settings.fontSize}
              valueUnit="px"
              onChange={value => updateProp('fontSize', value)}
            />
            <PreviewSlider
              title="Font Weight"
              min={200}
              max={800}
              step={100}
              value={settings.fontWeight}
              onChange={value => updateProp('fontWeight', value)}
            />
            <PreviewSlider
              title="Letter Spacing"
              min={-6}
              max={16}
              step={1}
              value={settings.letterSpacing}
              valueUnit="px"
              onChange={value => updateProp('letterSpacing', value)}
            />
            <PreviewSlider
              title="Edge Fade"
              min={0}
              max={1}
              step={0.05}
              value={settings.edgeFade}
              onChange={value => updateProp('edgeFade', value)}
            />
            <PreviewSwitch
              title="Outline"
              isChecked={settings.outline}
              onChange={value => updateProp('outline', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={curvedLoop} componentName="CurvedLoop" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default CurvedLoopDemo;
