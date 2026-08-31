import { useMemo } from 'react';
import { CodeTab, PreviewTab, TabsLayout } from '../../components/common/TabsLayout';
import { Box, Flex } from '@chakra-ui/react';

import Customize from '../../components/common/Preview/Customize';
import CodeExample from '../../components/code/CodeExample';

import PropTable from '../../components/common/Preview/PropTable';
import BackgroundContent from '../../components/common/Preview/BackgroundContent';
import Dependencies from '../../components/code/Dependencies';
import PreviewSlider from '../../components/common/Preview/PreviewSlider';
import PreviewSwitch from '../../components/common/Preview/PreviewSwitch';
import PreviewSelect from '../../components/common/Preview/PreviewSelect';
import PreviewColorPickerCustom from '../../components/common/Preview/PreviewColorPickerCustom';
import useForceRerender from '../../hooks/useForceRerender';
import useComponentProps from '../../hooks/useComponentProps';
import OpenInStudioButton from '../../components/common/Preview/OpenInStudioButton';
import { ComponentPropsProvider } from '../../components/context/ComponentPropsContext';

import { lightRays } from '../../constants/code/Backgrounds/lightRaysCode';
import LightRays from '../../content/Backgrounds/LightRays/LightRays';

const DEFAULT_PROPS = {
  raysOrigin: 'top-center',
  raysColor: '#ffffff',
  raysSpeed: 1,
  lightSpread: 0.5,
  rayLength: 3.0,
  pulsating: false,
  fadeDistance: 1.0,
  saturation: 1.0,
  mouseInfluence: 0.1,
  noiseAmount: 0.0,
  distortion: 0.0
};

const LightRaysDemo = () => {
  const [key, forceRerender] = useForceRerender();
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const {
    raysOrigin,
    raysColor,
    raysSpeed,
    lightSpread,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    mouseInfluence,
    noiseAmount,
    distortion,
    lightMode
  } = props;

  const raysOriginOptions = [
    { value: 'top-center', label: 'Top' },
    { value: 'right', label: 'Right' },
    { value: 'left', label: 'Left' },
    { value: 'bottom-center', label: 'Bottom' }
  ];

  const propData = useMemo(
    () => [
      {
        name: 'raysOrigin',
        type: 'RaysOrigin',
        default: '"top-center"',
        description:
          "Origin position of the light rays. Options: 'top-center', 'top-left', 'top-right', 'right', 'left', 'bottom-center', 'bottom-right', 'bottom-left'"
      },
      {
        name: 'raysColor',
        type: 'string',
        default: '"#ffffff"',
        description: 'Color of the light rays in hex format'
      },
      {
        name: 'raysSpeed',
        type: 'number',
        default: '1',
        description: 'Animation speed of the rays'
      },
      {
        name: 'lightSpread',
        type: 'number',
        default: '1',
        description: 'How wide the light rays spread. Lower values = tighter rays, higher values = wider spread'
      },
      {
        name: 'rayLength',
        type: 'number',
        default: '2',
        description: 'Maximum length/reach of the rays'
      },
      {
        name: 'pulsating',
        type: 'boolean',
        default: 'false',
        description: 'Enable pulsing animation effect'
      },
      {
        name: 'fadeDistance',
        type: 'number',
        default: '1.0',
        description: 'How far rays fade out from origin'
      },
      {
        name: 'saturation',
        type: 'number',
        default: '1.0',
        description: 'Color saturation level (0-1)'
      },
      {
        name: 'followMouse',
        type: 'boolean',
        default: 'true',
        description: 'Make rays rotate towards the mouse cursor'
      },
      {
        name: 'mouseInfluence',
        type: 'number',
        default: '0.1',
        description: 'How much mouse affects rays (0-1)'
      },
      {
        name: 'noiseAmount',
        type: 'number',
        default: '0.0',
        description: 'Add noise/grain to rays (0-1)'
      },
      {
        name: 'distortion',
        type: 'number',
        default: '0.0',
        description: 'Apply wave distortion to rays'
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
            <LightRays
              key={key}
              raysOrigin={raysOrigin}
              raysColor={raysColor}
              raysSpeed={raysSpeed}
              lightSpread={lightSpread}
              rayLength={rayLength}
              pulsating={pulsating}
              fadeDistance={fadeDistance}
              saturation={saturation}
              mouseInfluence={mouseInfluence}
              noiseAmount={noiseAmount}
              distortion={distortion}
              lightMode={lightMode}
            />

            <BackgroundContent pillText="New Background" headline="May these lights guide you on your path" />
          </Box>

          <Flex justify="flex-end" mt={2} mb={-2}>
            <OpenInStudioButton
              backgroundId="light-rays"
              currentProps={{
                raysOrigin,
                raysColor,
                raysSpeed,
                lightSpread,
                rayLength,
                pulsating,
                fadeDistance,
                saturation,
                followMouse: true,
                mouseInfluence,
                noiseAmount,
                distortion
              }}
              defaultProps={{
                raysOrigin: 'top-center',
                raysColor: '#ffffff',
                raysSpeed: 1,
                lightSpread: 1,
                rayLength: 2,
                pulsating: false,
                fadeDistance: 1,
                saturation: 1,
                followMouse: true,
                mouseInfluence: 0.1,
                noiseAmount: 0,
                distortion: 0
              }}
            />
          </Flex>

          <Customize>
            <PreviewColorPickerCustom title="Rays Color" color={raysColor} onChange={val => { updateProp('raysColor', val); forceRerender(); }} />

            <PreviewSelect
              title="Rays Origin"
              value={raysOrigin}
              onChange={value => {
                updateProp('raysOrigin', value);
                forceRerender();
              }}
              width={160}
              options={raysOriginOptions}
            />

            <PreviewSlider
              title="Rays Speed"
              min={0.1}
              max={3}
              step={0.1}
              value={raysSpeed}
              onChange={value => {
                updateProp('raysSpeed', value);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Light Spread"
              min={0.1}
              max={2}
              step={0.1}
              value={lightSpread}
              onChange={value => {
                updateProp('lightSpread', value);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Ray Length"
              min={0.5}
              max={3}
              step={0.1}
              value={rayLength}
              onChange={value => {
                updateProp('rayLength', value);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Fade Distance"
              min={0.5}
              max={2}
              step={0.1}
              value={fadeDistance}
              onChange={value => {
                updateProp('fadeDistance', value);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Saturation"
              min={0}
              max={2}
              step={0.1}
              value={saturation}
              onChange={value => {
                updateProp('saturation', value);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Mouse Influence"
              min={0}
              max={1}
              step={0.1}
              value={mouseInfluence}
              onChange={value => {
                updateProp('mouseInfluence', value);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Noise Amount"
              min={0}
              max={0.5}
              step={0.01}
              value={noiseAmount}
              onChange={value => {
                updateProp('noiseAmount', value);
                forceRerender();
              }}
            />

            <PreviewSlider
              title="Distortion"
              min={0}
              max={1}
              step={0.1}
              value={distortion}
              onChange={value => {
                updateProp('distortion', value);
                forceRerender();
              }}
            />

            <PreviewSwitch
              title="Pulsating"
              isChecked={pulsating}
              onChange={value => {
                updateProp('pulsating', value);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={lightRays} componentName="LightRays" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
};

export default LightRaysDemo;
