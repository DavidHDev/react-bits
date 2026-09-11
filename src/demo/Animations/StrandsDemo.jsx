import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box } from '@chakra-ui/react';

import CodeExample from '../../components/code/CodeExample';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';

import { strands } from '../../constants/code/Animations/strandsCode';
import Strands from '../../content/Animations/Strands/Strands';

const DEFAULT_PROPS = {
  color1: '#F97316',
  color2: '#7C3AED',
  color3: '#06B6D4',
  count: 3,
  speed: 0.5,
  amplitude: 1,
  waviness: 1,
  thickness: 0.7,
  glow: 2.6,
  taper: 3,
  spread: 1,
  hueShift: 0,
  intensity: 0.6,
  saturation: 2,
  opacity: 1,
  scale: 1.5,
  glass: false,
  refraction: 1,
  dispersion: 1,
  glassSize: 1
};

const StrandsDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    color1,
    color2,
    color3,
    count,
    speed,
    amplitude,
    waviness,
    thickness,
    glow,
    taper,
    spread,
    hueShift,
    intensity,
    saturation,
    opacity,
    scale,
    glass,
    refraction,
    dispersion,
    glassSize
  } = props;
  const colors = [color1, color2, color3];
  const propData = useMemo(
    () => [
      {
        name: 'colors',
        type: 'string[]',
        default: '["#FF4242", "#7C3AED", "#06B6D4", "#EAB308"]',
        description: 'Palette of hex colors cycled across the strands. Pass an empty array to use the built-in rainbow spectrum.'
      },
      {
        name: 'count',
        type: 'number',
        default: '3',
        description: 'Number of strands woven through the animation.'
      },
      {
        name: 'speed',
        type: 'number',
        default: '0.5',
        description: 'How quickly the strands ripple and flow.'
      },
      {
        name: 'amplitude',
        type: 'number',
        default: '1',
        description: 'Vertical reach of each strand as it waves up and down.'
      },
      {
        name: 'waviness',
        type: 'number',
        default: '1',
        description: 'Density of the curves along each strand.'
      },
      {
        name: 'thickness',
        type: 'number',
        default: '0.7',
        description: 'Width of each glowing strand.'
      },
      {
        name: 'glow',
        type: 'number',
        default: '2.6',
        description: 'Strength of the luminous bloom around the strands.'
      },
      {
        name: 'taper',
        type: 'number',
        default: '3',
        description: 'How sharply the strands fade out toward the edges.'
      },
      {
        name: 'spread',
        type: 'number',
        default: '1',
        description: 'Separation between strands so they fan out instead of overlapping.'
      },
      {
        name: 'hueShift',
        type: 'number',
        default: '0',
        description: 'Rotates the colors around the strands for variation.'
      },
      {
        name: 'intensity',
        type: 'number',
        default: '0.6',
        description: 'Overall brightness and energy of the effect.'
      },
      {
        name: 'saturation',
        type: 'number',
        default: '1.5',
        description: 'Vibrance of the colors. Above 1 makes them more intense, below 1 fades to grayscale.'
      },
      {
        name: 'opacity',
        type: 'number',
        default: '1',
        description: 'Overall transparency of the rendered strands.'
      },
      {
        name: 'scale',
        type: 'number',
        default: '1.5',
        description: 'Zooms the whole effect in or out to make the strands bigger or smaller.'
      },
      {
        name: 'glass',
        type: 'boolean',
        default: 'false',
        description: 'Renders the strands inside a refractive glass ball.'
      },
      {
        name: 'refraction',
        type: 'number',
        default: '1',
        description: 'How strongly the glass ball bends the light passing through it.'
      },
      {
        name: 'dispersion',
        type: 'number',
        default: '1',
        description: 'Amount of rainbow color separation along the edges of the glass ball.'
      },
      {
        name: 'glassSize',
        type: 'number',
        default: '1',
        description: 'Size of the glass ball relative to the canvas.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges}
      demoOnlyProps={['color1', 'color2', 'color3', 'color4']}
      computedProps={{ colors }}
    >
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <Strands
              colors={colors}
              count={count}
              speed={speed}
              amplitude={amplitude}
              waviness={waviness}
              thickness={thickness}
              glow={glow}
              taper={taper}
              spread={spread}
              hueShift={hueShift}
              intensity={intensity}
              saturation={saturation}
              opacity={opacity}
              scale={scale}
              glass={glass}
              refraction={refraction}
              dispersion={dispersion}
              glassSize={glassSize}
            />          </Box>

          <Customize className="preview-options">
            <PreviewColorPickerCustom title="Color 1" color={color1} onChange={val => updateProp('color1', val)} />
            <PreviewColorPickerCustom title="Color 2" color={color2} onChange={val => updateProp('color2', val)} />
            <PreviewColorPickerCustom title="Color 3" color={color3} onChange={val => updateProp('color3', val)} />

            <PreviewSlider
              title="Count"
              min={1}
              max={10}
              step={1}
              value={count}
              onChange={val => updateProp('count', val)}
              width={150}
            />

            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.1}
              value={speed}
              onChange={val => updateProp('speed', val)}
              width={150}
            />

            <PreviewSlider
              title="Amplitude"
              min={0}
              max={3}
              step={0.1}
              value={amplitude}
              onChange={val => updateProp('amplitude', val)}
              width={150}
            />

            <PreviewSlider
              title="Waviness"
              min={0.2}
              max={3}
              step={0.1}
              value={waviness}
              onChange={val => updateProp('waviness', val)}
              width={150}
            />

            <PreviewSlider
              title="Thickness"
              min={0.2}
              max={4}
              step={0.1}
              value={thickness}
              onChange={val => updateProp('thickness', val)}
              width={150}
            />

            <PreviewSlider
              title="Glow"
              min={0.3}
              max={3}
              step={0.05}
              value={glow}
              onChange={val => updateProp('glow', val)}
              width={150}
            />

            <PreviewSlider
              title="Taper"
              min={0.5}
              max={6}
              step={0.1}
              value={taper}
              onChange={val => updateProp('taper', val)}
              width={150}
            />

            <PreviewSlider
              title="Spread"
              min={0}
              max={3}
              step={0.1}
              value={spread}
              onChange={val => updateProp('spread', val)}
              width={150}
            />

            <PreviewSlider
              title="Hue Shift"
              min={0}
              max={1}
              step={0.01}
              value={hueShift}
              onChange={val => updateProp('hueShift', val)}
              width={150}
            />

            <PreviewSlider
              title="Intensity"
              min={0}
              max={1}
              step={0.05}
              value={intensity}
              onChange={val => updateProp('intensity', val)}
              width={150}
            />

            <PreviewSlider
              title="Saturation"
              min={0}
              max={2}
              step={0.05}
              value={saturation}
              onChange={val => updateProp('saturation', val)}
              width={150}
            />

            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.05}
              value={opacity}
              onChange={val => updateProp('opacity', val)}
              width={150}
            />

            <PreviewSlider
              title="Scale"
              min={0.3}
              max={3}
              step={0.1}
              value={scale}
              onChange={val => updateProp('scale', val)}
              width={150}
            />

            <PreviewSwitch
              title="Glass Ball"
              isChecked={glass}
              onChange={val => updateProp('glass', val)}
            />

            <PreviewSlider
              title="Refraction"
              min={0}
              max={3}
              step={0.05}
              value={refraction}
              isDisabled={!glass}
              onChange={val => updateProp('refraction', val)}
              width={150}
            />

            <PreviewSlider
              title="Dispersion"
              min={0}
              max={4}
              step={0.05}
              value={dispersion}
              isDisabled={!glass}
              onChange={val => updateProp('dispersion', val)}
              width={150}
            />

            <PreviewSlider
              title="Glass Size"
              min={0.3}
              max={1}
              step={0.01}
              value={glassSize}
              isDisabled={!glass}
              onChange={val => updateProp('glassSize', val)}
              width={150}
            />
          </Customize>
          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={strands} componentName="Strands" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default StrandsDemo;
