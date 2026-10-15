import { Box, Flex } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import Silk from '../../content/Backgrounds/Silk/Silk';
import { silkCode } from '../../constants/code/Backgrounds/silkCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/Silk';

const DEFAULT_PROPS = {
  preset: 'satin',
  ...LOOK,
  mouseInteraction: true,
  interactionStrength: 1,
  clickRipple: true,
  intro: true,
  fade: 0,
  lightMode: false
};

const propData = [
  { name: 'color', type: 'string', default: "'#7B7481'", description: 'Color of the silk.' },
  {
    name: 'sheenColor',
    type: 'string',
    default: "'#ffffff'",
    description: 'Tint of the glossy highlights, blended with the silk color.'
  },
  { name: 'speed', type: 'number', default: '5', description: 'How fast the folds flow.' },
  { name: 'scale', type: 'number', default: '1', description: 'Size of the folds. Higher values pack more in.' },
  { name: 'rotation', type: 'number', default: '0', description: 'Turns the folds, in radians.' },
  {
    name: 'noiseIntensity',
    type: 'number',
    default: '1.5',
    description: 'Strength of the fine grain over the fabric.'
  },
  {
    name: 'sheen',
    type: 'number',
    default: '0.5',
    description: 'Strength of the glossy highlights that run along the folds.'
  },
  {
    name: 'depth',
    type: 'number',
    default: '0.5',
    description: 'How deep the folds look, from flat at 0 to deep, shaded creases at 1.'
  },
  { name: 'glow', type: 'number', default: '0.3', description: 'Soft glow around the brightest folds.' },
  {
    name: 'ripple',
    type: 'number',
    default: '1',
    description: 'Strength of the fine ripples running through the folds. 0 smooths them out.'
  },
  { name: 'wave', type: 'number', default: '1', description: 'How much the folds sway as they flow.' },
  {
    name: 'variation',
    type: 'number',
    default: '0',
    description: 'Picks a different arrangement of folds. Any number works.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'The light turns to follow the cursor and the fabric drags along with it.'
  },
  {
    name: 'interactionStrength',
    type: 'number',
    default: '1',
    description: 'How strongly the cursor moves the fabric and its light.'
  },
  {
    name: 'clickRipple',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a ripple rolling through the fabric.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'The folds rise out of the dark and settle when the silk first appears.'
  },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws pale silk with white highlights for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const SilkDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { defaults: defaultProps }), preset: value });
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
          <Box position="relative" className="demo-container" h={500} overflow="hidden" p={0}>
            <Silk key={key} {...settings} />
            <BackgroundContent headline="Silk touch is a good enhancement, Steve!" />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="silk" currentProps={settings} defaultProps={LOOK} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={settings.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Sheen Color"
              color={settings.sheenColor}
              onChange={value => updateProp('sheenColor', value)}
            />
            <PreviewSlider
              title="Sheen"
              min={0}
              max={1.5}
              step={0.05}
              value={settings.sheen}
              onChange={value => updateProp('sheen', value)}
            />
            <PreviewSlider
              title="Depth"
              min={0}
              max={1}
              step={0.05}
              value={settings.depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={5}
              step={0.1}
              value={settings.noiseIntensity}
              onChange={value => updateProp('noiseIntensity', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={20}
              step={0.1}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.3}
              max={3}
              step={0.05}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={0}
              max={6.28}
              step={0.01}
              value={settings.rotation}
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Ripple"
              min={0}
              max={3}
              step={0.05}
              value={settings.ripple}
              onChange={value => updateProp('ripple', value)}
            />
            <PreviewSlider
              title="Wave"
              min={0}
              max={4}
              step={0.05}
              value={settings.wave}
              onChange={value => updateProp('wave', value)}
            />
            <PreviewSlider
              title="Variation"
              min={0}
              max={20}
              step={1}
              value={settings.variation}
              onChange={value => updateProp('variation', value)}
            />
            <PreviewSlider
              title="Interaction Strength"
              min={0}
              max={2}
              step={0.05}
              value={settings.interactionStrength}
              onChange={value => updateProp('interactionStrength', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={settings.fade}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Click Ripple"
              isChecked={settings.clickRipple}
              onChange={value => updateProp('clickRipple', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings.intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
            <PreviewSwitch
              title="Light Mode"
              isChecked={settings.lightMode}
              onChange={value => updateProp('lightMode', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={silkCode} componentName="Silk" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SilkDemo;
