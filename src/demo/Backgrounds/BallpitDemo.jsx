import { Box, Flex } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorList from '../../components/common/Preview/PreviewColorList';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorMode } from '../../components/setup/color-mode';

import Ballpit from '../../content/Backgrounds/Ballpit/Ballpit';
import { ballpit } from '../../constants/code/Backgrounds/ballpitCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/Ballpit';

const DEFAULT_PROPS = {
  preset: 'float',
  ...LOOK,
  followCursor: true,
  grab: true,
  clickEffect: 'burst',
  intro: true
};

const MATERIAL_OPTIONS = [
  { value: 'satin', label: 'Satin' },
  { value: 'matte', label: 'Matte' },
  { value: 'gloss', label: 'Gloss' },
  { value: 'frosted', label: 'Frosted' },
  { value: 'metal', label: 'Metal' }
];

const CLICK_OPTIONS = [
  { value: 'burst', label: 'Burst' },
  { value: 'none', label: 'None' }
];

const propData = [
  { name: 'count', type: 'number', default: '200', description: 'Number of balls in the pit.' },
  {
    name: 'colors',
    type: 'Array<string | number>',
    default: "['#ffffff']",
    description: 'Ball colors, handed out in turn. Hex strings or numbers such as 0x5227ff.'
  },
  {
    name: 'material',
    type: "'satin' | 'matte' | 'gloss' | 'frosted' | 'metal'",
    default: "'satin'",
    description: 'Surface finish: soft satin, chalky matte, polished gloss, see-through frosted or brushed metal.'
  },
  {
    name: 'minSize',
    type: 'number',
    default: '0.5',
    description: 'Smallest ball radius. The view is about 18 units tall.'
  },
  { name: 'maxSize', type: 'number', default: '1', description: 'Largest ball radius.' },
  {
    name: 'gravity',
    type: 'number',
    default: '0.5',
    description: 'Pull toward the floor. 0 lets the balls float, around 0.5 piles them up.'
  },
  {
    name: 'friction',
    type: 'number',
    default: '0.9975',
    description: 'How much speed the balls keep each frame. 1 never slows them down.'
  },
  {
    name: 'wallBounce',
    type: 'number',
    default: '0.95',
    description: 'How much speed the balls keep when they hit the edges, from 0 to 1.'
  },
  {
    name: 'bounce',
    type: 'number',
    default: '0.85',
    description: 'How bouncy the balls are against each other, from 0 to 1.'
  },
  {
    name: 'depth',
    type: 'number',
    default: '2',
    description: 'How deep the pit is, so balls can sit in front of and behind each other.'
  },
  {
    name: 'drift',
    type: 'number',
    default: '0',
    description: 'Gentle wandering that keeps floating balls moving on their own.'
  },
  {
    name: 'followCursor',
    type: 'boolean',
    default: 'true',
    description: 'A ball follows the cursor and shoves the others out of the way.'
  },
  { name: 'cursorSize', type: 'number', default: '1', description: 'Radius of the cursor ball.' },
  {
    name: 'grab',
    type: 'boolean',
    default: 'true',
    description: 'Press on a ball to pick it up, drag it around and throw it.'
  },
  {
    name: 'clickEffect',
    type: "'burst' | 'none'",
    default: "'burst'",
    description: 'Clicking an empty spot blasts the nearby balls away with a flash of light.'
  },
  {
    name: 'lightColor',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color of the light that follows the cursor and lights up the balls around it.'
  },
  { name: 'lightIntensity', type: 'number', default: '1', description: 'Brightness of the cursor light.' },
  { name: 'exposure', type: 'number', default: '1', description: 'Overall brightness of the balls.' },
  {
    name: 'shadows',
    type: 'number',
    default: '0.6',
    description: 'Strength of the soft shadows where balls touch each other and the floor.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Balls pour in from the top on mount, or burst out from the center when gravity is near zero.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const BallpitDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { colorMode } = useColorMode();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { light: colorMode === 'light', defaults: defaultProps }), preset: value });
    forceRerender();
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
            <Ballpit key={key} {...settings} />
            <BackgroundContent headline="Balls! What's not to like about them?" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="ballpit" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={settings.colors}
              min={1}
              max={6}
              onChange={value => updateProp('colors', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Material"
              options={MATERIAL_OPTIONS}
              value={settings.material}
              onChange={value => updateProp('material', value)}
            />
            <PreviewSelect
              title="Click Effect"
              options={CLICK_OPTIONS}
              value={settings.clickEffect}
              onChange={value => updateProp('clickEffect', value)}
            />
            <PreviewColorPickerCustom
              title="Light Color"
              color={settings.lightColor}
              onChange={value => updateProp('lightColor', value)}
            />
            <PreviewSlider
              title="Count"
              min={10}
              max={1000}
              step={10}
              value={settings.count}
              onChange={value => updateProp('count', value)}
            />
            <PreviewSlider
              title="Min Size"
              min={0.1}
              max={2}
              step={0.05}
              value={settings.minSize}
              onChange={value => updateProp('minSize', value)}
            />
            <PreviewSlider
              title="Max Size"
              min={0.1}
              max={2}
              step={0.05}
              value={settings.maxSize}
              onChange={value => updateProp('maxSize', value)}
            />
            <PreviewSlider
              title="Gravity"
              min={0}
              max={2}
              step={0.01}
              value={settings.gravity}
              onChange={value => updateProp('gravity', value)}
            />
            <PreviewSlider
              title="Friction"
              min={0.95}
              max={1}
              step={0.0005}
              value={settings.friction}
              onChange={value => updateProp('friction', value)}
            />
            <PreviewSlider
              title="Wall Bounce"
              min={0}
              max={1}
              step={0.05}
              value={settings.wallBounce}
              onChange={value => updateProp('wallBounce', value)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={1}
              step={0.05}
              value={settings.bounce}
              onChange={value => updateProp('bounce', value)}
            />
            <PreviewSlider
              title="Depth"
              min={0}
              max={6}
              step={0.25}
              value={settings.depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Drift"
              min={0}
              max={2}
              step={0.05}
              value={settings.drift}
              onChange={value => updateProp('drift', value)}
            />
            <PreviewSlider
              title="Cursor Size"
              min={0.2}
              max={3}
              step={0.1}
              value={settings.cursorSize}
              isDisabled={!settings.followCursor}
              onChange={value => updateProp('cursorSize', value)}
            />
            <PreviewSlider
              title="Light Intensity"
              min={0}
              max={3}
              step={0.05}
              value={settings.lightIntensity}
              onChange={value => updateProp('lightIntensity', value)}
            />
            <PreviewSlider
              title="Exposure"
              min={0.3}
              max={2}
              step={0.05}
              value={settings.exposure}
              onChange={value => updateProp('exposure', value)}
            />
            <PreviewSlider
              title="Shadows"
              min={0}
              max={1}
              step={0.05}
              value={settings.shadows}
              onChange={value => updateProp('shadows', value)}
            />
            <PreviewSwitch
              title="Follow Cursor"
              isChecked={settings.followCursor}
              onChange={value => updateProp('followCursor', value)}
            />
            <PreviewSwitch title="Grab" isChecked={settings.grab} onChange={value => updateProp('grab', value)} />
            <PreviewSwitch
              title="Intro"
              isChecked={settings.intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={ballpit} componentName="Ballpit" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default BallpitDemo;
