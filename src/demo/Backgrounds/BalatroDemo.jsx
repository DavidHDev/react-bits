import { Box, Flex } from '@chakra-ui/react';

import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import RefreshButton from '../../components/common/Preview/RefreshButton';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import { useColorMode } from '../../components/setup/color-mode';

import Balatro from '../../content/Backgrounds/Balatro/Balatro';
import { balatro } from '../../constants/code/Backgrounds/balatroCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/Balatro';

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  mouseInteraction: true,
  clickSwirl: true,
  intro: true,
  lightMode: false
};

const propData = [
  { name: 'color1', type: 'string', default: "'#DE443B'", description: 'Main paint color.' },
  { name: 'color2', type: 'string', default: "'#006BB4'", description: 'Second paint color, swirled into the first.' },
  { name: 'color3', type: 'string', default: "'#162325'", description: 'Color of the gaps between the two paints.' },
  {
    name: 'contrast',
    type: 'number',
    default: '3.5',
    description: 'How sharply the paints separate. Lower values blend them into soft washes.'
  },
  { name: 'lighting', type: 'number', default: '0.4', description: 'Strength of the glossy highlights on the paint.' },
  {
    name: 'swirl',
    type: 'number',
    default: '0.25',
    description: 'How tightly the paint spirals around the center, from 0 to 1.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'How fast the paint flows. 0 freezes it.' },
  {
    name: 'rotationSpeed',
    type: 'number',
    default: '0',
    description: 'Turns the whole swirl continuously. Negative values turn it the other way.'
  },
  { name: 'scale', type: 'number', default: '1', description: 'Size of the paint shapes. Higher values zoom in.' },
  {
    name: 'detail',
    type: 'number',
    default: '5',
    description: 'How many times the paint folds over itself, from 1 to 8. Higher values add finer streaks.'
  },
  {
    name: 'offset',
    type: '[number, number]',
    default: '[0, 0]',
    description: 'Moves the center of the swirl, as a fraction of the container diagonal.'
  },
  {
    name: 'pixelSize',
    type: 'number',
    default: '1.5',
    description: 'Size of the pixels in CSS pixels. 0 renders it smooth.'
  },
  {
    name: 'crt',
    type: 'number',
    default: '0',
    description: 'Adds the scanlines and soft edge falloff of an old CRT screen, from 0 to 1.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'The cursor stirs the paint and steers the swirl.'
  },
  {
    name: 'mouseStrength',
    type: 'number',
    default: '1',
    description: 'How strongly the cursor drags the paint along.'
  },
  {
    name: 'clickSwirl',
    type: 'boolean',
    default: 'true',
    description: 'Clicking spins the paint into a whirlpool that slowly unwinds.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'The swirl spins into place on mount.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Lightens the gaps between the paints so it sits on light pages.'
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

const BalatroDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { colorMode } = useColorMode();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { light: colorMode === 'light', defaults: defaultProps }), preset: value });
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
            <Balatro key={key} {...settings} />
            <BackgroundContent headline="Swirling psychedelic colors, dealt straight from the deck." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="balatro" currentProps={settings} defaultProps={DEFAULT_PROPS} />
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
              title="Contrast"
              min={1}
              max={8}
              step={0.1}
              value={settings.contrast}
              onChange={value => updateProp('contrast', value)}
            />
            <PreviewSlider
              title="Lighting"
              min={0}
              max={1.2}
              step={0.05}
              value={settings.lighting}
              onChange={value => updateProp('lighting', value)}
            />
            <PreviewSlider
              title="Swirl"
              min={0}
              max={1}
              step={0.01}
              value={settings.swirl}
              onChange={value => updateProp('swirl', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={settings.speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Rotation Speed"
              min={-5}
              max={5}
              step={0.1}
              value={settings.rotationSpeed}
              onChange={value => updateProp('rotationSpeed', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.4}
              max={3}
              step={0.05}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
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
              title="Pixel Size"
              min={0}
              max={12}
              step={0.5}
              value={settings.pixelSize}
              onChange={value => updateProp('pixelSize', value)}
            />
            <PreviewSlider
              title="CRT"
              min={0}
              max={1}
              step={0.05}
              value={settings.crt}
              onChange={value => updateProp('crt', value)}
            />
            <PreviewSlider
              title="Mouse Strength"
              min={0}
              max={2}
              step={0.05}
              value={settings.mouseStrength}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Click Swirl"
              isChecked={settings.clickSwirl}
              onChange={value => updateProp('clickSwirl', value)}
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
          <CodeExample codeObject={balatro} componentName="Balatro" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default BalatroDemo;
