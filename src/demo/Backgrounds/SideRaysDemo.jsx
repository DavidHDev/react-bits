import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Flex } from '@chakra-ui/react';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import Dependencies from '../../components/code/Dependencies';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import { sideRays } from '../../constants/code/Backgrounds/sideRaysCode';
import SideRays from '../../content/Backgrounds/SideRays/SideRays';

const DEFAULT_PROPS = {
  speed: 2.5,
  rayColor1: '#EAB308',
  rayColor2: '#96c8ff',
  intensity: 2,
  spread: 2,
  origin: 'top-right',
  tilt: 0,
  saturation: 1.5,
  blend: 0.75,
  falloff: 1.6,
  opacity: 1.0
};

const SideRaysDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { speed, rayColor1, rayColor2, intensity, spread, origin, tilt, saturation, blend, falloff, opacity } = props;

  const originOptions = [
    { value: 'top-right', label: 'Top Right' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-left', label: 'Bottom Left' }
  ];

  const propData = useMemo(
    () => [
      {
        name: 'speed',
        type: 'number',
        default: '2.5',
        description: 'Animation speed of the rays'
      },
      {
        name: 'rayColor1',
        type: 'string',
        default: '"#EAB308"',
        description: 'Color of the first ray layer in hex format'
      },
      {
        name: 'rayColor2',
        type: 'string',
        default: '"#96c8ff"',
        description: 'Color of the second ray layer in hex format'
      },
      {
        name: 'intensity',
        type: 'number',
        default: '2',
        description: 'Overall brightness of the rays'
      },
      {
        name: 'spread',
        type: 'number',
        default: '2',
        description: 'Angular width of the ray fan — higher values create a wider spread between the two ray layers'
      },
      {
        name: 'origin',
        type: '"top-right" | "top-left" | "bottom-right" | "bottom-left"',
        default: '"top-right"',
        description: 'Corner of the canvas from which the rays emerge'
      },
      {
        name: 'tilt',
        type: 'number',
        default: '0',
        description: 'Rotation of the ray fan in degrees — positive values tilt clockwise'
      },
      {
        name: 'saturation',
        type: 'number',
        default: '1.5',
        description: 'Color saturation of the rays — 0 renders in grayscale, values above 1 boost color'
      },
      {
        name: 'blend',
        type: 'number',
        default: '0.75',
        description: 'Balance between the two ray layers — 0 is all ray 1, 1 is all ray 2'
      },
      {
        name: 'falloff',
        type: 'number',
        default: '1.6',
        description: 'How steeply brightness diminishes with distance from the source — higher = tighter glow'
      },
      {
        name: 'opacity',
        type: 'number',
        default: '1.0',
        description: 'Overall opacity of the effect'
      },
      {
        name: 'className',
        type: 'string',
        default: '""',
        description: 'Additional CSS classes to apply to the container'
      }
    ],
    []
  );

  return (
    <ComponentPropsProvider props={props} defaultProps={DEFAULT_PROPS} resetProps={resetProps} hasChanges={hasChanges}>
      <TabsLayout>
        <PreviewTab>
          <Box position="relative" className="demo-container" h={500} p={0} overflow="hidden">
            <SideRays
              key={key}
              speed={speed}
              rayColor1={rayColor1}
              rayColor2={rayColor2}
              intensity={intensity}
              spread={spread}
              origin={origin}
              tilt={tilt}
              saturation={saturation}
              blend={blend}
              falloff={falloff}
              opacity={opacity}
            />

            <BackgroundContent pillText="New Background" headline="Light cascading from the corner" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="side-rays"
              currentProps={{ speed, rayColor1, rayColor2, intensity, spread, origin, tilt, saturation, blend, falloff, opacity }}
              defaultProps={DEFAULT_PROPS}
            />
          </Flex>

          <Customize>
            <PreviewColorPickerCustom
              title="Ray Color 1"
              color={rayColor1}
              onChange={val => { updateProp('rayColor1', val); forceRerender(); }}
            />

            <PreviewColorPickerCustom
              title="Ray Color 2"
              color={rayColor2}
              onChange={val => { updateProp('rayColor2', val); forceRerender(); }}
            />

            <PreviewSelect
              title="Origin"
              value={origin}
              onChange={value => { updateProp('origin', value); forceRerender(); }}
              width={160}
              options={originOptions}
            />

            <PreviewSlider
              title="Speed"
              min={0.1}
              max={5}
              step={0.1}
              value={speed}
              onChange={value => { updateProp('speed', value); forceRerender(); }}
            />

            <PreviewSlider
              title="Intensity"
              min={0.1}
              max={3}
              step={0.1}
              value={intensity}
              onChange={value => { updateProp('intensity', value); forceRerender(); }}
            />

            <PreviewSlider
              title="Spread"
              min={0.1}
              max={3}
              step={0.1}
              value={spread}
              onChange={value => { updateProp('spread', value); forceRerender(); }}
            />

            <PreviewSlider
              title="Tilt"
              min={-60}
              max={60}
              step={1}
              value={tilt}
              onChange={value => { updateProp('tilt', value); forceRerender(); }}
            />

            <PreviewSlider
              title="Saturation"
              min={0}
              max={2}
              step={0.05}
              value={saturation}
              onChange={value => { updateProp('saturation', value); forceRerender(); }}
            />

            <PreviewSlider
              title="Blend"
              min={0}
              max={1}
              step={0.01}
              value={blend}
              onChange={value => { updateProp('blend', value); forceRerender(); }}
            />

            <PreviewSlider
              title="Falloff"
              min={0.5}
              max={4}
              step={0.1}
              value={falloff}
              onChange={value => { updateProp('falloff', value); forceRerender(); }}
            />

            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.05}
              value={opacity}
              onChange={value => { updateProp('opacity', value); forceRerender(); }}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={sideRays} componentName="SideRays" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default SideRaysDemo;
