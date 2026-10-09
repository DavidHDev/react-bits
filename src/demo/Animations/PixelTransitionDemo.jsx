import { useMemo } from 'react';
import { Flex } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PropTable from '../../components/common/Preview/PropTable';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import PixelTransition from '../../content/Animations/PixelTransition/PixelTransition';
import { pixelTransition } from '../../constants/code/Animations/pixelTransitionCode';

const DAY = '/assets/demo/day-portrait.webp';
const NIGHT = '/assets/demo/night-portrait.webp';

const DEFAULT_PROPS = {
  preset: 'classic',
  pixelColor: '',
  mosaic: 0,
  gridSize: 10,
  pixelShape: 'square',
  gap: 0,
  pattern: 'random',
  pixelAnimation: 'pop',
  randomness: 0.3,
  animationStepDuration: 0.4,
  fps: 0,
  trigger: 'hover',
  once: false
};

const PRESETS = {
  classic: {},
  dither: { pattern: 'dither', gridSize: 20, fps: 15 },
  ripple: { pattern: 'ripple', pixelAnimation: 'grow', pixelShape: 'circle', gridSize: 16, gap: 2, randomness: 0.2 },
  wipe: { pattern: 'wipe', pixelAnimation: 'grow', pixelShape: 'rounded', gridSize: 12, gap: 3, randomness: 0.3 },
  mosaic: { pixelColor: '#1c1b20', mosaic: 0.5, gridSize: 24, pixelAnimation: 'fade', animationStepDuration: 0.5 }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'dither', label: 'Dither' },
  { value: 'ripple', label: 'Ripple' },
  { value: 'wipe', label: 'Wipe' },
  { value: 'mosaic', label: 'Mosaic' }
];

const PATTERN_OPTIONS = [
  { value: 'random', label: 'Random' },
  { value: 'dither', label: 'Dither' },
  { value: 'ripple', label: 'Ripple' },
  { value: 'wipe', label: 'Wipe' }
];

const ANIMATION_OPTIONS = [
  { value: 'pop', label: 'Pop' },
  { value: 'grow', label: 'Grow' },
  { value: 'fade', label: 'Fade' }
];

const SHAPE_OPTIONS = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' }
];

const TRIGGER_OPTIONS = [
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' }
];

