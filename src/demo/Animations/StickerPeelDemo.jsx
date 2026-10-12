import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';
import PropTable from '../../components/common/Preview/PropTable';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import RefreshButton from '../../components/common/Preview/RefreshButton';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import reactBits from '../../assets/logos/react-bits-sticker.png';
import github from '../../assets/stickers/github.webp';
import tailwind from '../../assets/stickers/tailwind.webp';
import openai from '../../assets/stickers/openai.webp';
import apple from '../../assets/stickers/apple.webp';
import vite from '../../assets/stickers/vite.webp';
import StickerPeel from '../../content/Animations/StickerPeel/StickerPeel';
import { stickerPeel } from '../../constants/code/Animations/stickerPeelCode';

const STICKERS = { reactBits, github, tailwind, openai, apple, vite };

const STICKER_OPTIONS = [
  { value: 'reactBits', label: 'React Bits' },
  { value: 'github', label: 'GitHub' },
  { value: 'tailwind', label: 'Tailwind' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'apple', label: 'Apple' },
  { value: 'vite', label: 'Vite' }
];

const LOOK = {
  finish: 'gloss',
  width: 200,
  rotate: 0,
  peelDirection: 0,
  peelBackHoverPct: 25,
  peelBackActivePct: 40,
  curlRadius: 12,
  backColor: '#d4d4d8',
  lightingIntensity: 0.5,
  shadowIntensity: 0.6,
  followPointer: true,
  swing: 1,
  friction: 0.5,
  bounce: 0.35
};

const DEFAULT_PROPS = {
  preset: 'signature',
  sticker: 'reactBits',
  ...LOOK,
  draggable: true,
  intro: true
};

const PRESETS = {
  signature: { ...LOOK, sticker: 'reactBits' },
  classic: { ...LOOK, sticker: 'reactBits', followPointer: false, peelBackHoverPct: 30 },
  holo: { ...LOOK, sticker: 'apple', finish: 'holo', lightingIntensity: 0.8, width: 180 },
  matte: {
    ...LOOK,
    sticker: 'github',
    finish: 'matte',
    backColor: '#f4f4f5',
    lightingIntensity: 0.3,
    shadowIntensity: 0.45
  },
  vinyl: {
    ...LOOK,
    sticker: 'tailwind',
    width: 240,
    curlRadius: 24,
    peelBackActivePct: 50,
    swing: 0.6,
    friction: 0.75,
    shadowIntensity: 0.75
  },
  paper: {
    ...LOOK,
    sticker: 'openai',
    finish: 'matte',
    curlRadius: 6,
    backColor: '#fafafa',
    swing: 1.6,
    friction: 0.35
  },
  bouncy: { ...LOOK, sticker: 'vite', rotate: -8, friction: 0.12, bounce: 0.85, swing: 1.4 }
};

const PRESET_OPTIONS = [
  { value: 'signature', label: 'Signature' },
  { value: 'classic', label: 'Classic' },
  { value: 'holo', label: 'Holo' },
  { value: 'matte', label: 'Matte' },
  { value: 'vinyl', label: 'Thick Vinyl' },
  { value: 'paper', label: 'Paper' },
  { value: 'bouncy', label: 'Bouncy' }
];

const FINISH_OPTIONS = [
  { value: 'gloss', label: 'Gloss' },
  { value: 'matte', label: 'Matte' },
  { value: 'holo', label: 'Holo' }
];

