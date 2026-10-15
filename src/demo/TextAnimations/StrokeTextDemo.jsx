import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import CodeExample from '../../components/code/CodeExample';
import Dependencies from '../../components/code/Dependencies';
import PropTable from '../../components/common/Preview/PropTable';

import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import StrokeText from '../../content/TextAnimations/StrokeText/StrokeText';
import { strokeText } from '../../constants/code/TextAnimations/strokeTextCode';

const SERIF = 'Georgia, serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const LOOK = {
  strokeColor: '#A78BFA',
  shadowColor: '',
  fillMode: 'wipe',
  wipeFrom: 'left',
  ease: 'power2.out',
  fontFamily: 'inherit',
  strokeStyle: 'solid',
  strokeWidth: 1.4,
  dashLength: 10,
  drawDuration: 1.6,
  fillDelay: 0.2,
  stagger: 0.05,
  fontSize: 128,
  fontWeight: 800,
  letterSpacing: -4,
  reverse: false,
  hoverRedraw: true,
  marching: false,
  shadow: false
};

const PRESETS = {
  draw: { ...LOOK },
  dashed: {
    ...LOOK,
    strokeColor: '#ffffff',
    fillMode: 'none',
    ease: 'sine.inOut',
    strokeStyle: 'dashed',
    strokeWidth: 2.5,
    dashLength: 16,
    drawDuration: 2.2,
    stagger: 0.06,
    letterSpacing: -2,
    hoverRedraw: false,
    marching: true
  },
  dotted: {
    ...LOOK,
    strokeColor: '#f59e0b',
    fillMode: 'fade',
    ease: 'power3.out',
    fontFamily: SERIF,
    strokeStyle: 'dotted',
    strokeWidth: 5,
    dashLength: 11,
    drawDuration: 2.4,
    fillDelay: 0.1,
    stagger: 0.08,
    fontSize: 136,
    fontWeight: 700,
    letterSpacing: 0,
    marching: true
  },
  shadow: {
    ...LOOK,
    strokeColor: '#38bdf8',
    wipeFrom: 'bottom',
    ease: 'expo.out',
    strokeWidth: 2,
    drawDuration: 1.2,
    fillDelay: 0.05,
    stagger: 0.03,
    letterSpacing: -3,
    shadow: true
  }
};

const DEFAULT_PROPS = {
  preset: 'draw',
  text: 'Draw Attention',
  fillColor: '',
  ...LOOK,
  trigger: 'mount'
};

const PRESET_OPTIONS = [
  { value: 'draw', label: 'Draw' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'shadow', label: 'Shadow' }
];

const STROKE_STYLE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' }
];

const TRIGGER_OPTIONS = [
  { value: 'mount', label: 'Mount' },
  { value: 'hover', label: 'Hover' },
  { value: 'scroll', label: 'Scroll' },
  { value: 'loop', label: 'Loop' }
];

const FILL_MODE_OPTIONS = [
  { value: 'wipe', label: 'Wipe' },
  { value: 'fade', label: 'Fade' },
  { value: 'none', label: 'None' }
];

const WIPE_FROM_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' }
];

const EASE_OPTIONS = [
  { value: 'power2.out', label: 'Power Out' },
  { value: 'power3.out', label: 'Crisp Out' },
  { value: 'expo.out', label: 'Expo Out' },
  { value: 'sine.inOut', label: 'Sine In Out' }
];

const FONT_OPTIONS = [
  { value: 'inherit', label: 'System' },
  { value: SERIF, label: 'Serif' },
  { value: MONO, label: 'Mono' }
];

