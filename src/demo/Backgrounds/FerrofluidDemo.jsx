import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Flex } from '@chakra-ui/react';
import { useMemo } from 'react';

import useComponentProps from '../../hooks/useComponentProps';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import Dependencies from '../../components/code/Dependencies';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';

import { ferrofluid } from '../../constants/code/Backgrounds/ferrofluidCode';
import Ferrofluid from '../../ts-default/Backgrounds/Ferrofluid/Ferrofluid';

const DEFAULT_PROPS = {
  color1: '#ffffff',
  color2: '#ffffff',
  color3: '#ffffff',
  speed: 0.5,
  scale: 1.6,
  turbulence: 1,
  fluidity: 0.1,
  rimWidth: 0.2,
  sharpness: 2.5,
  shimmer: 1.5,
  glow: 2,
  flowDirection: 'down',
  mouseInteraction: true,
  mouseStrength: 1,
  mouseRadius: 0.35
};

const FerrofluidDemo = () => {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    color1,
    color2,
    color3,
    speed,
    scale,
    turbulence,
    fluidity,
    rimWidth,
    sharpness,
    shimmer,
    glow,
    flowDirection,
    mouseInteraction,
    mouseStrength,
    mouseRadius
  } = props;

  const colors = [color1, color2, color3];

  const propData = useMemo(
    () => [
      {
        name: 'colors',
        type: 'string[]',
        default: "['#4F46E5', '#06B6D4', '#E0F2FE']",
        description:
          'Array of hex colors (up to 8) used to tint the fluid rim. Colors are spread across the surface by height; a single color makes the whole effect uniform.'
      },
      {
        name: 'backgroundColor',
        type: 'string',
        default: "'#03010A'",
        description: 'Hex color of the background behind the fluid.'
      },
      {
        name: 'backgroundColor',
        type: 'string',
        default: "'#03010A'",
        description: 'Hex color of the background behind the fluid.'
      },
      {
        name: 'speed',
        type: 'number',
        default: '0.5',
        description: 'Multiplier for how fast the fluid churns and flows.'
      },
      {
        name: 'scale',
        type: 'number',
        default: '1.6',
        description: 'Overall feature size. Higher values zoom in for larger, fewer blobs.'
      },
      {
        name: 'turbulence',
        type: 'number',
        default: '1',
        description: 'Amount of domain distortion. Higher values create more chaotic, swirling motion.'
      },
      {
        name: 'fluidity',
        type: 'number',
        default: '0.1',
        description: 'Smoothness of the merge between the two fluid layers. Higher = softer, more liquid blending.'
      },
      {
        name: 'rimWidth',
        type: 'number',
        default: '0.2',
        description: 'Thickness of the glowing contour lines tracing the fluid surface.'
      },
      {
        name: 'sharpness',
        type: 'number',
        default: '2.5',
        description: 'Contrast of the rim highlights. Higher values give crisper, thinner edges.'
      },
      {
        name: 'shimmer',
        type: 'number',
        default: '1.5',
        description: 'Amount of fine grainy break-up applied to the rim. 0 = smooth lines.'
      },
      {
        name: 'glow',
        type: 'number',
        default: '2',
        description: 'Overall brightness multiplier of the rim highlights.'
      },
      {
        name: 'flowDirection',
        type: "'up' | 'down' | 'left' | 'right'",
        default: "'down'",
        description: 'Primary direction the fluid surface drifts.'
      },
      {
        name: 'opacity',
        type: 'number',
        default: '1',
        description: 'Overall alpha of the rendered canvas.'
      },
      {
        name: 'mouseInteraction',
        type: 'boolean',
        default: 'true',
        description: 'Enables a magnetic spike that rises and glows under the cursor.'
      },
      {
        name: 'mouseStrength',
        type: 'number',
        default: '1',
        description: 'Intensity of the magnetic cursor spike.'
      },
      {
        name: 'mouseRadius',
        type: 'number',
        default: '0.35',
        description: 'Falloff radius of the magnetic cursor spike.'
      },
      {
        name: 'mouseDampening',
        type: 'number',
        default: '0.15',
        description: 'Easing time constant (seconds) for the cursor to follow the pointer. 0 = immediate.'
      },
      {
        name: 'mixBlendMode',
        type: 'string',
        default: 'undefined',
        description: "CSS mix-blend-mode applied to the canvas (e.g. 'screen', 'lighten')."
      },
      {
        name: 'paused',
        type: 'boolean',
        default: 'false',
        description: 'If true, stops rendering updates (freezing the current frame).'
      },
      {
        name: 'dpr',
        type: 'number',
        default: 'window.devicePixelRatio',
        description: 'Overrides device pixel ratio; lower for performance, higher for sharpness.'
      },
      {
        name: 'className',
        type: 'string',
        default: '',
        description: 'Additional class names for the root container.'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider
      props={props}
      defaultProps={DEFAULT_PROPS}
      hasChanges={hasChanges}
      resetProps={resetProps}
      demoOnlyProps={['color1', 'color2', 'color3']}
      computedProps={{ colors }}
    >
      <TabsLayout>
        <PreviewTab>
          <Box
            position="relative"
            className="demo-container"
            h={500}
            p={0}
            overflow="hidden"
            bgGradient="linear(to-br, #0a0a1a, #1a0a2e, #0a0a1a)"
          >
            <Ferrofluid
              colors={colors}
              speed={speed}
              scale={scale}
              turbulence={turbulence}
              fluidity={fluidity}
              rimWidth={rimWidth}
              sharpness={sharpness}
              shimmer={shimmer}
              glow={glow}
              flowDirection={flowDirection}
              mouseInteraction={mouseInteraction}
              mouseStrength={mouseStrength}
              mouseRadius={mouseRadius}
            />

            <BackgroundContent pillText="New Background" headline="Bend the magnetic fluid" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="ferrofluid"
              currentProps={{
                colors,
                speed,
                scale,
                turbulence,
                fluidity,
                rimWidth,
                sharpness,
                shimmer,
                glow,
                flowDirection,
                mouseInteraction,
                mouseStrength,
                mouseRadius
              }}
              defaultProps={{
                colors: ['#4F46E5', '#06B6D4', '#E0F2FE'],
                speed: 0.5,
                scale: 1,
                turbulence: 1,
                fluidity: 0.1,
                rimWidth: 0.2,
                sharpness: 3,
                shimmer: 1,
                glow: 2,
                flowDirection: 'down',
                opacity: 1,
                mouseInteraction: true,
                mouseStrength: 1,
                mouseRadius: 0.3
              }}
            />
          </Flex>

          <Customize>
            <PreviewColorPickerCustom title="Color 1" color={color1} onChange={val => updateProp('color1', val)} />
            <PreviewColorPickerCustom title="Color 2" color={color2} onChange={val => updateProp('color2', val)} />
            <PreviewColorPickerCustom title="Color 3" color={color3} onChange={val => updateProp('color3', val)} />

            <PreviewSwitch
              title="Cursor Magnet"
              isChecked={mouseInteraction}
              onChange={val => updateProp('mouseInteraction', val)}
            />

            <PreviewSelect
              title="Flow Direction"
              options={[
                { value: 'down', label: 'Down' },
                { value: 'up', label: 'Up' },
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' }
              ]}
              value={flowDirection}
              onChange={val => updateProp('flowDirection', val)}
            />

            <PreviewSlider title="Speed" min={0} max={3} step={0.1} value={speed} onChange={v => updateProp('speed', v)} />
            <PreviewSlider title="Scale" min={0.3} max={3} step={0.1} value={scale} onChange={v => updateProp('scale', v)} />
            <PreviewSlider
              title="Turbulence"
              min={0}
              max={2}
              step={0.05}
              value={turbulence}
              onChange={v => updateProp('turbulence', v)}
            />
            <PreviewSlider
              title="Fluidity"
              min={0.02}
              max={0.5}
              step={0.01}
              value={fluidity}
              onChange={v => updateProp('fluidity', v)}
            />
            <PreviewSlider
              title="Rim Width"
              min={0.05}
              max={0.5}
              step={0.01}
              value={rimWidth}
              onChange={v => updateProp('rimWidth', v)}
            />
            <PreviewSlider
              title="Sharpness"
              min={1}
              max={6}
              step={0.1}
              value={sharpness}
              onChange={v => updateProp('sharpness', v)}
            />
            <PreviewSlider
              title="Shimmer"
              min={0}
              max={2}
              step={0.05}
              value={shimmer}
              onChange={v => updateProp('shimmer', v)}
            />
            <PreviewSlider title="Glow" min={0.5} max={5} step={0.1} value={glow} onChange={v => updateProp('glow', v)} />
            <PreviewSlider
              title="Cursor Strength"
              min={0}
              max={3}
              step={0.1}
              value={mouseStrength}
              onChange={v => updateProp('mouseStrength', v)}
            />
            <PreviewSlider
              title="Cursor Radius"
              min={0.05}
              max={1}
              step={0.05}
              value={mouseRadius}
              onChange={v => updateProp('mouseRadius', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={ferrofluid} componentName="Ferrofluid" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default FerrofluidDemo;
