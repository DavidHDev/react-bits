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

import MoltenMetal from '../../content/Backgrounds/MoltenMetal/MoltenMetal';
import { moltenMetal } from '../../constants/code/Backgrounds/moltenMetalCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/MoltenMetal';

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  drift: 0.3,
  intro: true,
  mouseInteraction: true,
  mouseStrength: 0.5,
  flareOnClick: true,
  paused: false
};

const COLOR_MODE_OPTIONS = [
  { value: 'molten', label: 'Molten' },
  { value: 'ember', label: 'Ember' },
  { value: 'frost', label: 'Frost' }
];

const propData = [
  {
    name: 'colors',
    type: 'string[]',
    default: "['#5227FF', '#FF9FFC']",
    description: 'Gradient the metal heats through, from the dim glow to the hot body. Up to five colors.'
  },
  {
    name: 'coreColor',
    type: 'string',
    default: "'#FFFFFF'",
    description: 'Color of the white-hot cores at the end of the gradient.'
  },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'transparent'",
    description: 'Fills the canvas behind the metal. Transparent lets the page show through.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description:
      'Draws the flow as colored ink for light pages. Pair it with mid-tone colors that deepen toward the core.'
  },
  { name: 'speed', type: 'number', default: '0.35', description: 'How fast the metal flows.' },
  { name: 'scale', type: 'number', default: '4', description: 'Zoom of the flow. Higher fits more of it on screen.' },
  {
    name: 'detail',
    type: 'number',
    default: '3',
    description: 'Layers of folded filaments, from 1 to 8. Fractions blend between layers.'
  },
  { name: 'glow', type: 'number', default: '1.6', description: 'How much heat the filaments carry.' },
  {
    name: 'thickness',
    type: 'number',
    default: '1',
    description: 'Width of the filaments and their white-hot cores.'
  },
  { name: 'swirl', type: 'number', default: '1', description: 'How tightly the flow spirals.' },
  { name: 'turbulence', type: 'number', default: '0.2', description: 'How strongly each layer folds the flow.' },
  {
    name: 'haze',
    type: 'number',
    default: '0.75',
    description: 'Soft glow between the filaments. 0 leaves only the filaments.'
  },
  { name: 'brightness', type: 'number', default: '1.3', description: 'Overall brightness.' },
  {
    name: 'colorMode',
    type: "'molten' | 'ember' | 'frost'",
    default: "'molten'",
    description: 'Balance of the gradient. Ember runs hotter, frost stays cooler.'
  },
  { name: 'rotation', type: 'number', default: '0', description: 'Rotation of the whole flow in degrees.' },
  {
    name: 'offsetX',
    type: 'number',
    default: '0',
    description: 'Moves the flow sideways, as a fraction of the width.'
  },
  {
    name: 'offsetY',
    type: 'number',
    default: '0',
    description: 'Moves the flow up or down, as a fraction of the height.'
  },
  {
    name: 'drift',
    type: 'number',
    default: '0.3',
    description: 'How far the flow drifts as the cursor moves. 0 keeps it still.'
  },
  { name: 'grain', type: 'number', default: '0.05', description: 'Film grain in the glow. 0 turns it off.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Ignites the metal from its hottest cores outward the first time it comes into view.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'The cursor heats the filaments it passes over, leaving a trail that slowly cools.'
  },
  { name: 'mouseStrength', type: 'number', default: '0.5', description: 'How hot the cursor runs.' },
  {
    name: 'flareOnClick',
    type: 'boolean',
    default: 'true',
    description: 'Clicking flares the nearby filaments white-hot before they cool back down.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the flow.' },
  { name: 'dpr', type: 'number', default: '2', description: 'Maximum device pixel ratio of the canvas.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

const MoltenMetalDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { colorMode } = useColorMode();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, ...settings } = props;

  const applyPreset = value => {
    updateProps({ ...presetProps(value, { light: colorMode === 'light' }), preset: value });
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
            <MoltenMetal key={key} {...settings} />
            <BackgroundContent pillText="New Background" headline="Molten violet caustics that flow like liquid." />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton backgroundId="molten-metal" currentProps={settings} defaultProps={DEFAULT_PROPS} />
          </Flex>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={settings.colors}
              min={1}
              max={5}
              onChange={value => updateProp('colors', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Core Color"
              color={settings.coreColor}
              onChange={value => updateProp('coreColor', value)}
            />
            <PreviewSelect
              title="Color Mode"
              options={COLOR_MODE_OPTIONS}
              value={settings.colorMode}
              onChange={value => updateProp('colorMode', value)}
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
              title="Scale"
              min={2}
              max={10}
              step={0.1}
              value={settings.scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Detail"
              min={1}
              max={8}
              step={0.1}
              value={settings.detail}
              onChange={value => updateProp('detail', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0.4}
              max={3}
              step={0.05}
              value={settings.glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={0.6}
              max={1.6}
              step={0.01}
              value={settings.thickness}
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Swirl"
              min={0}
              max={2}
              step={0.05}
              value={settings.swirl}
              onChange={value => updateProp('swirl', value)}
            />
            <PreviewSlider
              title="Turbulence"
              min={0.05}
              max={0.4}
              step={0.01}
              value={settings.turbulence}
              onChange={value => updateProp('turbulence', value)}
            />
            <PreviewSlider
              title="Haze"
              min={0}
              max={1}
              step={0.01}
              value={settings.haze}
              onChange={value => updateProp('haze', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.4}
              max={2.5}
              step={0.05}
              value={settings.brightness}
              onChange={value => updateProp('brightness', value)}
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
              title="Offset X"
              min={-0.5}
              max={0.5}
              step={0.01}
              value={settings.offsetX}
              onChange={value => updateProp('offsetX', value)}
            />
            <PreviewSlider
              title="Offset Y"
              min={-0.5}
              max={0.5}
              step={0.01}
              value={settings.offsetY}
              onChange={value => updateProp('offsetY', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.2}
              step={0.005}
              value={settings.grain}
              onChange={value => updateProp('grain', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.01}
              value={settings.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSlider
              title="Drift"
              min={0}
              max={1}
              step={0.01}
              value={settings.drift}
              isDisabled={!settings.mouseInteraction}
              onChange={value => updateProp('drift', value)}
            />
            <PreviewSlider
              title="Cursor Heat"
              min={0}
              max={1}
              step={0.01}
              value={settings.mouseStrength}
              isDisabled={!settings.mouseInteraction}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings.intro} onChange={value => updateProp('intro', value)} />
            <PreviewSwitch
              title="Cursor"
              isChecked={settings.mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch
              title="Flare on Click"
              isChecked={settings.flareOnClick}
              onChange={value => updateProp('flareOnClick', value)}
            />
            <PreviewSwitch
              title="Light Mode"
              isChecked={settings.lightMode}
              onChange={value => updateProp('lightMode', value)}
            />
            <PreviewSwitch title="Pause" isChecked={settings.paused} onChange={value => updateProp('paused', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={moltenMetal} componentName="MoltenMetal" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default MoltenMetalDemo;
