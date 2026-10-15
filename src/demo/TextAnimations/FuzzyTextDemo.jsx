import { useMemo } from 'react';
import { Box, Flex, Spacer } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useComponentProps from '../../hooks/useComponentProps';
import useForceRerender from '../../hooks/useForceRerender';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorModeValue } from '../../components/setup/color-mode';

import FuzzyText from '../../content/TextAnimations/FuzzyText/FuzzyText';
import { fuzzyText } from '../../constants/code/TextAnimations/fuzzyTextCode';

const LOOK = {
  colorSplit: 0,
  trigger: 'hover',
  direction: 'horizontal',
  baseIntensity: 0.2,
  hoverIntensity: 0.5,
  fuzzRange: 30,
  sliceSize: 1,
  fps: 60,
  transitionDuration: 0,
  intro: true,
  introDuration: 1400,
  clickEffect: false,
  glitchMode: false,
  glitchInterval: 2000,
  glitchDuration: 200,
  letterSpacing: 0
};

const PRESETS = {
  static: { ...LOOK },
  glitch: {
    ...LOOK,
    colorSplit: 0.6,
    trigger: 'click',
    baseIntensity: 0.04,
    hoverIntensity: 0.7,
    fuzzRange: 50,
    sliceSize: 5,
    transitionDuration: 4,
    introDuration: 1100,
    glitchMode: true,
    glitchInterval: 1600,
    glitchDuration: 240
  },
  shiver: {
    ...LOOK,
    trigger: 'always',
    direction: 'both',
    baseIntensity: 0.12,
    hoverIntensity: 0.4,
    fuzzRange: 14,
    sliceSize: 2,
    fps: 24,
    transitionDuration: 8,
    intro: false
  },
  melt: {
    ...LOOK,
    direction: 'vertical',
    baseIntensity: 0.25,
    hoverIntensity: 0.9,
    fuzzRange: 26,
    sliceSize: 2,
    transitionDuration: 20,
    introDuration: 2600
  }
};

const DEFAULT_PROPS = {
  preset: 'static',
  color: '',
  ...LOOK,
  enableHover: true
};

const PRESET_OPTIONS = [
  { value: 'static', label: 'Static' },
  { value: 'glitch', label: 'Glitch' },
  { value: 'shiver', label: 'Shiver' },
  { value: 'melt', label: 'Melt' }
];

const TRIGGER_OPTIONS = [
  { value: 'hover', label: 'Hover' },
  { value: 'always', label: 'Always' },
  { value: 'click', label: 'Click' }
];

const DIRECTION_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
  { value: 'both', label: 'Both' }
];

const propData = [
  {
    name: 'children',
    type: 'React.ReactNode',
    default: '-',
    description: 'The text to draw.'
  },
  {
    name: 'fontSize',
    type: 'number | string',
    default: "'clamp(2rem, 8vw, 8rem)'",
    description: 'Font size as any CSS size or a number in px. Responsive sizes are redrawn when the window resizes.'
  },
  {
    name: 'fontWeight',
    type: 'string | number',
    default: '900',
    description: 'Font weight of the text.'
  },
  {
    name: 'fontFamily',
    type: 'string',
    default: "'inherit'",
    description: "Font family of the text. 'inherit' uses the font of the surrounding text."
  },
  {
    name: 'color',
    type: 'string',
    default: "'currentColor'",
    description: 'Color of the text. Follows the surrounding text color by default, including theme switches.'
  },
  {
    name: 'colorSplit',
    type: 'number',
    default: '0',
    description:
      'Splits the text into offset red, green and blue copies that tear apart with the fuzz, from 0 to 1. Dark text splits into print-style cyan, magenta and yellow instead.'
  },
  {
    name: 'trigger',
    type: "'hover' | 'always' | 'click'",
    default: "'hover'",
    description:
      "What raises the fuzz. 'hover' reacts to the pointer, 'always' holds the hover intensity, 'click' fires a burst that eases back."
  },
  {
    name: 'enableHover',
    type: 'boolean',
    default: 'true',
    description: "Raises the fuzz to the hover intensity while the pointer is over the text, when trigger is 'hover'."
  },
  {
    name: 'baseIntensity',
    type: 'number',
    default: '0.18',
    description: 'How strong the fuzz is at rest.'
  },
  {
    name: 'hoverIntensity',
    type: 'number',
    default: '0.5',
    description:
      "How strong the fuzz is while hovered. With trigger 'always' it is the constant level, with 'click' it sets how hard each burst hits."
  },
  {
    name: 'fuzzRange',
    type: 'number',
    default: '30',
    description: 'Furthest the strips can shift, in px.'
  },
  {
    name: 'sliceSize',
    type: 'number',
    default: '1',
    description: 'Thickness of each shifted strip, in px. 1 gives a fine fuzz, larger values tear the text into bands.'
  },
  {
    name: 'fps',
    type: 'number',
    default: '60',
    description: 'Frame rate cap. Lower values look choppier and use less CPU.'
  },
  {
    name: 'direction',
    type: "'horizontal' | 'vertical' | 'both'",
    default: "'horizontal'",
    description: 'Which way the strips shift.'
  },
  {
    name: 'transitionDuration',
    type: 'number',
    default: '0',
    description: 'How many frames the fuzz takes to ease between intensities. 0 switches instantly.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'false',
    description: 'Fades the text in as heavy, coarse static that resolves into clean letters the first time it is seen.'
  },
  {
    name: 'introDuration',
    type: 'number',
    default: '1400',
    description: 'How long the intro takes to resolve, in ms.'
  },
  {
    name: 'clickEffect',
    type: 'boolean',
    default: 'false',
    description: "Gives a short burst of full intensity on click when trigger is 'hover' or 'always'."
  },
  {
    name: 'glitchMode',
    type: 'boolean',
    default: 'false',
    description: 'Adds bursts of full intensity at a regular interval.'
  },
  {
    name: 'glitchInterval',
    type: 'number',
    default: '2000',
    description: 'Time between glitch bursts, in ms.'
  },
  {
    name: 'glitchDuration',
    type: 'number',
    default: '200',
    description: 'Length of each glitch burst, in ms.'
  },
  {
    name: 'gradient',
    type: 'string[] | null',
    default: 'null',
    description: 'Two or more colors to fill the text with a left to right gradient instead of a single color.'
  },
  {
    name: 'letterSpacing',
    type: 'number',
    default: '0',
    description: 'Extra space between letters, in px.'
  },
  {
    name: 'className',
    type: 'string',
    default: "''",
    description: 'Extra class names for the canvas.'
  }
];

const FuzzyTextDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, color, ...settings } = props;
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

  const computedProps = useMemo(() => (color ? { color } : {}), [color]);
  const textColor = color || undefined;

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'color']}
      computedProps={computedProps}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} overflow="hidden">
            {settings.intro && <RefreshButton onClick={forceRerender} />}
            <Flex key={key} direction="column" align="center">
              <FuzzyText {...settings} color={textColor} fontSize={140}>
                404
              </FuzzyText>
              <Spacer my={1} />
              <FuzzyText {...settings} color={textColor} fontSize={70} fontFamily="Gochi Hand">
                not found
              </FuzzyText>
            </Flex>
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={color || ink}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSlider
              title="Color Split"
              min={0}
              max={1}
              step={0.05}
              value={settings.colorSplit}
              onChange={value => updateProp('colorSplit', value)}
            />
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={settings.trigger}
              onChange={value => updateProp('trigger', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings.direction}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewSlider
              title="Base Intensity"
              min={0}
              max={1}
              step={0.01}
              value={settings.baseIntensity}
              onChange={value => updateProp('baseIntensity', value)}
            />
            <PreviewSlider
              title="Hover Intensity"
              min={0}
              max={2}
              step={0.01}
              value={settings.hoverIntensity}
              isDisabled={settings.trigger === 'hover' && !settings.enableHover}
              onChange={value => updateProp('hoverIntensity', value)}
            />
            <PreviewSlider
              title="Fuzz Range"
              min={5}
              max={100}
              step={1}
              value={settings.fuzzRange}
              valueUnit="px"
              onChange={value => updateProp('fuzzRange', value)}
            />
            <PreviewSlider
              title="Slice Size"
              min={1}
              max={12}
              step={1}
              value={settings.sliceSize}
              valueUnit="px"
              onChange={value => updateProp('sliceSize', value)}
            />
            <PreviewSlider
              title="FPS"
              min={10}
              max={120}
              step={5}
              value={settings.fps}
              onChange={value => updateProp('fps', value)}
            />
            <PreviewSlider
              title="Transition Duration"
              min={0}
              max={60}
              step={1}
              value={settings.transitionDuration}
              onChange={value => updateProp('transitionDuration', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings.intro}
              onChange={value => updateAndReplay('intro', value)}
            />
            <PreviewSlider
              title="Intro Duration"
              min={400}
              max={4000}
              step={100}
              value={settings.introDuration}
              valueUnit="ms"
              isDisabled={!settings.intro}
              onChange={value => updateAndReplay('introDuration', value)}
            />
            <PreviewSwitch
              title="Enable Hover"
              isChecked={settings.enableHover}
              isDisabled={settings.trigger !== 'hover'}
              onChange={value => updateProp('enableHover', value)}
            />
            <PreviewSwitch
              title="Click Effect"
              isChecked={settings.clickEffect}
              isDisabled={settings.trigger === 'click'}
              onChange={value => updateProp('clickEffect', value)}
            />
            <PreviewSwitch
              title="Glitch Mode"
              isChecked={settings.glitchMode}
              onChange={value => updateProp('glitchMode', value)}
            />
            <PreviewSlider
              title="Glitch Interval"
              min={500}
              max={5000}
              step={100}
              value={settings.glitchInterval}
              valueUnit="ms"
              isDisabled={!settings.glitchMode}
              onChange={value => updateProp('glitchInterval', value)}
            />
            <PreviewSlider
              title="Glitch Duration"
              min={50}
              max={1000}
              step={50}
              value={settings.glitchDuration}
              valueUnit="ms"
              isDisabled={!settings.glitchMode}
              onChange={value => updateProp('glitchDuration', value)}
            />
            <PreviewSlider
              title="Letter Spacing"
              min={-10}
              max={50}
              step={1}
              value={settings.letterSpacing}
              valueUnit="px"
              onChange={value => updateProp('letterSpacing', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={fuzzyText} componentName="FuzzyText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FuzzyTextDemo;
