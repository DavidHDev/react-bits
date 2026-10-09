import { Box, Flex } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import Iridescence from '../../content/Backgrounds/Iridescence/Iridescence';
import { iridescence } from '../../constants/code/Backgrounds/iridescenceCode';

const DEFAULT_PROPS = {
  preset: 'classic',
  color: '#8099cc',
  hueShift: 0,
  saturation: 1,
  brightness: 1.5,
  contrast: 1,
  speed: 1,
  scale: 1,
  detail: 8,
  warp: 1,
  rotation: 0,
  mouseReact: true,
  amplitude: 0.1,
  stir: 0.5,
  sheen: 0.3,
  clickSwirl: true,
  grain: 0,
  fade: 0
};

const PRESETS = {
  classic: {},
  pearl: { color: '#ffffff', saturation: 0.55, brightness: 1, contrast: 0.85, scale: 1.4 },
  chrome: { color: '#ffffff', saturation: 0, contrast: 2.2, brightness: 0.55, detail: 12 },
  graphite: { color: '#ffffff', saturation: 0, contrast: 3, brightness: 0.35, detail: 9, scale: 0.9 },
  oil: { color: '#ffffff', saturation: 1.4, brightness: 0.35, contrast: 2.2, detail: 12, scale: 1.3 }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'pearl', label: 'Pearl' },
  { value: 'chrome', label: 'Chrome' },
  { value: 'graphite', label: 'Graphite' },
  { value: 'oil', label: 'Oil' }
];

const propData = [
  {
    name: 'color',
    type: 'string | number[]',
    default: '[1, 1, 1]',
    description: 'Tint multiplied over the colors. Any CSS color, or an RGB array from 0 to 1.'
  },
  { name: 'hueShift', type: 'number', default: '0', description: 'Rotates the hues, in degrees.' },
  {
    name: 'saturation',
    type: 'number',
    default: '1',
    description: 'Color intensity. 0 gives a monochrome chrome look.'
  },
  { name: 'brightness', type: 'number', default: '1.5', description: 'Overall brightness.' },
  { name: 'contrast', type: 'number', default: '1', description: 'Contrast between the folds.' },
  { name: 'speed', type: 'number', default: '1', description: 'Animation speed. 0 holds the pattern still.' },
  {
    name: 'scale',
    type: 'number',
    default: '1',
    description: 'Size of the pattern. Higher values give broader folds.'
  },
  {
    name: 'detail',
    type: 'number',
    default: '8',
    description: 'How many layers of folds are stacked. Lower is softer, higher is more intricate.'
  },
  { name: 'warp', type: 'number', default: '1', description: 'How strongly the folds bend into each other.' },
  { name: 'rotation', type: 'number', default: '0', description: 'Rotation of the pattern in degrees.' },
  {
    name: 'mouseReact',
    type: 'boolean',
    default: 'true',
    description: 'Turns the pointer interactions on or off: parallax, stir and sheen.'
  },
  { name: 'amplitude', type: 'number', default: '0.1', description: 'How far the pattern drifts toward the pointer.' },
  {
    name: 'stir',
    type: 'number',
    default: '0.5',
    description: 'Drags the folds along with the pointer like a liquid. 0 turns it off.'
  },
  { name: 'sheen', type: 'number', default: '0.3', description: 'Brightens the surface softly around the pointer.' },
  {
    name: 'clickSwirl',
    type: 'boolean',
    default: 'true',
    description: 'Stirs a swirl into the surface wherever you click, which slowly unwinds.'
  },
  { name: 'grain', type: 'number', default: '0', description: 'Film grain over the surface, from 0 to 1.' },
  {
    name: 'fade',
    type: 'number',
    default: '0',
    description: 'Fades the edges into the page, from 0 to 1. The canvas is transparent where it fades.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'resolution',
    type: 'number',
    default: '1',
    description: 'Render scale. Lower values trade sharpness for speed on large screens.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const IridescenceDemo = () => {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(key => [key, defaultProps[key]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
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
            <Iridescence {...settings} />

            <BackgroundContent pillText="New Background" headline="Radiant iridescence with customizable colors" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="iridescence" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={props.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSlider
              title="Hue Shift"
              min={-180}
              max={180}
              step={1}
              value={props.hueShift}
              valueUnit="°"
              onChange={value => updateProp('hueShift', value)}
            />
            <PreviewSlider
              title="Saturation"
              min={0}
              max={2}
              step={0.05}
              value={props.saturation}
              onChange={value => updateProp('saturation', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.2}
              max={2.5}
              step={0.05}
              value={props.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Contrast"
              min={0.3}
              max={3}
              step={0.05}
              value={props.contrast}
              onChange={value => updateProp('contrast', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={props.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.3}
              max={3}
              step={0.05}
              value={props.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Detail"
              min={1}
              max={16}
              step={1}
              value={props.detail}
              onChange={value => updateProp('detail', value)}
            />
            <PreviewSlider
              title="Warp"
              min={0}
              max={2.5}
              step={0.05}
              value={props.warp}
              onChange={value => updateProp('warp', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={-180}
              max={180}
              step={1}
              value={props.rotation}
              valueUnit="°"
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSwitch
              title="Mouse React"
              isChecked={props.mouseReact}
              onChange={value => updateProp('mouseReact', value)}
            />
            <PreviewSlider
              title="Amplitude"
              min={0}
              max={0.5}
              step={0.01}
              value={props.amplitude}
              onChange={value => updateProp('amplitude', value)}
            />
            <PreviewSlider
              title="Stir"
              min={0}
              max={2}
              step={0.05}
              value={props.stir}
              onChange={value => updateProp('stir', value)}
            />
            <PreviewSlider
              title="Sheen"
              min={0}
              max={1}
              step={0.05}
              value={props.sheen}
              onChange={value => updateProp('sheen', value)}
            />
            <PreviewSwitch
              title="Click Swirl"
              isChecked={props.clickSwirl}
              onChange={value => updateProp('clickSwirl', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={1}
              step={0.05}
              value={props.grain}
              onChange={value => updateProp('grain', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={props.fade}
              onChange={value => updateProp('fade', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={iridescence} componentName="Iridescence" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default IridescenceDemo;
