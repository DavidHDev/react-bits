import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box } from '@chakra-ui/react';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import logo from '../../assets/logos/react-bits-logo-small-black.svg';
import CodeExample from '../../components/code/CodeExample';
import useForceRerender from '../../hooks/useForceRerender';

import PropTable from '../../components/common/Preview/PropTable';

import MetallicPaint from '../../content/Animations/MetallicPaint/MetallicPaint';
import { metallicPaint } from '../../constants/code/Animations/metallicPaintCode';

const DEFAULT_PROPS = {
  seed: 42,
  scale: 4,
  refraction: 0.01,
  blur: 0.015,
  liquid: 0.75,
  speed: 0.3,
  brightness: 2,
  contrast: 0.5,
  angle: 0,
  fresnel: 1,
  lightColor: '#ffffff',
  darkColor: '#000000',
  patternSharpness: 1,
  waveAmplitude: 1,
  noiseScale: 0.5,
  chromaticSpread: 2,
  mouseAnimation: false,
  distortion: 1,
  contour: 0.2,
  tintColor: '#feb3ff'
};

const MetallicPaintDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    seed,
    scale,
    refraction,
    blur,
    liquid,
    speed,
    brightness,
    contrast,
    angle,
    fresnel,
    lightColor,
    darkColor,
    patternSharpness,
    waveAmplitude,
    noiseScale,
    chromaticSpread,
    mouseAnimation,
    distortion,
    contour,
    tintColor
  } = props;

  const [key, forceRerender] = useForceRerender();

  const propData = useMemo(
    () => [
      {
        name: 'imageSrc',
        type: 'string',
        default: 'none (required)',
        description: 'URL or path to the image used for the metallic paint effect. The image is processed internally.'
      },
      {
        name: 'seed',
        type: 'number',
        default: '42',
        description: 'Random seed for pattern generation. Different values create different pattern variations.'
      },
      {
        name: 'scale',
        type: 'number',
        default: '4',
        description: 'Scale of the metallic pattern. Higher values create more repetitions.'
      },
      {
        name: 'refraction',
        type: 'number',
        default: '0.01',
        description: 'Amount of chromatic aberration (color separation). Creates the rainbow edge effect.'
      },
      {
        name: 'blur',
        type: 'number',
        default: '0.015',
        description: 'Blur amount for the pattern transitions. Higher values create softer gradients.'
      },
      {
        name: 'liquid',
        type: 'number',
        default: '0.75',
        description: 'Amount of liquid/wavy animation applied to the pattern.'
      },
      {
        name: 'speed',
        type: 'number',
        default: '0.3',
        description: 'Animation speed multiplier. Set to 0 to disable animation.'
      },
      {
        name: 'brightness',
        type: 'number',
        default: '2',
        description: 'Overall brightness of the metallic effect. Values above 1 increase brightness.'
      },
      {
        name: 'contrast',
        type: 'number',
        default: '0.5',
        description: 'Color contrast of the effect. Higher values create more distinct light/dark areas.'
      },
      {
        name: 'angle',
        type: 'number',
        default: '0',
        description: 'Rotation angle of the pattern in degrees.'
      },
      {
        name: 'fresnel',
        type: 'number',
        default: '1',
        description: 'Fresnel effect intensity. Controls edge highlighting based on viewing angle.'
      },
      {
        name: 'lightColor',
        type: 'string',
        default: '#ffffff',
        description: 'Hex color for the bright/highlight areas of the metallic effect.'
      },
      {
        name: 'darkColor',
        type: 'string',
        default: '#000000',
        description: 'Hex color for the dark/shadow areas of the metallic effect.'
      },
      {
        name: 'patternSharpness',
        type: 'number',
        default: '1',
        description: 'Controls the sharpness of metallic band transitions. Higher = sharper edges.'
      },
      {
        name: 'waveAmplitude',
        type: 'number',
        default: '1',
        description: 'Intensity of the wave distortion effect.'
      },
      {
        name: 'noiseScale',
        type: 'number',
        default: '0.5',
        description: 'Scale of the noise pattern. Higher = more detailed noise.'
      },
      {
        name: 'chromaticSpread',
        type: 'number',
        default: '2',
        description: 'Multiplier for chromatic aberration spread between RGB channels.'
      },
      {
        name: 'mouseAnimation',
        type: 'boolean',
        default: 'false',
        description: 'When true, mouse position controls wave animation instead of auto-loop.'
      },
      {
        name: 'distortion',
        type: 'number',
        default: '1',
        description: 'Amount of noise-based distortion applied to the pattern flow (0-1).'
      },
      {
        name: 'contour',
        type: 'number',
        default: '0.2',
        description: 'Intensity of edge contour effect that warps the pattern along shape boundaries (0-1).'
      },
      {
        name: 'tintColor',
        type: 'string',
        default: '#feb3ff',
        description: 'Hex color for color burn tint effect. White = no tint.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={400} overflow="hidden">
            <MetallicPaint
              key={key}
              imageSrc={logo}
              seed={seed}
              scale={scale}
              refraction={refraction}
              blur={blur}
              liquid={liquid}
              speed={speed}
              brightness={brightness}
              contrast={contrast}
              angle={angle}
              fresnel={fresnel}
              lightColor={lightColor}
              darkColor={darkColor}
              patternSharpness={patternSharpness}
              waveAmplitude={waveAmplitude}
              noiseScale={noiseScale}
              chromaticSpread={chromaticSpread}
              mouseAnimation={mouseAnimation}
              distortion={distortion}
              contour={contour}
              tintColor={tintColor}
            />
          </Box>

          <Customize>
            <PreviewColorPickerCustom
              title="Tint Color"
              color={tintColor}
              onChange={val => {
                updateProp('tintColor', val);
                forceRerender();
              }}
            />
            <PreviewColorPickerCustom
              title="Dark Color"
              color={darkColor}
              onChange={val => {
                updateProp('darkColor', val);
                forceRerender();
              }}
            />
            <PreviewColorPickerCustom
              title="Light Color"
              color={lightColor}
              onChange={val => {
                updateProp('lightColor', val);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Seed"
              min={0}
              max={200}
              step={0.01}
              value={seed}
              onChange={val => {
                updateProp('seed', val);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Scale"
              min={0.5}
              max={5}
              step={0.1}
              value={scale}
              onChange={val => {
                updateProp('scale', val);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Refraction"
              min={0}
              max={0.1}
              step={0.001}
              value={refraction}
              onChange={val => {
                updateProp('refraction', val);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Blur"
              min={0}
              max={0.1}
              step={0.001}
              value={blur}
              onChange={val => {
                updateProp('blur', val);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={1}
              step={0.01}
              value={speed}
              onChange={val => {
                updateProp('speed', val);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Brightness"
              min={0.5}
              max={2}
              step={0.05}
              value={brightness}
              onChange={val => {
                updateProp('brightness', val);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Contrast"
              min={0.5}
              max={2}
              step={0.05}
              value={contrast}
              onChange={val => {
                updateProp('contrast', val);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Angle"
              min={-180}
              max={180}
              step={1}
              value={angle}
              onChange={val => {
                updateProp('angle', val);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Fresnel"
              min={0}
              max={3}
              step={0.1}
              value={fresnel}
              onChange={val => {
                updateProp('fresnel', val);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Pattern Sharpness"
              min={0.1}
              max={2}
              step={0.1}
              value={patternSharpness}
              onChange={val => {
                updateProp('patternSharpness', val);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Wave Amplitude"
              min={0}
              max={3}
              step={0.1}
              value={waveAmplitude}
              onChange={val => {
                updateProp('waveAmplitude', val);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Liquid"
              min={0}
              max={1}
              step={0.01}
              value={liquid}
              onChange={val => {
                updateProp('liquid', val);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Noise Scale"
              min={0.1}
              max={3}
              step={0.1}
              value={noiseScale}
              onChange={val => {
                updateProp('noiseScale', val);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Chromatic Spread"
              min={0}
              max={3}
              step={0.1}
              value={chromaticSpread}
              onChange={val => {
                updateProp('chromaticSpread', val);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Distortion"
              min={0}
              max={1}
              step={0.05}
              value={distortion}
              onChange={val => {
                updateProp('distortion', val);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Contour"
              min={0}
              max={1}
              step={0.05}
              value={contour}
              onChange={val => {
                updateProp('contour', val);
                forceRerender();
              }}
            />

            <PreviewSwitch
              title="Mouse Animation"
              isChecked={mouseAnimation}
              onChange={val => {
                updateProp('mouseAnimation', val);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={metallicPaint} componentName="MetallicPaint" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default MetallicPaintDemo;
