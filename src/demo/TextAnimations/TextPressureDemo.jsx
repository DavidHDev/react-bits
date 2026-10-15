import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box } from '@chakra-ui/react';

import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import PreviewInput from '../../components/common/Preview/PreviewInput';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import TextPressure from '../../content/TextAnimations/TextPressure/TextPressure';
import { textPressure } from '../../constants/code/TextAnimations/textPressureCode';

const ACCENT = '#ff5a1f';

const LOOK = {
  flex: true,
  width: true,
  weight: true,
  italic: true,
  alpha: false,
  stroke: false,
  scale: false,
  radius: 0.5,
  smoothing: 0.5,
  idle: 'wave',
  idleSpeed: 1,
  clickRipple: true,
  strokeWidth: 3,
  pressureColor: '',
  strokeColor: ACCENT
};

const PRESETS = {
  classic: { ...LOOK },
  heat: { ...LOOK, flex: false, italic: false, idle: 'pulse', pressureColor: ACCENT, radius: 0.4, smoothing: 0.3 },
  tall: { ...LOOK, scale: true, italic: false, idleSpeed: 1.4, radius: 0.3, smoothing: 0.65 },
  ghost: { ...LOOK, alpha: true, width: false, radius: 0.4, smoothing: 0.85, idleSpeed: 0.7 }
};

const DEFAULT_PROPS = {
  preset: 'classic',
  text: 'Hello!',
  ...LOOK,
  textColor: ''
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'heat', label: 'Heat' },
  { value: 'tall', label: 'Tall' },
  { value: 'ghost', label: 'Ghost' }
];

const IDLE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'wave', label: 'Wave' },
  { value: 'pulse', label: 'Pulse' }
];

const propData = [
  {
    name: 'text',
    type: 'string',
    default: '"Compressa"',
    description: 'Text content that will be displayed and animated.'
  },
  {
    name: 'fontFamily',
    type: 'string',
    default: 'Roboto Flex',
    description: 'Name of the variable font family.'
  },
  {
    name: 'fontUrl',
    type: 'string',
    default: 'URL to Roboto Flex on Google Fonts',
    description: 'Stylesheet URL that loads the variable font. The font needs width, weight and italic axes.'
  },
  {
    name: 'textColor',
    type: 'string',
    default: "'currentColor'",
    description: 'Fill color of the text. Follows the surrounding text color by default.'
  },
  {
    name: 'pressureColor',
    type: 'string',
    default: "''",
    description: 'Letters blend toward this color as they swell under pressure. Leave empty to keep one color.'
  },
  {
    name: 'strokeColor',
    type: 'string',
    default: '#FF0000',
    description: 'Color of the outline when stroke is on.'
  },
  {
    name: 'idle',
    type: "'none' | 'wave' | 'pulse'",
    default: "'none'",
    description:
      'What the letters do while the pointer is away. A wave rolls a swell across the word, a pulse makes it breathe in and out.'
  },
  {
    name: 'idleSpeed',
    type: 'number',
    default: '1',
    description: 'Speed of the idle wave or pulse. 2 plays it twice as fast.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '0.5',
    description:
      "How far the cursor's pull reaches, as a fraction of the text width. Also sets the length of the idle wave."
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '0.5',
    description: 'How softly the letters follow the cursor, from 0 for instant to 1 for a slow, floaty glide.'
  },
  {
    name: 'clickRipple',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a wave of pressure rippling outward through the letters.'
  },
  {
    name: 'flex',
    type: 'boolean',
    default: 'true',
    description: 'Spreads the letters across the full width.'
  },
  {
    name: 'scale',
    type: 'boolean',
    default: 'false',
    description: 'Stretches the text vertically to fill the height of its container.'
  },
  {
    name: 'alpha',
    type: 'boolean',
    default: 'false',
    description: 'Fades letters out the further they are from the cursor.'
  },
  {
    name: 'stroke',
    type: 'boolean',
    default: 'false',
    description: 'Draws an outline behind each letter.'
  },
  {
    name: 'width',
    type: 'boolean',
    default: 'true',
    description: 'Varies the width axis of the font with pressure.'
  },
  {
    name: 'weight',
    type: 'boolean',
    default: 'true',
    description: 'Varies the weight axis of the font with pressure.'
  },
  {
    name: 'italic',
    type: 'boolean',
    default: 'true',
    description: 'Varies the italic axis of the font with pressure.'
  },
  {
    name: 'strokeWidth',
    type: 'number',
    default: '3',
    description: 'Width of the outline when stroke is on, in px. About half of it shows around the letters.'
  },
  {
    name: 'className',
    type: 'string',
    default: '""',
    description: 'Additional class for styling the <h1> wrapper.'
  },
  {
    name: 'minFontSize',
    type: 'number',
    default: '24',
    description: 'Sets a minimum font-size to avoid overly tiny text on smaller screens.'
  }
];

const TextPressureDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, textColor, pressureColor, ...settings } = props;
  const ink = useColorModeValue('#18181b', '#ffffff');

  const [key, forceRerender] = useForceRerender();

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = useMemo(
    () => ({ ...(textColor ? { textColor } : {}), ...(pressureColor ? { pressureColor } : {}) }),
    [textColor, pressureColor]
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'textColor', 'pressureColor']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={430} overflow="hidden" mb={6}>
            <RefreshButton onClick={forceRerender} />
            <Box w="100%" h="100%" minH={0}>
              <TextPressure
                key={key}
                {...settings}
                textColor={textColor || 'currentColor'}
                pressureColor={pressureColor}
                minFontSize={36}
              />
            </Box>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />

            <PreviewInput
              title="Text"
              value={settings.text}
              placeholder="Your text here..."
              maxLength={10}
              onChange={value => updateProp('text', value)}
            />

            <PreviewColorPickerCustom
              title="Text Color"
              color={textColor || ink}
              onChange={value => updateProp('textColor', value)}
            />

            <PreviewColorPickerCustom
              title="Pressure Color"
              color={pressureColor || ink}
              onChange={value => updateProp('pressureColor', value)}
            />

            <PreviewColorPickerCustom
              title="Stroke Color"
              color={settings.strokeColor}
              onChange={value => updateProp('strokeColor', value)}
            />

            <PreviewSelect
              title="Idle"
              options={IDLE_OPTIONS}
              value={settings.idle}
              onChange={value => updateProp('idle', value)}
            />

            <PreviewSlider
              title="Idle Speed"
              min={0.2}
              max={3}
              step={0.1}
              value={settings.idleSpeed}
              valueUnit="x"
              isDisabled={settings.idle === 'none'}
              onChange={value => updateProp('idleSpeed', value)}
            />

            <PreviewSlider
              title="Radius"
              min={0.1}
              max={1.5}
              step={0.05}
              value={settings.radius}
              onChange={value => updateProp('radius', value)}
            />

            <PreviewSlider
              title="Smoothing"
              min={0}
              max={1}
              step={0.05}
              value={settings.smoothing}
              onChange={value => updateProp('smoothing', value)}
            />

            <PreviewSwitch
              title="Click Ripple"
              isChecked={settings.clickRipple}
              onChange={checked => updateProp('clickRipple', checked)}
            />

            <PreviewSlider
              title="Stroke Width"
              min={1}
              max={10}
              step={1}
              value={settings.strokeWidth}
              valueUnit="px"
              isDisabled={!settings.stroke}
              onChange={value => updateProp('strokeWidth', value)}
            />

            <PreviewSwitch title="Flex" isChecked={settings.flex} onChange={checked => updateProp('flex', checked)} />
            <PreviewSwitch
              title="Width"
              isChecked={settings.width}
              onChange={checked => updateProp('width', checked)}
            />
            <PreviewSwitch
              title="Weight"
              isChecked={settings.weight}
              onChange={checked => updateProp('weight', checked)}
            />
            <PreviewSwitch
              title="Italic"
              isChecked={settings.italic}
              onChange={checked => updateProp('italic', checked)}
            />
            <PreviewSwitch
              title="Alpha"
              isChecked={settings.alpha}
              onChange={checked => updateProp('alpha', checked)}
            />
            <PreviewSwitch
              title="Stroke"
              isChecked={settings.stroke}
              onChange={checked => updateProp('stroke', checked)}
            />
            <PreviewSwitch
              title="Scale"
              isChecked={settings.scale}
              onChange={checked => updateProp('scale', checked)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={textPressure} componentName="TextPressure" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default TextPressureDemo;