const propData = [
  { name: 'firstContent', type: 'ReactNode', default: '-', description: 'Content shown by default.' },
  { name: 'secondContent', type: 'ReactNode', default: '-', description: 'Content revealed by the transition.' },
  {
    name: 'gridSize',
    type: 'number',
    default: '10',
    description: 'Number of pixels across the card. Rows follow so every pixel stays square.'
  },
  {
    name: 'pixelColor',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color of the pixels. Any CSS color works.'
  },
  {
    name: 'mosaic',
    type: 'number',
    default: '0',
    description: 'Gives each pixel a slightly different tone of the pixel color, from 0 to 1.'
  },
  {
    name: 'animationStepDuration',
    type: 'number',
    default: '0.4',
    description: 'Seconds the pixels take to cover the card, and again to clear it.'
  },
  {
    name: 'pattern',
    type: "'random' | 'dither' | 'ripple' | 'wipe'",
    default: "'random'",
    description:
      'Order the pixels appear in. Ripple spreads from the pointer and wipe sweeps in from the edge it crossed.'
  },
  {
    name: 'randomness',
    type: 'number',
    default: '0.3',
    description: 'Breaks up the ripple and wipe fronts, from 0 to 1.'
  },
  {
    name: 'pixelAnimation',
    type: "'pop' | 'grow' | 'fade'",
    default: "'pop'",
    description: 'How each pixel appears and disappears.'
  },
  {
    name: 'pixelShape',
    type: "'square' | 'rounded' | 'circle'",
    default: "'square'",
    description: 'Shape of the pixels while the transition runs. They merge into a solid cover at the midpoint.'
  },
  { name: 'gap', type: 'number', default: '0', description: 'Space between pixels in pixels.' },
  {
    name: 'fps',
    type: 'number',
    default: '0',
    description: 'Caps how often the pixels redraw for a choppy retro feel. 0 redraws every frame.'
  },
  { name: 'trigger', type: "'hover' | 'click'", default: "'hover'", description: 'What starts the transition.' },
  {
    name: 'active',
    type: 'boolean',
    default: '-',
    description: 'Controls the state from outside. Pair it with onActiveChange.'
  },
  {
    name: 'once',
    type: 'boolean',
    default: 'false',
    description: 'Keeps the second content once it has been revealed.'
  },
  {
    name: 'onActiveChange',
    type: '(active: boolean) => void',
    default: '-',
    description: 'Called when hover, focus or a click asks for the other content.'
  },
  {
    name: 'aspectRatio',
    type: 'string',
    default: "'100%'",
    description:
      "Height of the card. Percentages work like padding-top ('125%'), anything else is a CSS ratio ('4 / 5')."
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the card.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the card.' }
];

const Photo = ({ src }) => (
  <img
    src={src}
    alt=""
    draggable={false}
    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
  />
);

const PixelTransitionDemo = () => {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;
  const ink = useColorModeValue('#120f17', '#ffffff');
  const [first, second] = useColorModeValue([DAY, NIGHT], [NIGHT, DAY]);
  const pixelColor = props.pixelColor || ink;
  const computedProps = useMemo(() => ({ pixelColor }), [pixelColor]);

  const applyPreset = value => {
    updateProps({ ...DEFAULT_PROPS, ...PRESETS[value], preset: value });
  };

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
          <Flex
            position="relative"
            className="demo-container"
            h={480}
            align="center"
            justify="center"
            overflow="hidden"
          >
            <PixelTransition
              {...settings}
              pixelColor={pixelColor}
              firstContent={<Photo src={first} />}
              secondContent={<Photo src={second} />}
              aspectRatio="125%"
              style={{ width: 300 }}
            />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} width={140} />
            <PreviewColorPickerCustom
              title="Pixel Color"
              color={pixelColor}
              onChange={value => updateProp('pixelColor', value)}
            />
            <PreviewSlider
              title="Mosaic"
              min={0}
              max={1}
              step={0.05}
              value={props.mosaic}
              onChange={value => updateProp('mosaic', value)}
            />
            <PreviewSlider
              title="Grid Size"
              min={4}
              max={40}
              step={1}
              value={props.gridSize}
              onChange={value => updateProp('gridSize', value)}
            />
            <PreviewSelect
              title="Pixel Shape"
              options={SHAPE_OPTIONS}
              value={props.pixelShape}
              onChange={value => updateProp('pixelShape', value)}
              width={140}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={8}
              step={1}
              value={props.gap}
              valueUnit="px"
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSelect
              title="Pattern"
              options={PATTERN_OPTIONS}
              value={props.pattern}
              onChange={value => updateProp('pattern', value)}
              width={140}
            />
            <PreviewSelect
              title="Pixel Animation"
              options={ANIMATION_OPTIONS}
              value={props.pixelAnimation}
              onChange={value => updateProp('pixelAnimation', value)}
              width={140}
            />
            <PreviewSlider
              title="Randomness"
              min={0}
              max={1}
              step={0.05}
              value={props.randomness}
              onChange={value => updateProp('randomness', value)}
            />
            <PreviewSlider
              title="Duration"
              min={0.1}
              max={1.5}
              step={0.05}
              value={props.animationStepDuration}
              valueUnit="s"
              onChange={value => updateProp('animationStepDuration', value)}
            />
            <PreviewSlider
              title="Frame Rate"
              min={0}
              max={30}
              step={1}
              value={props.fps}
              onChange={value => updateProp('fps', value)}
            />
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={props.trigger}
              onChange={value => updateProp('trigger', value)}
              width={140}
            />
            <PreviewSwitch title="Once" isChecked={props.once} onChange={value => updateProp('once', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={pixelTransition} componentName="PixelTransition" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PixelTransitionDemo;