const propData = [
  {
    name: 'imageSrc',
    type: 'string',
    default: 'required',
    description: 'Sticker image. Use a PNG with a transparent background so the die-cut outline shows.'
  },
  { name: 'width', type: 'number', default: '200', description: 'Width of the sticker in pixels.' },
  { name: 'rotate', type: 'number', default: '0', description: 'Resting rotation of the sticker in degrees.' },
  {
    name: 'finish',
    type: "'gloss' | 'matte' | 'holo'",
    default: "'gloss'",
    description: 'Surface of the sticker. Holo turns light areas into foil with rainbow bands and glitter.'
  },
  {
    name: 'peelBackHoverPct',
    type: 'number',
    default: '25',
    description: 'How far the sticker peels back on hover, as a percentage of its size.'
  },
  {
    name: 'peelBackActivePct',
    type: 'number',
    default: '40',
    description: 'How far the sticker peels back while pressed or dragged.'
  },
  {
    name: 'peelDirection',
    type: 'number',
    default: '0',
    description:
      'Edge that peels, in degrees clockwise from the top. With followPointer it is used when the cursor is near the middle.'
  },
  {
    name: 'followPointer',
    type: 'boolean',
    default: 'true',
    description: 'Peels the edge or corner nearest the cursor, and the edge you grab while dragging.'
  },
  {
    name: 'curlRadius',
    type: 'number',
    default: '12',
    description: 'Radius of the curl where the sticker bends, in pixels. Larger values feel like thicker vinyl.'
  },
  {
    name: 'backColor',
    type: 'string',
    default: "'#d4d4d8'",
    description: 'Color of the back of the sticker, seen on the peeled part.'
  },
  {
    name: 'lightingIntensity',
    type: 'number',
    default: '0.5',
    description: 'Strength of the highlights that follow the cursor, from 0 to 1.'
  },
  {
    name: 'shadowIntensity',
    type: 'number',
    default: '0.6',
    description: 'Strength of the shadows under the sticker and the peeled part, from 0 to 1.'
  },
  {
    name: 'draggable',
    type: 'boolean',
    default: 'true',
    description: 'Lets the sticker be picked up, dragged and thrown around its parent.'
  },
  {
    name: 'swing',
    type: 'number',
    default: '1',
    description: 'How much the sticker swings around the point you hold while dragging, from 0 to 3.'
  },
  {
    name: 'friction',
    type: 'number',
    default: '0.5',
    description: 'How quickly a thrown sticker slides to a stop, from 0 (ice) to 1 (felt).'
  },
  {
    name: 'bounce',
    type: 'number',
    default: '0.35',
    description: 'How much of its speed a thrown sticker keeps when it hits the edge of its parent.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Drops the sticker onto the surface on mount and smooths its corner down.'
  },
  {
    name: 'initialPosition',
    type: "'center' | { x: number; y: number }",
    default: "'center'",
    description: 'Starting position. An object offsets the sticker from the center of its parent, in pixels.'
  },
  {
    name: 'onDragStart',
    type: '() => void',
    default: '-',
    description: 'Called when the sticker starts being dragged.'
  },
  { name: 'onDragEnd', type: '() => void', default: '-', description: 'Called when the sticker is released.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root element.' },
  { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the root element.' }
];

const StickerPeelDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, sticker, ...settings } = props;
  const imageSrc = STICKERS[sticker] || reactBits;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps[name]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'sticker']}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <StickerPeel key={key} imageSrc={imageSrc} {...settings} />
            <RefreshButton onClick={forceRerender} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSelect
              title="Sticker"
              options={STICKER_OPTIONS}
              value={sticker}
              onChange={value => updateProp('sticker', value)}
            />
            <PreviewSelect
              title="Finish"
              options={FINISH_OPTIONS}
              value={settings.finish}
              onChange={value => updateProp('finish', value)}
            />
            <PreviewColorPickerCustom
              title="Back Color"
              color={settings.backColor}
              onChange={value => updateProp('backColor', value)}
            />
            <PreviewSlider
              title="Width"
              min={100}
              max={320}
              step={5}
              value={settings.width}
              valueUnit="px"
              onChange={value => updateProp('width', value)}
            />
            <PreviewSlider
              title="Rotate"
              min={-45}
              max={45}
              step={1}
              value={settings.rotate}
              valueUnit="°"
              onChange={value => updateProp('rotate', value)}
            />
            <PreviewSlider
              title="Peel Direction"
              min={0}
              max={360}
              step={1}
              value={settings.peelDirection}
              valueUnit="°"
              onChange={value => updateProp('peelDirection', value)}
            />
            <PreviewSlider
              title="Hover Peel"
              min={0}
              max={60}
              step={1}
              value={settings.peelBackHoverPct}
              valueUnit="%"
              onChange={value => updateProp('peelBackHoverPct', value)}
            />
            <PreviewSlider
              title="Press Peel"
              min={0}
              max={80}
              step={1}
              value={settings.peelBackActivePct}
              valueUnit="%"
              onChange={value => updateProp('peelBackActivePct', value)}
            />
            <PreviewSlider
              title="Curl Radius"
              min={4}
              max={32}
              step={1}
              value={settings.curlRadius}
              valueUnit="px"
              onChange={value => updateProp('curlRadius', value)}
            />
            <PreviewSlider
              title="Lighting"
              min={0}
              max={1}
              step={0.01}
              value={settings.lightingIntensity}
              onChange={value => updateProp('lightingIntensity', value)}
            />
            <PreviewSlider
              title="Shadow"
              min={0}
              max={1}
              step={0.01}
              value={settings.shadowIntensity}
              onChange={value => updateProp('shadowIntensity', value)}
            />
            <PreviewSlider
              title="Swing"
              min={0}
              max={3}
              step={0.05}
              value={settings.swing}
              isDisabled={!settings.draggable}
              onChange={value => updateProp('swing', value)}
            />
            <PreviewSlider
              title="Friction"
              min={0}
              max={1}
              step={0.01}
              value={settings.friction}
              isDisabled={!settings.draggable}
              onChange={value => updateProp('friction', value)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={1}
              step={0.01}
              value={settings.bounce}
              isDisabled={!settings.draggable}
              onChange={value => updateProp('bounce', value)}
            />
            <PreviewSwitch
              title="Follow Pointer"
              isChecked={settings.followPointer}
              onChange={value => updateProp('followPointer', value)}
            />
            <PreviewSwitch
              title="Draggable"
              isChecked={settings.draggable}
              onChange={value => updateProp('draggable', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings.intro} onChange={value => updateProp('intro', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={stickerPeel} componentName="StickerPeel" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default StickerPeelDemo;