const propData = [
  {
    name: 'text',
    type: 'string',
    default: '"Draw Attention"',
    description: 'The heading copy rendered as measured SVG glyphs.'
  },
  {
    name: 'strokeColor',
    type: 'string',
    default: '"#A78BFA"',
    description: 'Color used for the drawing outline.'
  },
  {
    name: 'fillColor',
    type: 'string',
    default: '"currentColor"',
    description:
      'Color that floods into the glyphs after the outline draw. Follows the surrounding text color by default.'
  },
  {
    name: 'strokeWidth',
    type: 'number',
    default: '1.4',
    description: 'Width of the SVG text outline.'
  },
  {
    name: 'drawDuration',
    type: 'number',
    default: '1.6',
    description: 'Seconds each character outline spends drawing on.'
  },
  {
    name: 'fillDelay',
    type: 'number',
    default: '0.2',
    description: 'Seconds to wait after the outline draw before the fill begins.'
  },
  {
    name: 'stagger',
    type: 'number',
    default: '0.05',
    description: 'Delay in seconds between each character animation.'
  },
  {
    name: 'ease',
    type: 'string',
    default: '"power2.out"',
    description: 'GSAP easing used for the outline draw.'
  },
  {
    name: 'trigger',
    type: '"mount" | "hover" | "scroll" | "loop"',
    default: '"mount"',
    description: 'Chooses when the draw timeline starts. Loop draws on, then plays back out before drawing again.'
  },
  {
    name: 'fillMode',
    type: '"fade" | "wipe" | "none"',
    default: '"wipe"',
    description: 'Controls whether fill appears with a fade, a directional wipe, or not at all.'
  },
  {
    name: 'wipeFrom',
    type: '"left" | "right" | "top" | "bottom"',
    default: '"left"',
    description: 'Side the wipe fill sweeps in from. Bottom fills the letters like liquid rising.'
  },
  {
    name: 'fontSize',
    type: 'number',
    default: '128',
    description: 'Largest font size in px. The wordmark scales down to fit narrower containers.'
  },
  {
    name: 'fontWeight',
    type: 'number | string',
    default: '800',
    description: 'Weight of the rendered letterforms.'
  },
  {
    name: 'fontFamily',
    type: 'string',
    default: '"inherit"',
    description: 'Font family of the letterforms. Inherits the surrounding font by default.'
  },
  {
    name: 'letterSpacing',
    type: 'number',
    default: '-4',
    description: 'Tracking in px applied during measurement and rendering.'
  },
  {
    name: 'reverse',
    type: 'boolean',
    default: 'false',
    description: 'Draws the stagger from the final character back to the first.'
  },
  {
    name: 'strokeStyle',
    type: '"solid" | "dashed" | "dotted"',
    default: '"solid"',
    description: 'Line style of the outline. Dashed and dotted outlines still draw on along each letter.'
  },
  {
    name: 'dashLength',
    type: 'number',
    default: '10',
    description: 'Length of each dash in px, or the distance between dots for a dotted outline.'
  },
  {
    name: 'marching',
    type: 'boolean',
    default: 'false',
    description: 'Keeps dashes or dots flowing around the letters once they are drawn.'
  },
  {
    name: 'hoverRedraw',
    type: 'boolean',
    default: 'false',
    description: 'Fades the outline out and draws it again whenever the pointer enters, after the first draw.'
  },
  {
    name: 'shadow',
    type: 'boolean',
    default: 'false',
    description: 'Adds a soft offset shadow under the filled letters that lifts into place as the fill lands.'
  },
  {
    name: 'shadowColor',
    type: 'string',
    default: '-',
    description: 'Color of the shadow. Uses the stroke color when left unset.'
  },
  {
    name: 'className',
    type: 'string',
    default: '""',
    description: 'Optional class applied to the root wrapper.'
  },
  {
    name: 'style',
    type: 'CSSProperties',
    default: '{}',
    description: 'Inline styles passed to the root wrapper.'
  }
];

const StrokeTextDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, fillColor, shadowColor, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');
  const renderedStrokeColor = useColorModeValue(
    settings.strokeColor === '#ffffff' ? '#18181b' : settings.strokeColor,
    settings.strokeColor
  );

  const updateAndReplay = (name, value) => {
    updateProp(name, value);
    forceRerender();
  };

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const computedProps = useMemo(
    () => ({
      strokeColor: renderedStrokeColor,
      fillColor: fillColor || undefined,
      shadowColor: shadowColor || undefined
    }),
    [renderedStrokeColor, fillColor, shadowColor]
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
          <Box position="relative" className="demo-container" minH={430} overflow="hidden" p={{ base: 8, md: 14 }}>
            <RefreshButton onClick={forceRerender} />
            <Box position="relative" w="100%" textAlign="center">
              <StrokeText
                key={`${preset}-${key}`}
                {...settings}
                strokeColor={renderedStrokeColor}
                fillColor={fillColor || 'currentColor'}
                shadowColor={shadowColor || undefined}
              />
            </Box>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewInput
              title="Text"
              value={settings.text}
              placeholder="Your headline"
              maxLength={22}
              onChange={value => updateAndReplay('text', value)}
            />
            <PreviewColorPickerCustom
              title="Stroke"
              color={renderedStrokeColor}
              onChange={value => updateAndReplay('strokeColor', value)}
            />
            <PreviewColorPickerCustom
              title="Fill"
              color={fillColor || ink}
              onChange={value => updateAndReplay('fillColor', value)}
            />
            <PreviewColorPickerCustom
              title="Shadow"
              color={shadowColor || renderedStrokeColor}
              onChange={value => updateAndReplay('shadowColor', value)}
            />
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={settings.trigger}
              onChange={value => updateAndReplay('trigger', value)}
            />
            <PreviewSelect
              title="Fill Mode"
              options={FILL_MODE_OPTIONS}
              value={settings.fillMode}
              onChange={value => updateAndReplay('fillMode', value)}
            />
            <PreviewSelect
              title="Wipe From"
              options={WIPE_FROM_OPTIONS}
              value={settings.wipeFrom}
              isDisabled={settings.fillMode !== 'wipe'}
              onChange={value => updateAndReplay('wipeFrom', value)}
            />
            <PreviewSelect
              title="Ease"
              options={EASE_OPTIONS}
              value={settings.ease}
              onChange={value => updateAndReplay('ease', value)}
            />
            <PreviewSlider
              title="Draw Duration"
              min={0.6}
              max={3}
              step={0.1}
              value={settings.drawDuration}
              valueUnit="s"
              onChange={value => updateAndReplay('drawDuration', value)}
            />
            <PreviewSlider
              title="Fill Delay"
              min={0}
              max={1}
              step={0.05}
              value={settings.fillDelay}
              valueUnit="s"
              onChange={value => updateAndReplay('fillDelay', value)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.12}
              step={0.005}
              value={settings.stagger}
              valueUnit="s"
              onChange={value => updateAndReplay('stagger', value)}
            />
            <PreviewSwitch
              title="Reverse Stagger"
              isChecked={settings.reverse}
              onChange={checked => updateAndReplay('reverse', checked)}
            />
            <PreviewSwitch
              title="Hover Redraw"
              isChecked={settings.hoverRedraw}
              isDisabled={settings.trigger === 'hover' || settings.trigger === 'loop'}
              onChange={checked => updateAndReplay('hoverRedraw', checked)}
            />
            <PreviewSwitch
              title="Marching"
              isChecked={settings.marching}
              isDisabled={settings.strokeStyle === 'solid'}
              onChange={checked => updateAndReplay('marching', checked)}
            />
            <PreviewSelect
              title="Stroke Style"
              options={STROKE_STYLE_OPTIONS}
              value={settings.strokeStyle}
              onChange={value => updateAndReplay('strokeStyle', value)}
            />
            <PreviewSlider
              title="Stroke Width"
              min={0.5}
              max={6}
              step={0.1}
              value={settings.strokeWidth}
              onChange={value => updateAndReplay('strokeWidth', value)}
            />
            <PreviewSlider
              title="Dash Length"
              min={2}
              max={40}
              step={1}
              value={settings.dashLength}
              valueUnit="px"
              isDisabled={settings.strokeStyle === 'solid'}
              onChange={value => updateAndReplay('dashLength', value)}
            />
            <PreviewSelect
              title="Font"
              options={FONT_OPTIONS}
              value={settings.fontFamily}
              onChange={value => updateAndReplay('fontFamily', value)}
            />
            <PreviewSlider
              title="Font Size"
              min={72}
              max={170}
              step={2}
              value={settings.fontSize}
              valueUnit="px"
              onChange={value => updateAndReplay('fontSize', value)}
            />
            <PreviewSlider
              title="Font Weight"
              min={300}
              max={900}
              step={50}
              value={settings.fontWeight}
              onChange={value => updateAndReplay('fontWeight', value)}
            />
            <PreviewSlider
              title="Letter Spacing"
              min={-10}
              max={8}
              step={0.5}
              value={settings.letterSpacing}
              valueUnit="px"
              onChange={value => updateAndReplay('letterSpacing', value)}
            />
            <PreviewSwitch
              title="Shadow"
              isChecked={settings.shadow}
              isDisabled={settings.fillMode === 'none'}
              onChange={checked => updateAndReplay('shadow', checked)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={strokeText} componentName="StrokeText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default StrokeTextDemo;
