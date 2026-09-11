import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Flex } from '@chakra-ui/react';

import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';

import PixelBlast from '../../content/Backgrounds/PixelBlast/PixelBlast';
import { pixelBlast } from '../../constants/code/Backgrounds/pixelBlastCode';

const DEFAULT_PROPS = {
  variant: 'square',
  pixelSize: 4,
  patternScale: 2,
  patternDensity: 1,
  pixelSizeJitter: 0,
  enableRipples: true,
  liquid: false,
  speed: 0.5,
  edgeFade: 0.25,
  color: '#B497CF'
};

const PixelBlastDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    variant,
    pixelSize,
    patternScale,
    patternDensity,
    pixelSizeJitter,
    enableRipples,
    liquid,
    speed,
    edgeFade,
    color
  } = props;
  const [key, forceRerender] = useForceRerender();

  const propData = useMemo(
    () => [
      {
        name: 'variant',
        type: "'square'|'circle'|'triangle'|'diamond'",
        default: "'square'",
        description: 'Pixel shape variant.'
      },
      {
        name: 'pixelSize',
        type: 'number',
        default: '3',
        description: 'Base pixel size (auto scaled for DPI).'
      },
      {
        name: 'color',
        type: 'string',
        default: "'#B497CF'",
        description: 'Pixel color.'
      },
      {
        name: 'patternScale',
        type: 'number',
        default: '2',
        description: 'Noise/pattern scale.'
      },
      {
        name: 'patternDensity',
        type: 'number',
        default: '1',
        description: 'Pattern density adjustment.'
      },
      {
        name: 'pixelSizeJitter',
        type: 'number',
        default: '0',
        description: 'Random jitter applied to coverage.'
      },
      {
        name: 'enableRipples',
        type: 'boolean',
        default: 'true',
        description: 'Enable click ripple waves.'
      },
      {
        name: 'rippleSpeed',
        type: 'number',
        default: '0.3',
        description: 'Ripple propagation speed.'
      },
      {
        name: 'rippleThickness',
        type: 'number',
        default: '0.1',
        description: 'Ripple ring thickness.'
      },
      {
        name: 'rippleIntensityScale',
        type: 'number',
        default: '1',
        description: 'Ripple intensity multiplier.'
      },
      {
        name: 'liquid',
        type: 'boolean',
        default: 'false',
        description: 'Enable liquid distortion effect.'
      },
      {
        name: 'liquidStrength',
        type: 'number',
        default: '0.1',
        description: 'Liquid distortion strength.'
      },
      {
        name: 'liquidRadius',
        type: 'number',
        default: '1',
        description: 'Liquid touch brush radius scale.'
      },
      {
        name: 'liquidWobbleSpeed',
        type: 'number',
        default: '4.5',
        description: 'Liquid wobble frequency.'
      },
      {
        name: 'speed',
        type: 'number',
        default: '0.5',
        description: 'Animation time scale.'
      },
      {
        name: 'edgeFade',
        type: 'number',
        default: '0.5',
        description: 'Edge fade distance (0-1).'
      },
      {
        name: 'noiseAmount',
        type: 'number',
        default: '0',
        description: 'Post noise amount.'
      },
      {
        name: 'transparent',
        type: 'boolean',
        default: 'true',
        description: 'Transparent background.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <PixelBlast
              key={key}
              variant={variant}
              pixelSize={pixelSize}
              color={color}
              patternScale={patternScale}
              patternDensity={patternDensity}
              pixelSizeJitter={pixelSizeJitter}
              enableRipples={enableRipples}
              liquid={liquid}
              speed={speed}
              edgeFade={edgeFade}
            />

            <BackgroundContent pillText="New Background" headline="It's dangerous to go alone! Take this." />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="pixel-blast"
              currentProps={{
                variant,
                pixelSize,
                color,
                patternScale,
                patternDensity,
                enableRipples,
                speed,
                transparent: true,
                edgeFade
              }}
              defaultProps={{
                variant: 'square',
                pixelSize: 3,
                color: '#B497CF',
                patternScale: 2,
                patternDensity: 1,
                enableRipples: true,
                rippleSpeed: 0.3,
                rippleThickness: 0.1,
                rippleIntensityScale: 1,
                speed: 0.5,
                transparent: true,
                edgeFade: 0.5
              }}
            />
          </Flex>

          <Customize onRerender={forceRerender}>
            <PreviewColorPickerCustom title="Color" color={color} onChange={val => updateProp('color', val)} />

            <PreviewSelect
              title="Variant"
              value={variant}
              onChange={val => updateProp('variant', val)}
              options={[
                { label: 'Square', value: 'square' },
                { label: 'Circle', value: 'circle' },
                { label: 'Triangle', value: 'triangle' },
                { label: 'Diamond', value: 'diamond' }
              ]}
            />

            <PreviewSlider
              title="Pixel Size"
              min={1}
              max={5}
              step={1}
              value={pixelSize}
              onChange={val => updateProp('pixelSize', val)}
            />

            <PreviewSlider
              title="Pattern Scale"
              min={0.25}
              max={8}
              step={0.25}
              value={patternScale}
              onChange={val => updateProp('patternScale', val)}
            />

            <PreviewSlider
              title="Pattern Density"
              min={0}
              max={2}
              step={0.05}
              value={patternDensity}
              onChange={val => updateProp('patternDensity', val)}
            />

            <PreviewSlider
              title="Pixel Jitter"
              min={0}
              max={2}
              step={0.05}
              value={pixelSizeJitter}
              onChange={val => updateProp('pixelSizeJitter', val)}
            />

            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={speed}
              onChange={val => updateProp('speed', val)}
            />

            <PreviewSlider
              title="Edge Fade"
              min={0}
              max={0.5}
              step={0.01}
              value={edgeFade}
              onChange={val => updateProp('edgeFade', val)}
            />

            <PreviewSwitch
              title="Ripples"
              isChecked={enableRipples}
              onChange={() => updateProp('enableRipples', !enableRipples)}
            />

            <PreviewSwitch title="Liquid" isChecked={liquid} onChange={() => updateProp('liquid', !liquid)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['three', 'postprocessing']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={pixelBlast} componentName="PixelBlast" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default PixelBlastDemo;
