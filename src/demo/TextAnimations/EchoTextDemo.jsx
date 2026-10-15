import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import EchoText from '../../content/TextAnimations/EchoText/EchoText';
import { echoText } from '../../constants/code/TextAnimations/echoTextCode';

const LOOK = {
  palette: 'tint',
  tint: '#7dd3fc',
  rampFront: '',
  rampBack: '#ff7a45',
  trail: 'pointer',
  clickBurst: true,
  echoes: 12,
  lag: 0.24,
  offset: 36,
  direction: 'right',
  fade: 0.72,
  blur: 3,
  echoStyle: 'solid',
  echoScale: 1,
  duration: 900,
  ease: 'ease-out'
};

const PRESETS = {
  ghost: { ...LOOK },
  orbit: {
    ...LOOK,
    palette: 'ramp',
    trail: 'auto',
    echoes: 10,
    lag: 0.2,
    offset: 44,
    direction: 'diagonal',
    fade: 0.84,
    blur: 0,
    echoStyle: 'outline',
    duration: 1100,
    ease: 'snappy'
  },
  wake: {
    ...LOOK,
    palette: 'ramp',
    rampBack: '#3ddc97',
    trail: 'scroll',
    echoes: 16,
    lag: 0.3,
    offset: 24,
    direction: 'down',
    fade: 0.82,
    blur: 5,
    duration: 1200,
    ease: 'ease-in-out'
  },
  zoom: {
    ...LOOK,
    palette: 'ramp',
    rampBack: '#5b8cff',
    trail: 'auto',
    echoes: 7,
    lag: 0.2,
    offset: 30,
    direction: 'up',
    fade: 0.75,
    blur: 0,
    echoScale: 1.4,
    duration: 1000
  }
};

const DEFAULT_PROPS = {
  preset: 'ghost',
  text: 'Motion Echo',
  ...LOOK,
  mode: 'both',
  cursorRadius: 320,
  fontSize: 'clamp(3rem, 9vw, 7rem)',
  fontWeight: 800,
  textColor: ''
};

const PRESET_OPTIONS = [
  { value: 'ghost', label: 'Ghost' },
  { value: 'orbit', label: 'Orbit' },
  { value: 'wake', label: 'Wake' },
  { value: 'zoom', label: 'Zoom' }
];

const PALETTE_OPTIONS = [
  { value: 'tint', label: 'Tint' },
  { value: 'ramp', label: 'Ramp' },
  { value: 'plain', label: 'Plain' }
];

const TRAIL_OPTIONS = [
  { value: 'pointer', label: 'Pointer' },
  { value: 'auto', label: 'Auto' },
  { value: 'scroll', label: 'Scroll' }
];

const DIRECTION_OPTIONS = [
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' },
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
  { value: 'diagonal', label: 'Diagonal' }
];

const MODE_OPTIONS = [
  { value: 'both', label: 'Entrance + Trail' },
  { value: 'entrance', label: 'Entrance Only' },
  { value: 'pointer', label: 'Trail Only' }
];

const STYLE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'outline', label: 'Outline' }
];

const EASE_OPTIONS = [
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' },
  { value: 'snappy', label: 'Snappy' },
  { value: 'linear', label: 'Linear' }
];

const FONT_SIZE_OPTIONS = [
  { value: 'clamp(2.5rem, 7vw, 5.5rem)', label: 'Compact' },
  { value: 'clamp(3rem, 9vw, 7rem)', label: 'Hero' },
  { value: 'clamp(4rem, 12vw, 9rem)', label: 'Billboard' }
];

