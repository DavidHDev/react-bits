import { useMemo, useRef } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import GlitchText from '../../content/TextAnimations/GlitchText/GlitchText';
import { glitchText } from '../../constants/code/TextAnimations/glitchTextCode';

const LOOK = {
  textColor: '',
  shadowColors: ['#ff0000', '#00ffff'],
  mode: 'slices',
  trigger: 'always',
  speed: 1,
  intensity: 0.5,
  burstDuration: 0.6,
  flicker: false,
  offset: 10,
  skew: 0,
  fontSize: 0,
  fontWeight: 900,
  enableShadows: true
};

const PRESETS = {
  classic: { ...LOOK },
  rgb: {
    ...LOOK,
    shadowColors: ['#ff4d2e', '#8b8b96'],
    mode: 'rgb',
    intensity: 0.6,
    flicker: true,
    offset: 12,
    skew: 6,
    fontWeight: 800
  },
  scan: {
    ...LOOK,
    mode: 'scan',
    speed: 1.2,
    intensity: 0.7,
    offset: 26,
    fontWeight: 300,
    enableShadows: false
  },
  burst: {
    ...LOOK,
    shadowColors: ['#ff4d2e', '#ff4d2e'],
    mode: 'noise',
    trigger: 'click',
    intensity: 0.3,
    burstDuration: 0.9,
    flicker: true,
    offset: 14,
    skew: 10
  }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'rgb', label: 'RGB' },
  { value: 'scan', label: 'Scan' },
  { value: 'burst', label: 'Burst' }
];

const MODE_OPTIONS = [
  { value: 'slices', label: 'Slices' },
  { value: 'rgb', label: 'RGB' },
  { value: 'scan', label: 'Scan' },
  { value: 'noise', label: 'Noise' }
];

const TRIGGER_OPTIONS = [
  { value: 'always', label: 'Always' },
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' }
];

const LABELS = { always: 'React Bits', hover: 'Hover Me', click: 'Click Me' };

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK
};

const propData = [
  {
    name: 'children',
    type: 'string',
    default: '',
    description: 'The text content that will display the glitch effect.'
  },
  {
    name: 'mode',
    type: '"slices" | "rgb" | "scan" | "noise"',
    default: '"slices"',
    description:
      'Style of glitch. Slices shifts bands of the text sideways, rgb splits it into jittering color channels, scan sweeps a displaced band down through it and noise briefly swaps letters for glyphs.'
  },
  {
    name: 'trigger',
    type: '"always" | "hover" | "click"',
    default: '"always"',
    description: 'When it glitches: all the time, while hovered, or in a short burst on each click.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '0.5',
    description: 'Multiplier for the animation speed. Higher values slow down the glitch effect.'
  },
  {
    name: 'intensity',
    type: 'number',
    default: '0.5',
    description: 'How often and how far it glitches, from 0 (calm) to 1 (constant, wide jolts).'
  },
  {
    name: 'burstDuration',
    type: 'number',
    default: '0.6',
    description: 'Length of the burst played on each click with the click trigger, in seconds.'
  },
  {
    name: 'flicker',
    type: 'boolean',
    default: 'false',
    description: 'Adds quick, subtle dips in opacity while it glitches.'
  },
  {
    name: 'offset',
    type: 'number',
    default: '10',
    description: 'How far the glitched slices shift sideways, in px. The colored shadows grow with it.'
  },
  {
    name: 'skew',
    type: 'number',
    default: '0',
    description: 'How far the text shears sideways during a jolt, in degrees.'
  },
  {
    name: 'enableShadows',
    type: 'boolean',
    default: 'true',
    description: 'Toggle the glitch colors. Without them every mode stays in the text color.'
  },
  {
    name: 'shadowColors',
    type: '[string, string]',
    default: "['#ff0000', '#00ffff']",
    description: 'The two glitch colors: the shadows on the shifted slices, the split channels and the swapped glyphs.'
  },
  {
    name: 'color',
    type: 'string',
    default: '"currentColor"',
    description: 'Color of the text. Follows the surrounding text color by default.'
  },
  {
    name: 'fontSize',
    type: 'number | string',
    default: '"clamp(2rem, 10vw, 8rem)"',
    description: 'Font size of the text. Numbers are in px.'
  },
  {
    name: 'fontWeight',
    type: 'number | string',
    default: '900',
    description: 'Font weight of the text.'
  },
  {
    name: 'enableOnHover',
    type: 'boolean',
    default: 'false',
    description: 'Same as trigger="hover": the glitch only runs while the text is hovered.'
  },
  {
    name: 'className',
    type: 'string',
    default: '',
    description: 'Additional custom classes to apply to the component.'
  }
];

const GlitchTextDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, textColor, fontSize, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');
  const stageRef = useRef(null);

  const [key, forceRerender] = useForceRerender();

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
    if (PRESETS[value].trigger === 'click') {
      window.setTimeout(() => stageRef.current?.querySelector('.glitch')?.click(), 450);
    }
  };

  const computedProps = useMemo(
    () => ({
      ...(textColor ? { color: textColor } : {}),
      ...(fontSize ? { fontSize } : {})
    }),
    [textColor, fontSize]
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'textColor', 'fontSize']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box ref={stageRef} position="relative" className="demo-container" h={400} overflow="hidden">
            <GlitchText key={key} {...settings} color={textColor || undefined} fontSize={fontSize || undefined}>
              {LABELS[settings.trigger] || LABELS.always}
            </GlitchText>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Text Color"
              color={textColor || ink}
              onChange={value => updateProp('textColor', value)}
            />
            <PreviewColorPickerCustom
              title="Shadow Color 1"
              color={settings.shadowColors[0]}
              onChange={value => updateProp('shadowColors', [value, settings.shadowColors[1]])}
            />
            <PreviewColorPickerCustom
              title="Shadow Color 2"
              color={settings.shadowColors[1]}
              onChange={value => updateProp('shadowColors', [settings.shadowColors[0], value])}
            />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={settings.mode}
              onChange={value => updateProp('mode', value)}
            />
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={settings.trigger}
              onChange={value => {
                updateProp('trigger', value);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Refresh Delay"
              min={0.1}
              max={5}
              step={0.1}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0}
              max={1}
              step={0.05}
              value={settings.intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Burst Duration"
              min={0.2}
              max={3}
              step={0.1}
              value={settings.burstDuration}
              valueUnit="s"
              isDisabled={settings.trigger !== 'click'}
              onChange={value => updateProp('burstDuration', value)}
            />
            <PreviewSwitch
              title="Flicker"
              isChecked={settings.flicker}
              onChange={value => updateProp('flicker', value)}
            />
            <PreviewSlider
              title="Offset"
              min={0}
              max={40}
              step={1}
              value={settings.offset}
              valueUnit="px"
              onChange={value => updateProp('offset', value)}
            />
            <PreviewSlider
              title="Skew"
              min={0}
              max={30}
              step={1}
              value={settings.skew}
              valueUnit="°"
              onChange={value => updateProp('skew', value)}
            />
            <PreviewSlider
              title="Font Size"
              min={0}
              max={160}
              step={4}
              value={fontSize}
              displayValue={value => (value ? `${value}px` : 'Auto')}
              onChange={value => updateProp('fontSize', value)}
            />
            <PreviewSlider
              title="Font Weight"
              min={100}
              max={900}
              step={100}
              value={settings.fontWeight}
              onChange={value => updateProp('fontWeight', value)}
            />
            <PreviewSwitch
              title="Glitch Colors"
              isChecked={settings.enableShadows}
              onChange={checked => updateProp('enableShadows', checked)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={glitchText} componentName="GlitchText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default GlitchTextDemo;
