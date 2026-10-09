import { useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';

import CodeExample from '../../components/code/CodeExample';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import PropTable from '../../components/common/Preview/PropTable';
import Customize from '../../components/common/Preview/Customize';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';

import Noise from '../../content/Animations/Noise/Noise';
import { noise } from '../../constants/code/Animations/noiseCode';

const PHOTO = 'https://images.unsplash.com/photo-1762846818262-33c197852fa8?w=1600&q=80&auto=format&fit=crop';

const SCENES = {
  photo: { background: `center / cover no-repeat url("${PHOTO}")` },
  studio: {
    background: 'radial-gradient(70% 90% at 50% 34%, #a29b92 0%, #7a746d 30%, #4b4743 62%, #262422 88%, #1c1b1a 100%)'
  },
  dark: { background: '#0b0b0d' },
  paper: { background: '#f3efe6' }
};

const DEFAULT_PROPS = {
  preset: 'film',
  scene: 'photo',
  opacity: 0.2,
  size: 1,
  fps: 24,
  blendMode: 'overlay',
  contrast: 0.6,
  colored: false,
  dust: 0,
  scratches: 0,
  scanlines: 0,
  flicker: 0
};

const PRESETS = {
  film: {},
  studio: { scene: 'studio', opacity: 0.15, fps: 18, blendMode: 'overlay', contrast: 0.5 },
  dust: { opacity: 0.16, fps: 18, dust: 0.55, scratches: 0.5, flicker: 0.25 },
  static: {
    scene: 'dark',
    opacity: 0.42,
    size: 2,
    fps: 30,
    blendMode: 'screen',
    contrast: 1,
    scanlines: 0.4,
    flicker: 0.35
  },
  paper: { scene: 'paper', opacity: 0.5, fps: 0, blendMode: 'soft-light', contrast: 0.3 }
};

const PRESET_OPTIONS = [
  { value: 'film', label: 'Film' },
  { value: 'studio', label: 'Studio' },
  { value: 'dust', label: 'Dust' },
  { value: 'static', label: 'Static' },
  { value: 'paper', label: 'Paper' }
];

const BLEND_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'difference', label: 'Difference' }
];

const NoiseDemo = () => {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { preset, scene, ...settings } = props;
  const look = SCENES[scene] ?? SCENES.photo;

  const applyPreset = value => {
    const base = Object.fromEntries(Object.keys(DEFAULT_PROPS).map(key => [key, DEFAULT_PROPS[key]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const propData = useMemo(
    () => [
      { name: 'opacity', type: 'number', default: '0.2', description: 'Strength of the grain, from 0 to 1.' },
      {
        name: 'size',
        type: 'number',
        default: '1',
        description: 'Size of each grain in CSS pixels. 0.5 is one device pixel on retina screens.'
      },
      {
        name: 'fps',
        type: 'number',
        default: '24',
        description: 'How many times per second the grain changes. 0 keeps it still, like a paper texture.'
      },
      {
        name: 'blendMode',
        type: "'normal' | 'overlay' | 'soft-light' | 'multiply' | 'screen' | 'difference'",
        default: "'overlay'",
        description:
          'How the grain mixes with what is underneath. Overlay and soft light add texture without graying the image.'
      },
      {
        name: 'contrast',
        type: 'number',
        default: '0.6',
        description: 'From soft, fine grain at 0 to harsh, punchy grain at 1.'
      },
      {
        name: 'dust',
        type: 'number',
        default: '0',
        description: 'Specks, hairs and fibers that flicker over the frame like dust on a film print, from 0 to 1.'
      },
      {
        name: 'scratches',
        type: 'number',
        default: '0',
        description: 'How often thin vertical scratches run down the frame for a few seconds, from 0 to 1.'
      },
      { name: 'colored', type: 'boolean', default: 'false', description: 'Uses colored grain instead of gray.' },
      {
        name: 'scanlines',
        type: 'number',
        default: '0',
        description: 'Adds rolling horizontal lines, like an old screen, from 0 to 1.'
      },
      {
        name: 'flicker',
        type: 'number',
        default: '0',
        description: 'Makes the grain strength jump a little every frame, like a film projector.'
      },
      {
        name: 'fixed',
        type: 'boolean',
        default: 'false',
        description: 'Covers the whole viewport instead of the nearest positioned parent.'
      },
      { name: 'zIndex', type: 'number', default: '-', description: 'Stacking order of the overlay.' },
      { name: 'className', type: 'string', default: "''", description: 'Extra class names for the overlay.' },
      { name: 'style', type: 'CSSProperties', default: '-', description: 'Inline styles for the overlay.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['preset', 'scene']}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            h={500}
            p={0}
            overflow="hidden"
            style={{ background: look.background }}
          >
            <Noise {...settings} />
          </Box>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={preset} onChange={applyPreset} />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.01}
              value={props.opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSlider
              title="Size"
              min={0.5}
              max={4}
              step={0.5}
              value={props.size}
              valueUnit="px"
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="FPS"
              min={0}
              max={60}
              step={1}
              value={props.fps}
              onChange={value => updateProp('fps', value)}
            />
            <PreviewSelect
              title="Blend"
              options={BLEND_OPTIONS}
              value={props.blendMode}
              onChange={value => updateProp('blendMode', value)}
            />
            <PreviewSlider
              title="Contrast"
              min={0}
              max={1}
              step={0.05}
              value={props.contrast}
              onChange={value => updateProp('contrast', value)}
            />
            <PreviewSlider
              title="Dust"
              min={0}
              max={1}
              step={0.05}
              value={props.dust}
              onChange={value => updateProp('dust', value)}
            />
            <PreviewSlider
              title="Scratches"
              min={0}
              max={1}
              step={0.05}
              value={props.scratches}
              onChange={value => updateProp('scratches', value)}
            />
            <PreviewSlider
              title="Scanlines"
              min={0}
              max={1}
              step={0.05}
              value={props.scanlines}
              onChange={value => updateProp('scanlines', value)}
            />
            <PreviewSlider
              title="Flicker"
              min={0}
              max={1}
              step={0.05}
              value={props.flicker}
              onChange={value => updateProp('flicker', value)}
            />
            <PreviewSwitch title="Colored" isChecked={props.colored} onChange={value => updateProp('colored', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={noise} componentName="Noise" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default NoiseDemo;
