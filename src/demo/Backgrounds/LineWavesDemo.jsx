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

import LineWaves from '../../content/Backgrounds/LineWaves/LineWaves';
import { lineWaves } from '../../constants/code/Backgrounds/lineWavesCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/LineWaves';

const DEFAULT_PROPS = {
  preset: 'silk',
  ...LOOK,
  edgeFade: 0,
  enableMouseInteraction: true,
  mouseInfluence: 2,
  clickRipple: true,
  intro: true,
  lightMode: false,
  opacity: 1
};

const propData = [
  { name: 'color1', type: 'string', default: "'#ffffff'", description: 'First color the lines blend through.' },
  { name: 'color2', type: 'string', default: "'#ffffff'", description: 'Second color the lines blend through.' },
  { name: 'color3', type: 'string', default: "'#ffffff'", description: 'Third color the lines blend through.' },
  {
    name: 'colorCycleSpeed',
    type: 'number',
    default: '1',
    description: 'How fast the colors drift across the lines. 0 keeps them in place.'
  },
  { name: 'speed', type: 'number', default: '0.3', description: 'How fast the waves flow. 0 freezes them.' },
  {
    name: 'lineCount',
    type: 'number',
    default: '72',
    description: 'Number of lines across the height of the container.'
  },
  { name: 'lineWidth', type: 'number', default: '1.3', description: 'Thickness of the lines, in px.' },
  { name: 'glow', type: 'number', default: '0.6', description: 'Strength of the soft glow around each line.' },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness of the lines.' },
  {
    name: 'highlight',
    type: 'number',
    default: '1',
    description:
      'Strength of the band of light that drifts through the lines, from 0 to 1. At 0 every line is lit evenly.'
  },
  {
    name: 'highlightWidth',
    type: 'number',
    default: '1',
    description: 'Width of the band of light. Higher values light more lines at once.'
  },
  { name: 'warpIntensity', type: 'number', default: '1', description: 'How strongly the lines bend into waves.' },
  {
    name: 'warpScale',
    type: 'number',
    default: '1',
    description: 'Size of the waves. Higher values give broad, sweeping curves.'
  },
  { name: 'rotation', type: 'number', default: '-33', description: 'Angle of the lines, in degrees.' },
  {
    name: 'edgeFade',
    type: 'number',
    default: '0',
    description: 'Fades the lines out toward the edges of the container, from 0 to 1.'
  },
  {
    name: 'enableMouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'The lines spread apart and light up around the cursor.'
  },
  {
    name: 'mouseInfluence',
    type: 'number',
    default: '2',
    description: 'How strongly the lines react to the cursor.'
  },
  {
    name: 'clickRipple',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a smooth wave rolling out through the lines.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'The lines draw in across the container on mount.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the lines as ink for light backgrounds. Colors turn into deeper inks of the same hue.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Overall opacity, from 0 to 1.' },
  {
    name: 'maxDevicePixelRatio',
    type: 'number',
    default: '2',
    description: 'Highest pixel ratio the canvas renders at.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const LineWavesDemo = () => {
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
            <LineWaves key={key} {...settings} />
            <BackgroundContent headline="Lines that flow like silk." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="line-waves" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color 1"
              color={settings.color1}
              onChange={value => updateProp('color1', value)}
            />
            <PreviewColorPickerCustom
              title="Color 2"
              color={settings.color2}
              onChange={value => updateProp('color2', value)}
            />
            <PreviewColorPickerCustom
              title="Color 3"
              color={settings.color3}
              onChange={value => updateProp('color3', value)}
            />
            <PreviewSlider
              title="Color Cycle Speed"
              min={0}
              max={5}
              step={0.1}
              value={settings.colorCycleSpeed}
              onChange={value => updateProp('colorCycleSpeed', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={1.5}
              step={0.01}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Line Count"
              min={12}
              max={160}
              step={1}
              value={settings.lineCount}
              onChange={value => updateProp('lineCount', value)}
            />
            <PreviewSlider
              title="Line Width"
              min={0.5}
              max={4}
              step={0.05}
              value={settings.lineWidth}
              valueUnit="px"
              onChange={value => updateProp('lineWidth', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={2}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.2}
              max={2}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Highlight"
              min={0}
              max={1}
              step={0.01}
              value={settings.highlight}
              onChange={value => updateProp('highlight', value)}
            />
            <PreviewSlider
              title="Highlight Width"
              min={0.4}
              max={3}
              step={0.05}
              value={settings.highlightWidth}
              onChange={value => updateProp('highlightWidth', value)}
            />
            <PreviewSlider
              title="Warp Intensity"
              min={0}
              max={2.5}
              step={0.05}
              value={settings.warpIntensity}
              onChange={value => updateProp('warpIntensity', value)}
            />
            <PreviewSlider
              title="Warp Scale"
              min={0.4}
              max={2.5}
              step={0.05}
              value={settings.warpScale}
              onChange={value => updateProp('warpScale', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={-180}
              max={180}
              step={1}
              value={settings.rotation}
              valueUnit="°"
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Edge Fade"
              min={0}
              max={1}
              step={0.01}
              value={settings.edgeFade}
              onChange={value => updateProp('edgeFade', value)}
            />
            <PreviewSlider
              title="Mouse Influence"
              min={0}
              max={3}
              step={0.05}
              value={settings.mouseInfluence}
              onChange={value => updateProp('mouseInfluence', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.01}
              value={settings.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings.enableMouseInteraction}
              onChange={value => updateProp('enableMouseInteraction', value)}
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
          <CodeExample codeObject={lineWaves} componentName="LineWaves" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default LineWavesDemo;