const propData = [
  {
    name: 'text',
    type: 'string',
    default: '"Motion Echo"',
    description: 'Text rendered by the crisp front copy and every echo.'
  },
  {
    name: 'echoes',
    type: 'number',
    default: '12',
    description: 'Number of ghost copies behind the front text, up to 24.'
  },
  {
    name: 'lag',
    type: 'number',
    default: '0.24',
    description: 'How slowly deeper echoes catch up with the text, and how far apart they spread along the auto trail.'
  },
  {
    name: 'offset',
    type: 'number',
    default: '36',
    description:
      'How far the echoes spread on entrance, how far the text leans toward the cursor and how wide the drift and click burst reach, in px.'
  },
  {
    name: 'direction',
    type: '"right" | "left" | "up" | "down" | "diagonal"',
    default: '"right"',
    description: 'Direction the entrance trail settles in from.'
  },
  {
    name: 'fade',
    type: 'number',
    default: '0.72',
    description: 'How much of its opacity each echo keeps from the one in front of it.'
  },
  {
    name: 'blur',
    type: 'number',
    default: '3',
    description: 'Blur on the deepest echo, in px. Echoes in between blur less.'
  },
  {
    name: 'tint',
    type: 'string | false',
    default: '"#7dd3fc"',
    description: 'Color blended into the echoes, stronger toward the back. Pass false for plain echoes.'
  },
  {
    name: 'echoColors',
    type: '[string, string]',
    default: 'undefined',
    description:
      'Two colors the echoes fade between, from the echo nearest the text to the deepest one. Replaces the tint when set.'
  },
  {
    name: 'echoStyle',
    type: '"solid" | "outline"',
    default: '"solid"',
    description: 'Draws the echoes as filled text or as thin outlines.'
  },
  {
    name: 'echoScale',
    type: 'number',
    default: '1',
    description: 'Size of the deepest echo relative to the text. Below 1 the trail recedes, above 1 it looms.'
  },
  {
    name: 'mode',
    type: '"entrance" | "pointer" | "both"',
    default: '"both"',
    description:
      'Whether the echoes play on entrance, run the live trail, or both. "pointer" means trail only, whatever drives it.'
  },
  {
    name: 'trail',
    type: '"pointer" | "auto" | "scroll"',
    default: '"pointer"',
    description:
      'What drives the live trail. Pointer follows the cursor, auto drifts the echoes on a slow figure-eight whenever the cursor is away, scroll stretches them behind the text as the page scrolls.'
  },
  {
    name: 'clickBurst',
    type: 'boolean',
    default: 'true',
    description: 'Clicking the text releases a burst of echoes that expand from the click point and fade.'
  },
  {
    name: 'cursorRadius',
    type: 'number',
    default: '320',
    description:
      'Distance in px over which the cursor pulls the text to full offset. With the auto trail, the drift resumes once the cursor leaves this radius.'
  },
  {
    name: 'duration',
    type: 'number',
    default: '900',
    description: 'How long the entrance takes to settle, in ms.'
  },
  {
    name: 'ease',
    type: '"linear" | "ease-out" | "ease-in-out" | "snappy"',
    default: '"ease-out"',
    description: 'Timing curve of the entrance.'
  },
  {
    name: 'fontSize',
    type: 'string | number',
    default: '"clamp(3rem, 9vw, 7rem)"',
    description: 'Font size of the text.'
  },
  {
    name: 'fontWeight',
    type: 'string | number',
    default: '800',
    description: 'Font weight of the text.'
  },
  {
    name: 'color',
    type: 'string',
    default: '"currentColor"',
    description: 'Color of the front copy. Follows the surrounding text color by default.'
  },
  {
    name: 'className',
    type: 'string',
    default: '""',
    description: 'Extra class names for the root element.'
  },
  {
    name: 'style',
    type: 'CSSProperties',
    default: 'undefined',
    description: 'Inline styles for the root element.'
  }
];

const EchoTextDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [key, forceRerender] = useForceRerender();
  const { preset, textColor, palette, tint, rampFront, rampBack, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const updateAndReplay = (name, value) => {
    updateProp(name, value);
    forceRerender();
  };

  const computedProps = useMemo(
    () => ({
      tint: palette === 'tint' ? tint : false,
      ...(palette === 'ramp' ? { echoColors: [rampFront || 'currentColor', rampBack] } : {}),
      ...(textColor ? { color: textColor } : {})
    }),
    [palette, tint, rampFront, rampBack, textColor]
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'textColor', 'palette', 'rampFront', 'rampBack']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            minH={430}
            overflow="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
            px={{ base: 6, md: 14 }}
          >
            <RefreshButton onClick={forceRerender} />
            <EchoText
              key={key}
              {...settings}
              tint={computedProps.tint}
              echoColors={computedProps.echoColors}
              color={textColor || 'currentColor'}
            />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />

            <PreviewColorPickerCustom
              title="Text Color"
              color={textColor || ink}
              onChange={val => updateProp('textColor', val)}
            />
            <PreviewSelect
              title="Echo Colors"
              options={PALETTE_OPTIONS}
              value={palette}
              onChange={val => updateProp('palette', val)}
            />
            <PreviewColorPickerCustom
              title="Echo Tint"
              color={tint}
              onChange={val => updateProps({ tint: val, palette: 'tint' })}
            />
            <PreviewColorPickerCustom
              title="Ramp Front"
              color={rampFront || ink}
              onChange={val => updateProps({ rampFront: val, palette: 'ramp' })}
            />
            <PreviewColorPickerCustom
              title="Ramp Back"
              color={rampBack}
              onChange={val => updateProps({ rampBack: val, palette: 'ramp' })}
            />

            <PreviewSelect
              title="Trail"
              options={TRAIL_OPTIONS}
              value={settings.trail}
              onChange={val => updateProp('trail', val)}
            />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={settings.mode}
              onChange={val => updateAndReplay('mode', val)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.direction}
              onChange={val => updateAndReplay('direction', val)}
            />
            <PreviewSelect
              title="Ease"
              options={EASE_OPTIONS}
              value={settings.ease}
              onChange={val => updateAndReplay('ease', val)}
            />
            <PreviewSwitch
              title="Click Burst"
              isChecked={settings.clickBurst}
              onChange={checked => updateProp('clickBurst', checked)}
            />
            <PreviewSlider
              title="Echoes"
              min={2}
              max={18}
              step={1}
              value={settings.echoes}
              onChange={val => updateProp('echoes', val)}
            />
            <PreviewSlider
              title="Lag"
              min={0.05}
              max={0.3}
              step={0.01}
              value={settings.lag}
              onChange={val => updateProp('lag', val)}
            />
            <PreviewSlider
              title="Offset"
              min={8}
              max={56}
              step={1}
              value={settings.offset}
              valueUnit="px"
              onChange={val => updateProp('offset', val)}
            />
            <PreviewSlider
              title="Duration"
              min={300}
              max={1600}
              step={50}
              value={settings.duration}
              valueUnit="ms"
              onChange={val => updateAndReplay('duration', val)}
            />
            <PreviewSlider
              title="Cursor Radius"
              min={80}
              max={900}
              step={10}
              value={settings.cursorRadius}
              valueUnit="px"
              isDisabled={settings.mode === 'entrance' || settings.trail === 'scroll'}
              onChange={val => updateProp('cursorRadius', val)}
            />

            <PreviewInput title="Text" value={settings.text} maxLength={24} onChange={val => updateProp('text', val)} />
            <PreviewSelect
              title="Echo Style"
              options={STYLE_OPTIONS}
              value={settings.echoStyle}
              onChange={val => updateProp('echoStyle', val)}
            />
            <PreviewSelect
              title="Size"
              options={FONT_SIZE_OPTIONS}
              value={settings.fontSize}
              onChange={val => updateProp('fontSize', val)}
            />
            <PreviewSlider
              title="Fade"
              min={0.35}
              max={0.85}
              step={0.01}
              value={settings.fade}
              onChange={val => updateProp('fade', val)}
            />
            <PreviewSlider
              title="Blur"
              min={0}
              max={7}
              step={0.25}
              value={settings.blur}
              valueUnit="px"
              onChange={val => updateProp('blur', val)}
            />
            <PreviewSlider
              title="Echo Scale"
              min={0.5}
              max={1.6}
              step={0.05}
              value={settings.echoScale}
              onChange={val => updateProp('echoScale', val)}
            />
            <PreviewSlider
              title="Weight"
              min={500}
              max={950}
              step={50}
              value={settings.fontWeight}
              onChange={val => updateProp('fontWeight', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={echoText} componentName="EchoText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default EchoTextDemo;
