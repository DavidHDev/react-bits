import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Flex, Input, Text } from '@chakra-ui/react';

import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import CodeExample from '../../components/code/CodeExample';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import Customize from '../../components/common/Preview/Customize';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';

import SoftAurora from '../../content/Backgrounds/SoftAurora/SoftAurora';
import { softAurora } from '../../constants/code/Backgrounds/softAuroraCode';

const DEFAULT_PROPS = {
  speed: 0.6,
  scale: 1.5,
  brightness: 1.0,
  color1: '#f7f7f7',
  color2: '#e100ff',
  noiseFrequency: 2.5,
  noiseAmplitude: 1.0,
  bandHeight: 0.5,
  bandSpread: 1.0,
  octaveDecay: 0.1,
  layerOffset: 0,
  colorSpeed: 1.0,
  enableMouseInteraction: true,
  mouseInfluence: 0.25
};

const SoftAuroraDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    speed,
    scale,
    brightness,
    color1,
    color2,
    noiseFrequency,
    noiseAmplitude,
    bandHeight,
    bandSpread,
    octaveDecay,
    layerOffset,
    colorSpeed,
    enableMouseInteraction,
    mouseInfluence
  } = props;

  const propData = useMemo(
    () => [
      { name: 'speed', type: 'number', default: '0.6', description: 'Overall animation speed multiplier.' },
      { name: 'scale', type: 'number', default: '1.5', description: 'Scale of the noise pattern.' },
      { name: 'brightness', type: 'number', default: '1.0', description: 'Overall brightness multiplier.' },
      { name: 'color1', type: 'string', default: '"#f7f7f7"', description: 'Tint color for the first aurora layer.' },
      { name: 'color2', type: 'string', default: '"#e100ff"', description: 'Tint color for the second aurora layer.' },
      { name: 'noiseFrequency', type: 'number', default: '2.5', description: 'Base frequency of the Perlin noise.' },
      { name: 'noiseAmplitude', type: 'number', default: '1.0', description: 'Base amplitude of the Perlin noise.' },
      {
        name: 'bandHeight',
        type: 'number',
        default: '0.5',
        description: 'Vertical position of the aurora band (0-1).'
      },
      { name: 'bandSpread', type: 'number', default: '1.0', description: 'Vertical spread of the aurora glow.' },
      { name: 'octaveDecay', type: 'number', default: '0.1', description: 'Amplitude decay per noise octave.' },
      { name: 'layerOffset', type: 'number', default: '0', description: 'Time offset between the two aurora layers.' },
      { name: 'colorSpeed', type: 'number', default: '1.0', description: 'Speed of palette color shifting.' },
      {
        name: 'enableMouseInteraction',
        type: 'boolean',
        default: 'true',
        description: 'Enable cursor-reactive aurora offset.'
      },
      { name: 'mouseInfluence', type: 'number', default: '0.25', description: 'Strength of the mouse offset effect.' }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={600} overflow="hidden" p={0}>
            <SoftAurora
              speed={speed}
              scale={scale}
              brightness={brightness}
              color1={color1}
              color2={color2}
              noiseFrequency={noiseFrequency}
              noiseAmplitude={noiseAmplitude}
              bandHeight={bandHeight}
              bandSpread={bandSpread}
              octaveDecay={octaveDecay}
              layerOffset={layerOffset}
              colorSpeed={colorSpeed}
              enableMouseInteraction={enableMouseInteraction}
              mouseInfluence={mouseInfluence}
            />

            <BackgroundContent pillText="New Background" headline="A gentle glow to light your way!" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="soft-aurora"
              currentProps={{
                speed,
                scale,
                brightness,
                color1,
                color2,
                noiseFrequency,
                noiseAmplitude,
                bandHeight,
                bandSpread,
                octaveDecay,
                layerOffset,
                colorSpeed,
                enableMouseInteraction,
                mouseInfluence
              }}
              defaultProps={DEFAULT_PROPS}
            />
          </Flex>

          <Customize>
            <Flex gap={4} align="center" mt={4}>
              <Text fontSize="sm">Color 1</Text>
              <Input type="color" value={color1} onChange={e => updateProp('color1', e.target.value)} width="50px" />
              <Text fontSize="sm">Color 2</Text>
              <Input type="color" value={color2} onChange={e => updateProp('color2', e.target.value)} width="50px" />
            </Flex>

            <PreviewSlider
              min={0.1}
              max={5}
              step={0.1}
              title="Speed"
              value={speed}
              onChange={val => updateProp('speed', val)}
            />
            <PreviewSlider
              min={0.1}
              max={3}
              step={0.1}
              title="Scale"
              value={scale}
              onChange={val => updateProp('scale', val)}
            />
            <PreviewSlider
              min={0.1}
              max={3}
              step={0.1}
              title="Brightness"
              value={brightness}
              onChange={val => updateProp('brightness', val)}
            />
            <PreviewSlider
              min={0.5}
              max={10}
              step={0.5}
              title="Noise Frequency"
              value={noiseFrequency}
              onChange={val => updateProp('noiseFrequency', val)}
            />
            <PreviewSlider
              min={0.5}
              max={10}
              step={0.5}
              title="Noise Amplitude"
              value={noiseAmplitude}
              onChange={val => updateProp('noiseAmplitude', val)}
            />
            <PreviewSlider
              min={0}
              max={1}
              step={0.05}
              title="Band Height"
              value={bandHeight}
              onChange={val => updateProp('bandHeight', val)}
            />
            <PreviewSlider
              min={0.1}
              max={3}
              step={0.1}
              title="Band Spread"
              value={bandSpread}
              onChange={val => updateProp('bandSpread', val)}
            />
            <PreviewSlider
              min={0.01}
              max={0.5}
              step={0.01}
              title="Octave Decay"
              value={octaveDecay}
              onChange={val => updateProp('octaveDecay', val)}
            />
            <PreviewSlider
              min={0}
              max={1}
              step={0.05}
              title="Layer Offset"
              value={layerOffset}
              onChange={val => updateProp('layerOffset', val)}
            />
            <PreviewSlider
              min={0.1}
              max={5}
              step={0.1}
              title="Color Speed"
              value={colorSpeed}
              onChange={val => updateProp('colorSpeed', val)}
            />

            <PreviewSwitch
              title="Mouse Interaction"
              value={enableMouseInteraction}
              onChange={val => updateProp('enableMouseInteraction', val)}
            />
            {enableMouseInteraction && (
              <PreviewSlider
                min={0.1}
                max={1}
                step={0.05}
                title="Mouse Influence"
                value={mouseInfluence}
                onChange={val => updateProp('mouseInfluence', val)}
              />
            )}
          </Customize>
          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={softAurora} componentName="SoftAurora" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SoftAuroraDemo;
