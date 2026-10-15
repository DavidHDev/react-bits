import { Box, Flex } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import LiquidChrome from '../../content/Backgrounds/LiquidChrome/LiquidChrome';
import { liquidChrome } from '../../constants/code/Backgrounds/liquidChromeCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/LiquidChrome';

const DEFAULT_PROPS = {
  preset: 'satin',
  ...LOOK,
  interactive: true,
  rippleStrength: 1,
  rippleSize: 1,
  tilt: 1,
  intro: true,
  lightMode: false
};

const propData = [
  {
    name: 'color',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color of the metal. White is polished chrome, warmer tones give gold or copper.'
  },
  { name: 'speed', type: 'number', default: '0.2', description: 'How fast the chrome flows. 0 freezes it.' },
  { name: 'amplitude', type: 'number', default: '0.3', description: 'How strongly the flow swirls and folds.' },
  { name: 'frequencyX', type: 'number', default: '3', description: 'How tightly the flow folds horizontally.' },
  { name: 'frequencyY', type: 'number', default: '3', description: 'How tightly the flow folds vertically.' },
  {
    name: 'detail',
    type: 'number',
    default: '4',
    description: 'Layers of swirl, from 1 to 8. Low values give smooth, heavy shapes, high values intricate ones.'
  },
  { name: 'thickness', type: 'number', default: '1', description: 'Width of the chrome ribbons.' },
  {
    name: 'depth',
    type: 'number',
    default: '1',
    description: 'How steeply the chrome rises from the surface. Higher values catch more reflections.'
  },
  {
    name: 'roughness',
    type: 'number',
    default: '0.3',
    description: 'Softens the reflections, from a sharp mirror at 0 to a soft, frosted sheen at 1.'
  },
  { name: 'exposure', type: 'number', default: '1', description: 'Brightness of the reflections.' },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description:
      'The cursor leaves a wake in the liquid, clicks send ripples out and the reflections follow the cursor.'
  },
  { name: 'rippleStrength', type: 'number', default: '1', description: 'How visible the wake and ripples are.' },
  { name: 'rippleSize', type: 'number', default: '1', description: 'Size of the wake and ripples.' },
  {
    name: 'tilt',
    type: 'number',
    default: '1',
    description: 'How much the reflections sway and turn toward the cursor. 0 keeps the light still.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'The chrome rises from the surface when it mounts.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Lights the chrome for light pages, with soft gray contours instead of a dark studio.'
  },
  {
    name: 'maxDevicePixelRatio',
    type: 'number',
    default: '2',
    description: 'Highest pixel ratio the canvas renders at.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const LiquidChromeDemo = () => {
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
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <LiquidChrome key={key} {...settings} />
            <BackgroundContent headline="Swirl through a pool of liquid chrome." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="liquid-chrome" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={settings.color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={1}
              step={0.01}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Amplitude"
              min={0}
              max={0.8}
              step={0.01}
              value={settings.amplitude}
              onChange={value => updateProp('amplitude', value)}
            />
            <PreviewSlider
              title="Frequency X"
              min={0.5}
              max={8}
              step={0.1}
              value={settings.frequencyX}
              onChange={value => updateProp('frequencyX', value)}
            />
            <PreviewSlider
              title="Frequency Y"
              min={0.5}
              max={8}
              step={0.1}
              value={settings.frequencyY}
              onChange={value => updateProp('frequencyY', value)}
            />
            <PreviewSlider
              title="Detail"
              min={1}
              max={8}
              step={1}
              value={settings.detail}
              onChange={value => updateProp('detail', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={0.3}
              max={2.5}
              step={0.05}
              value={settings.thickness}
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Depth"
              min={0.3}
              max={2}
              step={0.05}
              value={settings.depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Roughness"
              min={0}
              max={1}
              step={0.01}
              value={settings.roughness}
              onChange={value => updateProp('roughness', value)}
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
              title="Ripple Strength"
              min={0}
              max={3}
              step={0.05}
              value={settings.rippleStrength}
              onChange={value => updateProp('rippleStrength', value)}
            />
            <PreviewSlider
              title="Ripple Size"
              min={0.3}
              max={3}
              step={0.05}
              value={settings.rippleSize}
              onChange={value => updateProp('rippleSize', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={2}
              step={0.05}
              value={settings.tilt}
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSwitch
              title="Interactive"
              isChecked={settings.interactive}
              onChange={value => updateProp('interactive', value)}
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
          <CodeExample codeObject={liquidChrome} componentName="LiquidChrome" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default LiquidChromeDemo;
